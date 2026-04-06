"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const allPlatforms = [
  { id: "windows", label: "Windows", icon: "🪟" },
  { id: "linux", label: "Linux", icon: "🐧" },
  { id: "macos", label: "macOS", icon: "🍎" },
  { id: "web", label: "Web", icon: "🌐" },
  { id: "android", label: "Android", icon: "🤖" },
];

interface Project {
  id: string;
  name: string;
  platforms: string[];
  trigger_on_push: boolean;
  trigger_on_tag: boolean;
  trigger_on_pr: boolean;
  godot_version: string | null;
  project_path: string | null;
  repo_url: string;
  webhook_id: string | null;
}

interface DeployConfig {
  steam: {
    enabled: boolean;
    appId: string;
    depotMap: Record<string, string>;
    branch: string;
    hasUsername: boolean;
    hasPassword: boolean;
  };
  itch: {
    enabled: boolean;
    game: string;
    hasApiKey: boolean;
  };
}

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable state — build settings
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [triggerPush, setTriggerPush] = useState(true);
  const [triggerTag, setTriggerTag] = useState(false);
  const [triggerPr, setTriggerPr] = useState(false);

  // Editable state — deploy settings
  const [deployConfig, setDeployConfig] = useState<DeployConfig | null>(null);
  const [steamEnabled, setSteamEnabled] = useState(false);
  const [steamAppId, setSteamAppId] = useState("");
  const [steamBranch, setSteamBranch] = useState("default");
  const [steamDepotMap, setSteamDepotMap] = useState<Record<string, string>>({});
  const [steamUsername, setSteamUsername] = useState("");
  const [steamPassword, setSteamPassword] = useState("");
  const [itchEnabled, setItchEnabled] = useState(false);
  const [itchGame, setItchGame] = useState("");
  const [itchApiKey, setItchApiKey] = useState("");
  const [deploySaving, setDeploySaving] = useState(false);
  const [deploySaved, setDeploySaved] = useState(false);
  const [deploySaveError, setDeploySaveError] = useState<string | null>(null);

  // Webhook state
  const [webhookSetting, setWebhookSetting] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name, platforms, trigger_on_push, trigger_on_tag, trigger_on_pr, godot_version, project_path, repo_url, webhook_id")
        .eq("id", id)
        .single();

      if (data) {
        setProject(data);
        setPlatforms(data.platforms || []);
        setTriggerPush(data.trigger_on_push ?? true);
        setTriggerTag(data.trigger_on_tag ?? false);
        setTriggerPr(data.trigger_on_pr ?? false);
      }

      // Fetch deploy config
      try {
        const res = await fetch(`/api/projects/${id}/deploy`);
        if (res.ok) {
          const dc: DeployConfig = await res.json();
          setDeployConfig(dc);
          setSteamEnabled(dc.steam.enabled);
          setSteamAppId(dc.steam.appId);
          setSteamBranch(dc.steam.branch);
          setSteamDepotMap(dc.steam.depotMap);
          setItchEnabled(dc.itch.enabled);
          setItchGame(dc.itch.game);
        }
      } catch {
        // Deploy config not available yet
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleWebhookSetup() {
    setWebhookSetting(true);
    setWebhookError(null);
    try {
      const res = await fetch("/api/github/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: id }),
      });
      if (res.ok) {
        const { webhook_id } = await res.json();
        setProject((prev) => prev ? { ...prev, webhook_id } : prev);
      } else {
        const body = await res.json().catch(() => ({}));
        setWebhookError(body.error || `Failed (${res.status})`);
      }
    } catch {
      setWebhookError("Network error — check your connection and try again.");
    } finally {
      setWebhookSetting(false);
    }
  }

  function togglePlatform(platformId: string) {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
    setSaved(false);
  }

  async function handleSave() {
    if (platforms.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms,
          trigger_on_push: triggerPush,
          trigger_on_tag: triggerTag,
          trigger_on_pr: triggerPr,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const body = await res.json().catch(() => ({}));
        setSaveError(body.error || `Save failed (${res.status})`);
      }
    } catch {
      setSaveError("Network error — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeploySave() {
    setDeploySaving(true);
    setDeploySaveError(null);
    try {
      const body: Record<string, unknown> = {
        steam: {
          enabled: steamEnabled,
          appId: steamAppId,
          depotMap: steamDepotMap,
          branch: steamBranch,
          ...(steamUsername ? { username: steamUsername } : {}),
          ...(steamPassword ? { password: steamPassword } : {}),
        },
        itch: {
          enabled: itchEnabled,
          game: itchGame,
          ...(itchApiKey ? { apiKey: itchApiKey } : {}),
        },
      };
      const res = await fetch(`/api/projects/${id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.steam) {
          setDeployConfig(result);
        }
        setSteamUsername("");
        setSteamPassword("");
        setItchApiKey("");
        setDeploySaved(true);
        setTimeout(() => setDeploySaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setDeploySaveError(err.error || `Save failed (${res.status})`);
      }
    } catch {
      setDeploySaveError("Network error");
    } finally {
      setDeploySaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gf-text-muted text-sm">
        Loading settings...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-gf-text-muted text-sm">
        Project not found
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/dashboard"
          className="text-sm text-gf-text-muted hover:text-gf-text transition-colors"
        >
          Projects
        </Link>
        <span className="text-sm text-gf-text-muted">/</span>
        <Link
          href={`/dashboard/projects/${id}`}
          className="text-sm text-gf-text-muted hover:text-gf-text transition-colors"
        >
          {project.name}
        </Link>
        <span className="text-sm text-gf-text-muted">/</span>
      </div>
      <h1 className="text-2xl font-bold text-gf-text mb-8">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Platform Matrix */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gf-text mb-1">
            Export Platforms
          </h2>
          <p className="text-sm text-gf-text-muted mb-4">
            Select which platforms to build for. Each platform runs as a
            separate parallel build.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {allPlatforms.map((p) => {
              const active = platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? "bg-gf-blue/10 border-gf-blue/40 text-gf-blue"
                      : "bg-gf-elevated border-gf-border text-gf-text-muted hover:border-gf-border-hover"
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span>{p.label}</span>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-gf-blue" />
                  )}
                </button>
              );
            })}
          </div>
          {platforms.length === 0 && (
            <p className="text-xs text-gf-red mt-2">
              Select at least one platform
            </p>
          )}
        </div>

        {/* Build Triggers */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gf-text mb-1">
            Build Triggers
          </h2>
          <p className="text-sm text-gf-text-muted mb-4">
            Choose which events automatically start a build.
          </p>
          <div className="space-y-3">
            {[
              {
                label: "Push to branch",
                desc: "Build on every push to the default branch",
                value: triggerPush,
                set: setTriggerPush,
              },
              {
                label: "Tag creation",
                desc: "Build when a new tag is pushed (useful for releases)",
                value: triggerTag,
                set: setTriggerTag,
              },
              {
                label: "Pull requests",
                desc: "Build on PR open and synchronize events",
                value: triggerPr,
                set: setTriggerPr,
              },
            ].map((trigger) => (
              <label
                key={trigger.label}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gf-elevated/50 cursor-pointer"
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={trigger.value}
                  onClick={() => {
                    trigger.set(!trigger.value);
                    setSaved(false);
                  }}
                  className={`mt-0.5 shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                    trigger.value ? "bg-gf-blue" : "bg-gf-elevated border border-gf-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      trigger.value ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>
                <div>
                  <div className="text-sm font-medium text-gf-text">
                    {trigger.label}
                  </div>
                  <div className="text-xs text-gf-text-muted">
                    {trigger.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Webhook Status */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gf-text mb-1">
            Webhook
          </h2>
          <p className="text-sm text-gf-text-muted mb-4">
            GitHub webhook delivers push, tag, and PR events to trigger automatic builds.
          </p>
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                project.webhook_id ? "bg-gf-green" : "bg-gf-red"
              }`}
            />
            <span className="text-sm text-gf-text-secondary">
              {project.webhook_id ? "Webhook active" : "No webhook connected"}
            </span>
          </div>
          {!project.webhook_id && (
            <div className="mt-4">
              <button
                onClick={handleWebhookSetup}
                disabled={webhookSetting}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}
              >
                {webhookSetting ? "Setting up..." : "Setup Webhook"}
              </button>
              {webhookError && (
                <p className="text-sm text-gf-red mt-2">{webhookError}</p>
              )}
            </div>
          )}
        </div>

        {/* Project Info (read-only) */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gf-text mb-4">
            Project Info
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gf-text-muted mb-1">Repository</div>
              <div className="text-sm text-gf-text font-mono">
                {project.repo_url.replace("https://github.com/", "")}
              </div>
            </div>
            <div>
              <div className="text-xs text-gf-text-muted mb-1">
                Godot Version
              </div>
              <div className="text-sm text-gf-text font-mono">
                {project.godot_version || "Auto-detect"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gf-text-muted mb-1">
                Project Path
              </div>
              <div className="text-sm text-gf-text font-mono">
                {project.project_path || "."}
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || platforms.length === 0}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && (
            <span className="text-sm text-gf-green">Settings saved</span>
          )}
          {saveError && (
            <span className="text-sm text-gf-red">{saveError}</span>
          )}
        </div>

        {/* ─── Deploy Configuration ─── */}
        <div className="border-t border-gf-border my-2" />
        <h2 className="text-lg font-bold text-gf-text">Deploy Pipeline</h2>
        <p className="text-sm text-gf-text-muted -mt-4">
          Automatically push builds to Steam and/or itch.io after a successful export.
        </p>

        {/* Steam Deploy */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎮</span>
              <h3 className="text-base font-semibold text-gf-text">Steam (SteamPipe)</h3>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={steamEnabled}
              onClick={() => setSteamEnabled(!steamEnabled)}
              className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                steamEnabled ? "bg-gf-blue" : "bg-gf-elevated border border-gf-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  steamEnabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {steamEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gf-text-muted mb-1">App ID</label>
                <input
                  type="text"
                  value={steamAppId}
                  onChange={(e) => setSteamAppId(e.target.value)}
                  placeholder="480"
                  className="w-full px-3 py-2 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text placeholder:text-gf-text-muted/50 focus:border-gf-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gf-text-muted mb-1">Branch</label>
                <input
                  type="text"
                  value={steamBranch}
                  onChange={(e) => setSteamBranch(e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text placeholder:text-gf-text-muted/50 focus:border-gf-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gf-text-muted mb-2">
                  Depot Mapping <span className="text-gf-text-muted">(platform → Depot ID)</span>
                </label>
                <div className="space-y-2">
                  {platforms.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="text-xs text-gf-text-muted w-20">{p}</span>
                      <input
                        type="text"
                        value={steamDepotMap[p] ?? ""}
                        onChange={(e) =>
                          setSteamDepotMap((prev) => ({ ...prev, [p]: e.target.value }))
                        }
                        placeholder="Depot ID"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text placeholder:text-gf-text-muted/50 focus:border-gf-blue focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gf-text-muted mb-1">
                    Steam Username {deployConfig?.steam.hasUsername && <span className="text-gf-green">(set)</span>}
                  </label>
                  <input
                    type="text"
                    value={steamUsername}
                    onChange={(e) => setSteamUsername(e.target.value)}
                    placeholder={deployConfig?.steam.hasUsername ? "••••••••" : "build-account"}
                    className="w-full px-3 py-2 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text placeholder:text-gf-text-muted/50 focus:border-gf-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gf-text-muted mb-1">
                    Steam Password {deployConfig?.steam.hasPassword && <span className="text-gf-green">(set)</span>}
                  </label>
                  <input
                    type="password"
                    value={steamPassword}
                    onChange={(e) => setSteamPassword(e.target.value)}
                    placeholder={deployConfig?.steam.hasPassword ? "••••••••" : "password"}
                    className="w-full px-3 py-2 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text placeholder:text-gf-text-muted/50 focus:border-gf-blue focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gf-text-muted">
                Use a dedicated Steamworks build account. Disable SteamGuard or use an app-specific password for CI.
              </p>
            </div>
          )}
        </div>

        {/* itch.io Deploy */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕹️</span>
              <h3 className="text-base font-semibold text-gf-text">itch.io (Butler)</h3>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={itchEnabled}
              onClick={() => setItchEnabled(!itchEnabled)}
              className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                itchEnabled ? "bg-gf-blue" : "bg-gf-elevated border border-gf-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  itchEnabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {itchEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gf-text-muted mb-1">Game Slug</label>
                <input
                  type="text"
                  value={itchGame}
                  onChange={(e) => setItchGame(e.target.value)}
                  placeholder="your-username/your-game"
                  className="w-full px-3 py-2 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text placeholder:text-gf-text-muted/50 focus:border-gf-blue focus:outline-none"
                />
                <p className="text-xs text-gf-text-muted mt-1">
                  Format: <code>username/game-name</code> — channels are auto-mapped from platforms (windows, linux, mac, html5, android).
                </p>
              </div>
              <div>
                <label className="block text-xs text-gf-text-muted mb-1">
                  Butler API Key {deployConfig?.itch.hasApiKey && <span className="text-gf-green">(set)</span>}
                </label>
                <input
                  type="password"
                  value={itchApiKey}
                  onChange={(e) => setItchApiKey(e.target.value)}
                  placeholder={deployConfig?.itch.hasApiKey ? "••••••••" : "API key from itch.io settings"}
                  className="w-full px-3 py-2 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text placeholder:text-gf-text-muted/50 focus:border-gf-blue focus:outline-none"
                />
                <p className="text-xs text-gf-text-muted mt-1">
                  Generate at itch.io → Settings → API keys.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Deploy Save button */}
        {(steamEnabled || itchEnabled || deployConfig?.steam.enabled || deployConfig?.itch.enabled) && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeploySave}
              disabled={deploySaving}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}
            >
              {deploySaving ? "Saving..." : "Save Deploy Settings"}
            </button>
            {deploySaved && (
              <span className="text-sm text-gf-green">Deploy settings saved</span>
            )}
            {deploySaveError && (
              <span className="text-sm text-gf-red">{deploySaveError}</span>
            )}
          </div>
        )}

        <Link
          href={`/dashboard/projects/${id}`}
          className="inline-block px-4 py-2.5 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text-secondary hover:border-gf-border-hover transition-colors"
        >
          Back to Project
        </Link>

        {/* Danger Zone */}
        <div className="border-t border-gf-red/20 mt-6 pt-6">
          <h2 className="text-base font-semibold text-gf-red mb-1">Danger Zone</h2>
          <p className="text-sm text-gf-text-muted mb-4">
            Permanently delete this project and all its build history. This cannot be undone.
          </p>
          <div className="bg-gf-card border border-gf-red/30 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gf-text-muted mb-1">
                Type <span className="font-mono text-gf-text">{project.name}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={project.name}
                className="w-full px-3 py-2 rounded-lg bg-gf-elevated border border-gf-red/30 text-sm text-gf-text placeholder:text-gf-text-muted/40 focus:border-gf-red focus:outline-none"
              />
            </div>
            <button
              onClick={async () => {
                if (deleteConfirm !== project.name) return;
                setDeleting(true);
                setDeleteError(null);
                try {
                  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
                  if (res.ok) {
                    router.push("/dashboard");
                  } else {
                    const body = await res.json().catch(() => ({}));
                    setDeleteError(body.error || `Delete failed (${res.status})`);
                  }
                } catch {
                  setDeleteError("Network error — check your connection and try again.");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleteConfirm !== project.name || deleting}
              className="px-4 py-2 rounded-lg bg-gf-red/10 border border-gf-red/40 text-gf-red text-sm font-semibold hover:bg-gf-red/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </button>
            {deleteError && (
              <p className="text-sm text-gf-red">{deleteError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
