import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BuildNowButton } from "@/components/build-now-button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Get recent builds for this project (with artifacts)
  const { data: builds } = await supabase
    .from("builds")
    .select("*, artifacts(id, platform, file_name, file_size, storage_path)")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const statusColors: Record<string, string> = {
    success: "bg-gf-green",
    failed: "bg-gf-red",
    running: "bg-gf-blue animate-pulse",
    queued: "bg-gf-text-muted",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-sm text-gf-text-muted hover:text-gf-text transition-colors"
            >
              Projects
            </Link>
            <span className="text-sm text-gf-text-muted">/</span>
          </div>
          <h1 className="text-2xl font-bold text-gf-text">{project.name}</h1>
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gf-blue hover:underline font-mono mt-1 inline-block"
          >
            {project.repo_url.replace("https://github.com/", "")} ↗
          </a>
        </div>
        <Link
          href={`/dashboard/projects/${id}/settings`}
          className="px-4 py-2 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text-secondary hover:border-gf-border-hover transition-colors"
        >
          Settings
        </Link>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Engine</div>
          <div className="text-sm font-semibold text-gf-text font-mono">
            {project.godot_version ? `v${project.godot_version}` : "Unknown"}
          </div>
        </div>
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Branch</div>
          <div className="text-sm font-semibold text-gf-text font-mono">
            {project.repo_branch}
          </div>
        </div>
        <div className="bg-gf-card border border-gf-border rounded-xl p-4">
          <div className="text-xs text-gf-text-muted mb-1">Platforms</div>
          <div className="flex gap-1 flex-wrap">
            {(project.platforms as string[])?.map((p: string) => (
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
          <div className="text-xs text-gf-text-muted mb-1">Project Path</div>
          <div className="text-sm font-semibold text-gf-text font-mono">
            {project.project_path || "."}
          </div>
        </div>
      </div>

      {/* Triggers */}
      <div className="bg-gf-card border border-gf-border rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-gf-text mb-3">
          Build Triggers
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                project.trigger_on_push ? "bg-gf-green" : "bg-gf-text-muted"
              }`}
            />
            <span className="text-gf-text-secondary">Push</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                project.trigger_on_tag ? "bg-gf-green" : "bg-gf-text-muted"
              }`}
            />
            <span className="text-gf-text-secondary">Tags</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                project.trigger_on_pr ? "bg-gf-green" : "bg-gf-text-muted"
              }`}
            />
            <span className="text-gf-text-secondary">Pull Requests</span>
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <span
              className={`w-2 h-2 rounded-full ${
                project.webhook_id ? "bg-gf-green" : "bg-gf-red"
              }`}
            />
            <span className="text-gf-text-secondary">
              {project.webhook_id ? "Webhook active" : "No webhook"}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Builds */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gf-text">Recent Builds</h2>
        <BuildNowButton projectId={id} />
      </div>

      {!builds || builds.length === 0 ? (
        <div className="border border-dashed border-gf-border rounded-xl p-10 text-center">
          <div className="text-3xl mb-3">🔨</div>
          <h3 className="text-base font-semibold text-gf-text mb-1">
            No builds yet
          </h3>
          <p className="text-sm text-gf-text-muted max-w-sm mx-auto">
            Click <strong>Build Now</strong> to export your project, or push to{" "}
            <span className="font-mono text-gf-text-secondary">
              {project.repo_branch}
            </span>{" "}
            to trigger builds automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {builds.map((build) => (
            <Link
              key={build.id}
              href={`/dashboard/builds/${build.id}`}
              className="flex items-center gap-4 p-4 bg-gf-card border border-gf-border rounded-xl hover:border-gf-border-hover transition-colors"
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  statusColors[build.status] || "bg-gf-text-muted"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gf-text">
                  {build.trigger_type} — {build.trigger_ref}
                </p>
                <p className="text-xs text-gf-text-muted font-mono truncate">
                  {build.commit_sha?.slice(0, 7)} · {build.commit_message}
                </p>
              </div>
              <span className="text-xs font-mono text-gf-text-secondary capitalize">
                {build.status}
              </span>
              <div className="text-xs text-gf-text-muted">
                {build.duration_seconds
                  ? `${Math.floor(build.duration_seconds / 60)}m ${build.duration_seconds % 60}s`
                  : "—"}
              </div>
              {build.artifacts && build.artifacts.length > 0 && (
                <div className="flex gap-1">
                  {(build.artifacts as { id: string; platform: string; file_name: string }[]).map(
                    (a) => (
                      <span
                        key={a.id}
                        className="px-2 py-0.5 rounded text-xs font-mono bg-gf-blue/10 text-gf-blue"
                      >
                        {a.platform}
                      </span>
                    )
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
