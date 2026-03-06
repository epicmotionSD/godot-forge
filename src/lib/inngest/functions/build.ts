import { inngest } from "@/lib/inngest/client";
import {
  startBuildContainer,
  getDeploymentStatus,
  deleteBuildService,
} from "@/lib/railway";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Run a single platform build: start container, poll, cleanup.
 * Returns the platform result status.
 */
async function runPlatformBuild(
  step: Parameters<Parameters<typeof inngest.createFunction>[2]>[0]["step"],
  opts: {
    buildId: string;
    platform: string;
    repoUrl: string;
    commitSha: string;
    projectPath: string;
  }
) {
  const { buildId, platform, repoUrl, commitSha, projectPath } = opts;

  const deployment = await step.run(
    `start-container-${platform}`,
    async () => {
      return await startBuildContainer({
        buildId,
        repoUrl,
        commitSha,
        projectPath,
        platforms: [platform],
      });
    }
  );

  const status = await step.run(
    `poll-${platform}`,
    async () => {
      const maxAttempts = 40;
      const pollInterval = 30_000;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const { status } = await getDeploymentStatus(deployment.deploymentId);

        if (status === "SUCCESS" || status === "REMOVED") return "success";
        if (status === "FAILED" || status === "CRASHED") return "failed";
      }

      return "failed"; // timeout
    }
  );

  await step.run(`cleanup-${platform}`, async () => {
    try {
      await deleteBuildService(deployment.serviceId);
    } catch {
      // Non-critical
    }
  });

  return { platform, status };
}

export const buildFunction = inngest.createFunction(
  {
    id: "godotforge-build",
    retries: 1,
    cancelOn: [
      {
        event: "build/cancelled",
        match: "data.build_id",
      },
    ],
  },
  { event: "build/requested" },
  async ({ event, step }) => {
    const { build_id } = event.data;
    const supabase = getServiceClient();

    // Step 1: Fetch the build record and project details
    const build = await step.run("fetch-build", async () => {
      const { data, error } = await supabase
        .from("builds")
        .select("*, projects(repo_url, project_path)")
        .eq("id", build_id)
        .single();

      if (error || !data) throw new Error(`Build not found: ${build_id}`);
      return data;
    });

    // Step 2: Mark as running
    await step.run("mark-running", async () => {
      await supabase
        .from("builds")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", build_id);
    });

    // Step 3: Fan out — one container per platform, run in parallel
    const platforms: string[] = build.platforms?.length
      ? build.platforms
      : ["linux"];

    const project = build.projects as {
      repo_url: string;
      project_path: string;
    };

    const results = await Promise.all(
      platforms.map((platform) =>
        runPlatformBuild(step, {
          buildId: build_id,
          platform,
          repoUrl: project.repo_url,
          commitSha: build.commit_sha || "",
          projectPath: project.project_path || ".",
        })
      )
    );

    // Step 4: Aggregate results — overall success only if all platforms passed
    const allSucceeded = results.every((r) => r.status === "success");
    const finalStatus = allSucceeded ? "success" : "failed";

    // Step 5: Finalize build status
    await step.run("finalize", async () => {
      const { data: currentBuild } = await supabase
        .from("builds")
        .select("status")
        .eq("id", build_id)
        .single();

      // Only update if still "running" (container didn't already update it)
      if (currentBuild?.status === "running") {
        await supabase
          .from("builds")
          .update({
            status: finalStatus,
            finished_at: new Date().toISOString(),
          })
          .eq("id", build_id);
      }
    });

    return { build_id, status: finalStatus, platforms: results };
  }
);
