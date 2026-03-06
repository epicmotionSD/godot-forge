import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BuildDetailClient } from "./build-detail-client";

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: build } = await supabase
    .from("builds")
    .select(
      "*, projects(id, name, repo_url), artifacts(id, platform, file_name, file_size, storage_path)"
    )
    .eq("id", id)
    .single();

  if (!build) notFound();

  const project = build.projects as {
    id: string;
    name: string;
    repo_url: string;
  } | null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1 text-sm text-gf-text-muted">
        <Link
          href="/dashboard"
          className="hover:text-gf-text transition-colors"
        >
          Projects
        </Link>
        <span>/</span>
        {project && (
          <>
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="hover:text-gf-text transition-colors"
            >
              {project.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gf-text-secondary">
          Build {build.id.slice(0, 8)}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gf-text">
            Build {build.id.slice(0, 8)}
          </h1>
          {build.commit_message && (
            <p className="text-sm text-gf-text-secondary mt-1 max-w-lg truncate">
              {build.commit_message}
            </p>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Trigger</div>
          <div className="text-sm font-semibold text-gf-text capitalize">
            {build.trigger_type || "—"}
          </div>
        </div>
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Ref</div>
          <div className="text-sm font-semibold text-gf-text font-mono truncate">
            {build.trigger_ref || "—"}
          </div>
        </div>
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Commit</div>
          <div className="text-sm font-semibold text-gf-text font-mono">
            {build.commit_sha?.slice(0, 7) || "—"}
          </div>
        </div>
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Platforms</div>
          <div className="flex gap-1 flex-wrap">
            {(build.platforms as string[])?.map((p: string) => (
              <span
                key={p}
                className="px-1.5 py-0.5 rounded text-xs font-mono bg-gf-elevated text-gf-text-secondary border border-gf-border"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Duration</div>
          <div className="text-sm font-semibold text-gf-text">
            {build.duration_seconds
              ? `${Math.floor(build.duration_seconds / 60)}m ${build.duration_seconds % 60}s`
              : "—"}
          </div>
        </div>
      </div>

      {/* Client part: live status, logs, artifacts */}
      <BuildDetailClient
        buildId={build.id}
        initialStatus={build.status}
        artifacts={
          (build.artifacts as {
            id: string;
            platform: string;
            file_name: string;
            file_size: number | null;
          }[]) || []
        }
      />
    </div>
  );
}
