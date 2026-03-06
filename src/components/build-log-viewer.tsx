"use client";

import { useBuildLogs, type BuildLog } from "@/lib/hooks/use-build-logs";
import { useEffect, useRef } from "react";

const phaseConfig: Record<string, { label: string; icon: string }> = {
  clone: { label: "Clone", icon: "📥" },
  import: { label: "Import", icon: "📦" },
  export: { label: "Export", icon: "🔨" },
  upload: { label: "Upload", icon: "☁️" },
  deploy: { label: "Deploy", icon: "🚀" },
  error: { label: "Error", icon: "❌" },
  info: { label: "Info", icon: "ℹ️" },
};

const levelColors: Record<string, string> = {
  error: "text-gf-red",
  warn: "text-yellow-400",
  info: "text-gf-text-secondary",
  success: "text-gf-green",
};

function LogLine({ log }: { log: BuildLog }) {
  const phase = phaseConfig[log.phase] || { label: log.phase, icon: "•" };
  const color = levelColors[log.level] || "text-gf-text-secondary";

  return (
    <div className="flex gap-3 py-1 px-3 hover:bg-gf-elevated/50 font-mono text-xs group">
      <span className="text-gf-text-muted shrink-0 w-16 text-right tabular-nums">
        {new Date(log.created_at).toLocaleTimeString()}
      </span>
      <span className="shrink-0 w-5 text-center" title={phase.label}>
        {phase.icon}
      </span>
      {log.platform && (
        <span className="shrink-0 px-1.5 rounded bg-gf-elevated text-gf-text-muted border border-gf-border text-[10px] leading-4">
          {log.platform}
        </span>
      )}
      <span className={color}>{log.message}</span>
    </div>
  );
}

export function BuildLogViewer({
  buildId,
  buildStatus,
}: {
  buildId: string;
  buildStatus: string;
}) {
  const { logs, loading } = useBuildLogs(buildId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Group logs by phase for the progress indicator
  const phases = ["clone", "import", "export", "upload"];
  const completedPhases = new Set(logs.map((l) => l.phase));
  const currentPhase =
    buildStatus === "running"
      ? phases.find((p) => !completedPhases.has(p)) ||
        logs[logs.length - 1]?.phase
      : null;

  return (
    <div className="bg-gf-card border border-gf-border rounded-xl overflow-hidden">
      {/* Phase progress bar */}
      <div className="flex items-center gap-1 px-5 py-3 border-b border-gf-border bg-gf-elevated/50">
        {phases.map((phase, i) => {
          const cfg = phaseConfig[phase];
          const isDone = completedPhases.has(phase);
          const isCurrent = phase === currentPhase;
          return (
            <div key={phase} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={`w-6 h-px mx-1 ${
                    isDone ? "bg-gf-green" : "bg-gf-border"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono ${
                  isCurrent
                    ? "bg-gf-blue/10 text-gf-blue border border-gf-blue/30"
                    : isDone
                    ? "bg-gf-green/10 text-gf-green"
                    : "text-gf-text-muted"
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gf-blue animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log output */}
      <div className="max-h-[500px] overflow-y-auto bg-gf-deep/50">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gf-text-muted">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gf-text-muted">
            {buildStatus === "queued"
              ? "Waiting for build to start..."
              : "No log output yet"}
          </div>
        ) : (
          <div className="py-2">
            {logs.map((log) => (
              <LogLine key={log.id} log={log} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
