import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const artifactId = request.nextUrl.searchParams.get("artifact_id");
  if (!artifactId) {
    return NextResponse.json({ error: "artifact_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch artifact with ownership check via project
  const { data: artifact } = await supabase
    .from("artifacts")
    .select("*, builds!inner(project_id, projects!inner(user_id))")
    .eq("id", artifactId)
    .single();

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate signed URL for download
  const { data: signedUrl } = await supabase.storage
    .from("artifacts")
    .createSignedUrl(artifact.storage_path.replace("artifacts/", ""), 3600);

  if (!signedUrl?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
