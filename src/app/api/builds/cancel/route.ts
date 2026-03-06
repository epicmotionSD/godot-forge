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

  const { build_id } = await request.json();
  if (!build_id) {
    return NextResponse.json(
      { error: "build_id required" },
      { status: 400 }
    );
  }

  // Verify the user owns this build
  const { data: build } = await supabase
    .from("builds")
    .select("id, status")
    .eq("id", build_id)
    .eq("user_id", user.id)
    .single();

  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  if (build.status !== "queued" && build.status !== "running") {
    return NextResponse.json(
      { error: "Build cannot be cancelled" },
      { status: 400 }
    );
  }

  // Send cancel event to Inngest (triggers cancelOn in the build function)
  await inngest.send({
    name: "build/cancelled",
    data: { build_id },
  });

  // Update the build status
  await supabase
    .from("builds")
    .update({
      status: "cancelled",
      finished_at: new Date().toISOString(),
    })
    .eq("id", build_id);

  return NextResponse.json({ success: true });
}
