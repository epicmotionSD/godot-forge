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
}): Promise<RailwayDeployResult> {
  const projectId = process.env.RAILWAY_PROJECT_ID!;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID!;
  const tag = opts.godotVersion || "4.3";
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

  // Set the Docker image source (sleepApplication required on Railway Free Tier)
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

  // Set environment variables for the build (trim to strip \r\n from Vercel env vars)
  const envVars: Record<string, string> = {
    BUILD_ID: opts.buildId,
    REPO_URL: opts.repoUrl,
    COMMIT_SHA: opts.commitSha,
    PROJECT_PATH: opts.projectPath,
    PLATFORMS: opts.platforms.join(","),
    SUPABASE_URL: process.env.SUPABASE_URL!.trim(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  };

  if (opts.githubToken) {
    envVars.GITHUB_TOKEN = opts.githubToken;
  }

  await Promise.all(
    Object.entries(envVars).map(([name, value]) =>
      gql(
        `mutation($input: VariableUpsertInput!) {
          variableUpsert(input: $input)
        }`,
        {
          input: {
            projectId,
            environmentId,
            serviceId,
            name,
            value,
          },
        }
      )
    )
  );

  // Trigger deployment via redeploy (deploymentTriggerCreate doesn't work for image-based services)
  await gql(
    `mutation($environmentId: String!, $serviceId: String!) {
      serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
    }`,
    { environmentId, serviceId }
  );

  // Wait briefly then fetch the deployment ID
  await new Promise((r) => setTimeout(r, 1000));
  const deploymentsResult = await gql(
    `query($input: DeploymentListInput!) {
      deployments(input: $input) { edges { node { id status } } }
    }`,
    { input: { serviceId, environmentId } }
  );
  const latestDeployment = deploymentsResult.deployments.edges[0]?.node;
  if (!latestDeployment) {
    throw new Error("No deployment found after serviceInstanceRedeploy");
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
