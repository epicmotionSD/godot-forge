import { createClient } from "@/lib/supabase/server";
import { listRepos, GitHubApiError } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get GitHub token from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_token")
    .eq("id", user.id)
    .single();

  if (!profile?.github_token) {
    return NextResponse.json(
      { error: "GitHub not connected. Please sign out and sign in again." },
      { status: 403 }
    );
  }

  try {
    const repos = await listRepos(profile.github_token);
    return NextResponse.json({ repos });
  } catch (err) {
    if (err instanceof GitHubApiError) {
      // Token expired or revoked — clear it so user gets a clear re-auth prompt
      if (err.status === 401) {
        await supabase
          .from("profiles")
          .update({ github_token: null })
          .eq("id", user.id);
      }
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Failed to fetch repositories from GitHub." },
      { status: 500 }
    );
  }
}
