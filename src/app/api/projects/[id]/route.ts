import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Only allow updating specific fields
  const allowedFields = [
    "platforms",
    "trigger_on_push",
    "trigger_on_tag",
    "trigger_on_pr",
    "godot_version",
    "project_path",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  // Validate platforms if provided
  if (updates.platforms) {
    const validPlatforms = ["windows", "linux", "macos", "web", "android"];
    const platforms = updates.platforms as string[];
    if (
      !Array.isArray(platforms) ||
      platforms.length === 0 ||
      !platforms.every((p) => validPlatforms.includes(p))
    ) {
      return NextResponse.json(
        { error: "Invalid platforms" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Project not found or update failed" },
      { status: 404 }
    );
  }

  return NextResponse.json({ project: data });
}
