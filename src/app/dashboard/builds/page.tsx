import { createClient } from "@/lib/supabase/server";

export default async function BuildsPage() {
  const supabase = await createClient();
  const { data: builds } = await supabase
    .from("builds")
    .select("*, projects(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gf-text">Builds</h1>
        <p className="text-sm text-gf-text-secondary mt-1">
          Build history across all your projects
        </p>
      </div>

      {!builds || builds.length === 0 ? (
        <div className="border border-dashed border-gf-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🔨</div>
          <h2 className="text-lg font-semibold text-gf-text mb-2">
            No builds yet
          </h2>
          <p className="text-sm text-gf-text-secondary max-w-md mx-auto">
            Builds will appear here once you connect a project and trigger your first build.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {builds.map((build) => (
            <div
              key={build.id}
              className="flex items-center gap-4 p-4 bg-gf-card border border-gf-border rounded-xl"
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  build.status === "success"
                    ? "bg-gf-green"
                    : build.status === "failed"
                    ? "bg-gf-red"
                    : build.status === "running"
                    ? "bg-gf-blue animate-pulse"
                    : "bg-gf-text-muted"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gf-text">
                  {(build as any).projects?.name ?? "Unknown project"}
                </p>
                <p className="text-xs text-gf-text-muted font-mono truncate">
                  {build.commit_sha?.slice(0, 7)} · {build.commit_message}
                </p>
              </div>
              <div className="text-xs font-mono text-gf-text-secondary">
                {build.trigger_type}
              </div>
              <div className="text-xs text-gf-text-muted">
                {build.duration_seconds
                  ? `${Math.floor(build.duration_seconds / 60)}m ${build.duration_seconds % 60}s`
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
