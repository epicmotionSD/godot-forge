import { getPlan } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface PlanUsage {
  plan: ReturnType<typeof getPlan>;
  planId: string;
  projectCount: number;
  buildMinutesUsed: number;
  canCreateProject: boolean;
  canStartBuild: boolean;
  platformLimit: number;
}

/**
 * Get a user's current plan and usage stats.
 * Uses service client to bypass RLS (safe for server-side only).
 */
export async function getUserPlanUsage(userId: string): Promise<PlanUsage> {
  const supabase = getServiceClient();

  // Fetch profile + project count in parallel
  const [profileResult, projectCountResult, minutesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    // Build minutes: sum duration_seconds for builds this month
    supabase
      .from("builds")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .in("status", ["success", "failed"]),
  ]);

  const planId = profileResult.data?.plan ?? "starter";
  const plan = getPlan(planId);
  const projectCount = projectCountResult.count ?? 0;

  // Sum build minutes for the current month
  const buildMinutesUsed = Math.ceil(
    (minutesResult.data ?? []).reduce(
      (sum, b) => sum + (b.duration_seconds ?? 0),
      0
    ) / 60
  );

  return {
    plan,
    planId,
    projectCount,
    buildMinutesUsed,
    canCreateProject: projectCount < plan.maxProjects,
    canStartBuild: buildMinutesUsed < plan.buildMinutesPerMonth,
    platformLimit: plan.maxPlatformsPerBuild,
  };
}
