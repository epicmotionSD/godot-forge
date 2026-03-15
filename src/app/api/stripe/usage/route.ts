import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanUsage } from "@/lib/plan-usage";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getUserPlanUsage(user.id);

  return NextResponse.json({
    planId: usage.planId,
    plan: usage.plan.name,
    projectCount: usage.projectCount,
    maxProjects: usage.plan.maxProjects,
    buildMinutesUsed: usage.buildMinutesUsed,
    buildMinutesLimit: usage.plan.buildMinutesPerMonth,
    platformLimit: usage.plan.maxPlatformsPerBuild,
    canCreateProject: usage.canCreateProject,
    canStartBuild: usage.canStartBuild,
  });
}
