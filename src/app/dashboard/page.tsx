import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gf-text">Projects</h1>
          <p className="text-sm text-gf-text-secondary mt-1">
            Your Godot projects connected to GodotForge
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-gf-blue to-gf-red text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + New Project
        </Link>
      </div>

      {/* Project list or empty state */}
      {!projects || projects.length === 0 ? (
        <div className="border border-dashed border-gf-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-lg font-semibold text-gf-text mb-2">
            No projects yet
          </h2>
          <p className="text-sm text-gf-text-secondary mb-6 max-w-md mx-auto">
            Connect a GitHub or GitLab repo to start building and deploying your
            Godot game automatically.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex px-5 py-2.5 rounded-lg bg-gf-elevated border border-gf-border text-gf-text text-sm font-medium hover:border-gf-border-hover transition-colors"
          >
            Connect your first repo →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex items-center gap-4 p-4 bg-gf-card border border-gf-border rounded-xl hover:border-gf-border-hover transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gf-elevated border border-gf-border flex items-center justify-center text-lg">
                🎮
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gf-text">
                  {project.name}
                </h3>
                <p className="text-xs text-gf-text-muted font-mono truncate">
                  {project.repo_url}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {project.platforms?.map((p: string) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-gf-elevated text-gf-text-secondary border border-gf-border"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gf-text-muted">
                {project.godot_version && `v${project.godot_version}`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
