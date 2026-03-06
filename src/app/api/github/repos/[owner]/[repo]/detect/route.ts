import { createClient } from "@/lib/supabase/server";
import { detectGodotProject } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_token")
    .eq("id", user.id)
    .single();

  if (!profile?.github_token) {
    return NextResponse.json(
      { error: "GitHub not connected" },
      { status: 403 }
    );
  }

  const detection = await detectGodotProject(
    profile.github_token,
    owner,
    repo
  );

  return NextResponse.json(detection);
}
