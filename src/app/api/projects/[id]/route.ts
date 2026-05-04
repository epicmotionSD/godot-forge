import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE(
  _request: NextRequest,
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

  // Verify the project belongs to this user
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Cascade-delete via service role: RLS only has DELETE policies on `projects`,
  // not on `builds`/`build_logs`/`artifacts`, so a user-scoped delete on those
  // tables is silently a no-op and the FK to `builds.project_id` blocks the
  // project delete. Ownership has already been verified above.
  const service = createServiceClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: builds } = await service
    .from("builds")
    .select("id")
    .eq("project_id", id);

  if (builds && builds.length > 0) {
    const buildIds = builds.map((b) => b.id);
    await service.from("build_logs").delete().in("build_id", buildIds);
    await service.from("artifacts").delete().in("build_id", buildIds);
    await service.from("builds").delete().in("id", buildIds);
  }

  const { error } = await service.from("projects").delete().eq("id", id);

  if (error) {
    console.error("[DELETE /api/projects]", error.code, error.message, error.details);
    return NextResponse.json(
      { error: "Delete failed", code: error.code, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

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
