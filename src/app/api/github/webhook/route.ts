import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWebhook } from "@/lib/github";
import { randomBytes } from "crypto";

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

  // Get the project
  const { data: project } = await supabase
    .from("projects")
    .select("id, repo_url, user_id")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get the user's github token
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_token")
    .eq("id", user.id)
    .single();

  if (!profile?.github_token) {
    return NextResponse.json(
      { error: "No GitHub token. Please sign out and sign in again." },
      { status: 403 }
    );
  }

  // Parse owner/repo from repo_url
  const match = project.repo_url.match(
    /github\.com\/([^/]+)\/([^/]+)/
  );
  if (!match) {
    return NextResponse.json(
      { error: "Invalid repo URL" },
      { status: 400 }
    );
  }

  const [, owner, repo] = match;
  const secret = randomBytes(32).toString("hex");
  const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "https://godot-forge.vercel.app" : "http://localhost:3000"}/api/webhooks/github`;

  const result = await createWebhook(
    profile.github_token,
    owner,
    repo,
    webhookUrl,
    secret
  );

  if (!result) {
    return NextResponse.json(
      { error: "Failed to create webhook on GitHub. Check repo permissions." },
      { status: 500 }
    );
  }

  // Save webhook info to the project
  await supabase
    .from("projects")
    .update({
      webhook_id: String(result.id),
      webhook_secret: secret,
      trigger_on_push: true,
      trigger_on_tag: true,
      trigger_on_pr: false,
    })
    .eq("id", project_id);

  return NextResponse.json({ webhook_id: result.id });
}
