import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { inngest } from "@/lib/inngest/client";

// Use service-role client — webhooks have no user session
function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifySignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = `sha256=${createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;
  try {
    return timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const event = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");
  const rawBody = await request.text();

  if (!event) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  // Ping event — GitHub sends this when webhook is first registered
  if (event === "ping") {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract repo URL from the event payload
  const repo = body.repository as
    | { html_url?: string; full_name?: string }
    | undefined;
  if (!repo?.html_url) {
    return NextResponse.json({ error: "No repository" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Find the project that matches this repo
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, webhook_secret, trigger_on_push, trigger_on_tag, trigger_on_pr, platforms")
    .eq("repo_url", repo.html_url)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unknown repo" }, { status: 404 });
  }

  // Verify HMAC signature if project has a webhook secret
  if (project.webhook_secret) {
    if (!verifySignature(rawBody, signature, project.webhook_secret)) {
      return NextResponse.json({ error: "Bad signature" }, { status: 401 });
    }
  }

  // Determine trigger type and ref based on event
  let triggerType: string | null = null;
  let triggerRef = "";
  let commitSha = "";
  let commitMessage = "";

  if (event === "push" && project.trigger_on_push) {
    triggerType = "push";
    triggerRef = (body.ref as string) || "";
    const headCommit = body.head_commit as
      | { id?: string; message?: string }
      | undefined;
    commitSha = headCommit?.id || "";
    commitMessage = (headCommit?.message || "").slice(0, 500);
  } else if (
    event === "create" &&
    (body.ref_type as string) === "tag" &&
    project.trigger_on_tag
  ) {
    triggerType = "tag";
    triggerRef = (body.ref as string) || "";
  } else if (
    event === "pull_request" &&
    project.trigger_on_pr &&
    ["opened", "synchronize"].includes(
      (body.action as string) || ""
    )
  ) {
    triggerType = "pull_request";
    const pr = body.pull_request as
      | { head?: { ref?: string; sha?: string }; title?: string }
      | undefined;
    triggerRef = pr?.head?.ref || "";
    commitSha = pr?.head?.sha || "";
    commitMessage = ((pr?.title as string) || "").slice(0, 500);
  }

  if (!triggerType) {
    // Event received but this project doesn't trigger on it
    return NextResponse.json({ skipped: true });
  }

  // Create a build record in queued status
  const { data: build, error } = await supabase
    .from("builds")
    .insert({
      project_id: project.id,
      user_id: project.user_id,
      status: "queued",
      trigger_type: triggerType,
      trigger_ref: triggerRef,
      commit_sha: commitSha,
      commit_message: commitMessage,
      platforms: project.platforms,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create build:", error);
    return NextResponse.json(
      { error: "Failed to create build" },
      { status: 500 }
    );
  }

  // Dispatch to Inngest for build orchestration
  await inngest.send({
    name: "build/requested",
    data: { build_id: build.id },
  });

  return NextResponse.json({ build_id: build.id, trigger: triggerType });
}
