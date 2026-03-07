import { NextResponse } from "next/server";
import { startBuildContainer, deleteBuildService } from "@/lib/railway";

export const maxDuration = 60;

export async function GET() {
  try {
    const result = await startBuildContainer({
      buildId: "test-diag-00000000",
      repoUrl: "https://github.com/epicmotionSD/roblocs",
      commitSha: "10833902cee00b5c324fb676f117028c0464cc41",
      projectPath: "godot",
      platforms: ["linux"],
      godotVersion: "4.6",
    });

    // Clean up immediately
    try { await deleteBuildService(result.serviceId); } catch {}

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({ ok: false, error: message, stack }, { status: 500 });
  }
}
