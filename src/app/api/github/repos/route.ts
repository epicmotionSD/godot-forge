import { createClient } from "@/lib/supabase/server";
import { listRepos } from "@/lib/github";
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

  const repos = await listRepos(profile.github_token);

  return NextResponse.json({ repos });
}
