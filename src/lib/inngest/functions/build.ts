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

function isGitHubRepoUrl(repoUrl: string): boolean {
  return /^https:\/\/github\.com\//i.test(repoUrl.trim());
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
    godotVersion?: string;
    githubToken?: string;
  }
) {
  const { buildId, platform, repoUrl, commitSha, projectPath, godotVersion, githubToken } = opts;
  const supabase = getServiceClient();

  const deployment = await step.run(
    `start-container-${platform}`,
    async () => {
      return await startBuildContainer({
        buildId,
        repoUrl,
        commitSha,
        projectPath,
        platforms: [platform],
        godotVersion,
        githubToken,
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

        // Primary signal: artifact row in Supabase means the build succeeded.
        const { data } = await supabase
          .from("artifacts")
          .select("id")
          .eq("build_id", buildId)
          .eq("platform", platform)
          .limit(1);

        if (data && data.length > 0) {
          return "success";
        }

        // Secondary: Railway status for early failure (image pull error, etc.)
        const { status } = await getDeploymentStatus(deployment.deploymentId);
        if (status === "REMOVED" || status === "FAILED" || status === "CRASHED") {
          return "failed";
        }
      }

      return "failed"; // timeout
    }
  );

  const cleanupOk = await step.run(`cleanup-${platform}`, async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await deleteBuildService(deployment.serviceId);
        return true;
      } catch {
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 2_000));
        }
      }
    }

    return false;
  });

  return {
    platform,
    status:
      cleanupOk && status === "success" ? "success" : "failed",
  };
}

export const buildFunction = inngest.createFunction(
  {
    id: "godotforge-build",
    retries: 0,
    cancelOn: [
      {
        event: "build/cancelled",
        match: "data.build_id",
      },
    ],
  },
  { event: "build/requested" },
  async ({ event, step }) => {
    const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
    };

    const { build_id } = event.data;
    const supabase = getServiceClient();
    let finalStatus: "success" | "failed" = "failed";
    let shouldFinalize = false;
    let results: Array<{ platform: string; status: string }> = [];

    try {
      // Step 1: Fetch the build record, project details, and user's GitHub token
      const build = await step.run("fetch-build", async () => {
        const { data, error } = await supabase
          .from("builds")
          .select("*, projects(repo_url, project_path, godot_version)")
          .eq("id", build_id)
          .single();

        if (error || !data) throw new Error(`Build not found: ${build_id}`);

        // Fetch the user's GitHub token for private repo access
        const { data: profile } = await supabase
          .from("profiles")
          .select("github_token")
          .eq("id", data.user_id)
          .single();

        return { ...data, github_token: profile?.github_token || null };
      });

      const project = build.projects as {
        repo_url: string;
        project_path: string;
        godot_version: string | null;
      };

      // Preflight: fail immediately if GitHub token is required but missing.
      if (isGitHubRepoUrl(project.repo_url) && !build.github_token) {
        await step.run("preflight-missing-github-token", async () => {
          await supabase
            .from("build_logs")
            .insert({
              build_id,
              phase: "clone",
              message: "Missing GitHub token for GitHub repository build",
            });

          await supabase
            .from("builds")
            .update({
              status: "failed",
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
            })
            .eq("id", build_id)
            .in("status", ["queued", "running"]);
        });

        return {
          build_id,
          status: "failed" as const,
          reason: "missing_github_token",
          platforms: [],
        };
      }

      // Step 2: Mark as running
      await step.run("mark-running", async () => {
        await supabase
          .from("builds")
          .update({ status: "running", started_at: new Date().toISOString() })
          .eq("id", build_id)
          .in("status", ["queued", "running"]);
      });

      shouldFinalize = true;

      // Step 3: Fan out — one container per platform, run in parallel
      const requestedPlatforms: string[] = build.platforms?.length
        ? build.platforms
        : ["linux"];

      const normalizedPlatforms = Array.from(
        new Set(
          requestedPlatforms
            .map((platform) => platform?.trim().toLowerCase())
            .filter(Boolean)
        )
      );

      const platforms = normalizedPlatforms.length
        ? normalizedPlatforms
        : ["linux"];

      results = await Promise.all(
        platforms.map((platform) =>
          withTimeout(
            runPlatformBuild(step, {
              buildId: build_id,
              platform,
              repoUrl: project.repo_url,
              commitSha: build.commit_sha || "",
              projectPath: project.project_path || ".",
              godotVersion: project.godot_version || undefined,
              githubToken: build.github_token || undefined,
            }),
            12 * 60_000
          ).catch(() => ({ platform, status: "failed" as const }))
        )
      );

      // Step 4: Aggregate results — overall success only if all platforms passed
      const allSucceeded = results.every((r) => r.status === "success");
      finalStatus = allSucceeded ? "success" : "failed";
    } catch {
      finalStatus = "failed";
      // Do NOT re-throw — allow finalization below to execute.
    }

    // Finalize: runs as a normal step OUTSIDE try/catch so it always executes.
    if (shouldFinalize) {
      try {
        await step.run("finalize", async () => {
          const { data: currentBuild } = await supabase
            .from("builds")
            .select("status")
            .eq("id", build_id)
            .single();

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
      } catch {
        // Fallback: direct Supabase call if step runner is dead
        try {
          await supabase
            .from("builds")
            .update({
              status: "failed",
              finished_at: new Date().toISOString(),
            })
            .eq("id", build_id)
            .eq("status", "running");
        } catch {
          // Nothing more we can do
        }
      }
    }

    return { build_id, status: finalStatus, platforms: results };
  }
);
