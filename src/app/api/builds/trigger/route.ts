import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { project_id } = await request.json();
  if (!project_id) {
    return NextResponse.json(
      { error: "project_id required" },
      { status: 400 }
    );
  }

  // Verify the user owns this project
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, repo_url, repo_branch, platforms")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Create a build record
  const { data: build, error } = await supabase
    .from("builds")
    .insert({
      project_id: project.id,
      user_id: user.id,
      status: "queued",
      trigger_type: "manual",
      trigger_ref: project.repo_branch,
      platforms: project.platforms,
    })
    .select("id")
    .single();

  if (error || !build) {
    console.error("Failed to create build:", error);
    return NextResponse.json(
      { error: "Failed to create build" },
      { status: 500 }
    );
  }

  // Send event to Inngest to start the build
  await inngest.send({
    name: "build/requested",
    data: { build_id: build.id },
  });

  return NextResponse.json({ build_id: build.id });
}
