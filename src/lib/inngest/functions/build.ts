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

    // Step 3: Start Railway container
    const deployment = await step.run("start-container", async () => {
      const project = build.projects as {
        repo_url: string;
        project_path: string;
      };

      return await startBuildContainer({
        buildId: build_id,
        repoUrl: project.repo_url,
        commitSha: build.commit_sha || "",
        projectPath: project.project_path || ".",
        platforms: build.platforms || ["linux"],
      });
    });

    // Step 4: Poll for completion (check every 30s, up to 20 minutes)
    const finalStatus = await step.run("wait-for-completion", async () => {
      const maxAttempts = 40;
      const pollInterval = 30_000;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const { status } = await getDeploymentStatus(deployment.deploymentId);

        // Railway deployment statuses
        if (status === "SUCCESS" || status === "REMOVED") {
          return "success";
        }
        if (status === "FAILED" || status === "CRASHED") {
          return "failed";
        }
        // DEPLOYING, BUILDING, INITIALIZING — keep polling
      }

      return "failed"; // timeout
    });

    // Step 5: Clean up Railway service
    await step.run("cleanup", async () => {
      try {
        await deleteBuildService(deployment.serviceId);
      } catch {
        // Non-critical — service will idle on Railway
      }
    });

    // Step 6: Finalize build status
    // Note: The container itself updates the build record with artifacts,
    // but we set a fallback here in case the container crashed before updating
    await step.run("finalize", async () => {
      const { data: currentBuild } = await supabase
        .from("builds")
        .select("status")
        .eq("id", build_id)
        .single();

      // Only update if still "running" (container didn't update it)
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

    return { build_id, status: finalStatus };
  }
);
