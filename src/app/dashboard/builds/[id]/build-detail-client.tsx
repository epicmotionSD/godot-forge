"use client";

import { useBuildStatus } from "@/lib/hooks/use-build-status";
import { BuildLogViewer } from "@/components/build-log-viewer";

const statusConfig: Record<
  string,
  { color: string; label: string; bg: string }
> = {
  queued: {
    color: "text-gf-text-muted",
    label: "Queued",
    bg: "bg-gf-text-muted",
  },
  running: {
    color: "text-gf-blue",
    label: "Running",
    bg: "bg-gf-blue animate-pulse",
  },
  success: { color: "text-gf-green", label: "Success", bg: "bg-gf-green" },
  failed: { color: "text-gf-red", label: "Failed", bg: "bg-gf-red" },
  cancelled: {
    color: "text-gf-text-muted",
    label: "Cancelled",
    bg: "bg-gf-text-muted",
  },
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const platformIcons: Record<string, string> = {
  windows: "🪟",
  linux: "🐧",
  macos: "🍎",
  web: "🌐",
  android: "🤖",
};

export function BuildDetailClient({
  buildId,
  initialStatus,
  artifacts,
}: {
  buildId: string;
  initialStatus: string;
  artifacts: {
    id: string;
    platform: string;
    file_name: string;
    file_size: number | null;
  }[];
}) {
  const status = useBuildStatus(buildId, initialStatus);
  const cfg = statusConfig[status] || statusConfig.queued;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="flex items-center gap-3 bg-gf-card border border-gf-border rounded-xl p-4">
        <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
        <span className={`text-sm font-semibold ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Build Logs */}
      <div>
        <h2 className="text-lg font-semibold text-gf-text mb-3">Build Logs</h2>
        <BuildLogViewer buildId={buildId} buildStatus={status} />
      </div>

      {/* Artifacts */}
      <div>
        <h2 className="text-lg font-semibold text-gf-text mb-3">Artifacts</h2>
        {artifacts.length === 0 ? (
          <div className="border border-dashed border-gf-border rounded-xl p-8 text-center">
            <p className="text-sm text-gf-text-muted">
              {status === "running" || status === "queued"
                ? "Artifacts will appear here once the build completes."
                : "No artifacts produced by this build."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {artifacts.map((artifact) => (
              <a
                key={artifact.id}
                href={`/api/builds/download?artifact_id=${artifact.id}`}
                className="flex items-center gap-3 bg-gf-card border border-gf-border rounded-xl p-4 hover:border-gf-border-hover transition-colors group"
              >
                <span className="text-2xl">
                  {platformIcons[artifact.platform] || "📦"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gf-text capitalize">
                    {artifact.platform}
                  </p>
                  <p className="text-xs text-gf-text-muted font-mono truncate">
                    {artifact.file_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gf-text-muted">
                    {formatSize(artifact.file_size)}
                  </p>
                  <span className="text-xs text-gf-blue group-hover:underline">
                    Download
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
