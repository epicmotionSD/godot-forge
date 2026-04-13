const RAILWAY_API = "https://backboard.railway.app/graphql/v2";

interface RailwayDeployResult {
  serviceId: string;
  deploymentId: string;
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function gql(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Railway API error (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (data.errors) {
    throw new Error(`Railway GraphQL error: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

/**
 * Create a one-off Railway service from the builder Docker image,
 * passing build-specific env vars, and trigger a deployment.
 */
export async function startBuildContainer(opts: {
  buildId: string;
  repoUrl: string;
  commitSha: string;
  projectPath: string;
  platforms: string[];
  godotVersion?: string;
  githubToken?: string;
  deployEnv?: Record<string, string>;
}): Promise<RailwayDeployResult> {
  const isGitHubRepo = /^https:\/\/github\.com\//i.test(opts.repoUrl.trim());
  if (isGitHubRepo && !opts.githubToken) {
    throw new Error(`Missing GitHub token for GitHub repository build: ${opts.repoUrl}`);
  }

  const projectId = process.env.RAILWAY_PROJECT_ID!;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID!;
  const tag = opts.godotVersion || "4.6";
  const builderImage = process.env.GODOT_BUILDER_IMAGE || `ghcr.io/epicmotionsd/godot-builder:${tag}`;

  // Create a service for this build (include platform to avoid name collisions)
  const platform = opts.platforms[0] || 'default';
  const createResult = await gql(
    `mutation($input: ServiceCreateInput!) {
      serviceCreate(input: $input) { id }
    }`,
    {
      input: {
        projectId,
        name: `build-${opts.buildId.slice(0, 8)}-${platform}`,
      },
    }
  );
  const serviceId = createResult.serviceCreate.id;

  // Set environment variables for the build (trim to strip \r\n from Vercel env vars)
  const envVars: Record<string, string> = {
    BUILD_ID: opts.buildId,
    REPO_URL: opts.repoUrl,
    COMMIT_SHA: opts.commitSha,
    PROJECT_PATH: opts.projectPath,
    PLATFORM: opts.platforms[0] || "linux",
    PLATFORMS: opts.platforms.join(","),
    SUPABASE_URL: process.env.SUPABASE_URL!.trim(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  };

  if (opts.githubToken) {
    envVars.GITHUB_TOKEN = opts.githubToken;
  }

  // Deploy-phase env vars (decrypted credentials from project config)
  if (opts.deployEnv) {
    for (const [k, v] of Object.entries(opts.deployEnv)) {
      envVars[k] = v;
    }
  }

  // Set the image first (does NOT trigger a deployment on its own).
  await gql(
    `mutation($id: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $id, input: $input)
    }`,
    {
      id: serviceId,
      input: {
        source: { image: builderImage },
        sleepApplication: true,
      },
    }
  );

  // Apply env vars WITHOUT skipDeploys so Railway creates a deployment
  // with both the image and env vars already configured.
  await gql(
    `mutation($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }`,
    {
      input: {
        projectId,
        environmentId,
        serviceId,
        variables: envVars,
      },
    }
  );

  // Poll for the deployment ID — Railway may take a few seconds to create it.
  let latestDeployment: { id: string; status: string } | undefined;
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    const deploymentsResult = await gql(
      `query($input: DeploymentListInput!) {
        deployments(input: $input) { edges { node { id status } } }
      }`,
      { input: { serviceId, environmentId } }
    );
    latestDeployment = deploymentsResult.deployments.edges
      .map((edge: { node: { id: string; status: string } }) => edge.node)
      .find((deployment: { id: string; status: string }) => deployment.status !== "REMOVED");
    if (latestDeployment) break;
  }

  if (!latestDeployment) {
    throw new Error("No active deployment found after serviceInstanceUpdate");
  }

  return {
    serviceId,
    deploymentId: latestDeployment.id,
  };
}

/**
 * Check the status of a Railway deployment.
 */
export async function getDeploymentStatus(
  deploymentId: string
): Promise<{ status: string; }> {
  const result = await gql(
    `query($id: String!) {
      deployment(id: $id) { status }
    }`,
    { id: deploymentId }
  );
  return { status: result.deployment.status };
}

/**
 * Clean up the one-off service after build completes.
 */
export async function deleteBuildService(serviceId: string): Promise<void> {
  await gql(
    `mutation($id: String!) {
      serviceDelete(id: $id)
    }`,
    { id: serviceId }
  );
}
