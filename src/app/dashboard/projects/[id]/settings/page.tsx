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
}

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable state
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [triggerPush, setTriggerPush] = useState(true);
  const [triggerTag, setTriggerTag] = useState(false);
  const [triggerPr, setTriggerPr] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name, platforms, trigger_on_push, trigger_on_tag, trigger_on_pr, godot_version, project_path, repo_url")
        .eq("id", id)
        .single();

      if (data) {
        setProject(data);
        setPlatforms(data.platforms || []);
        setTriggerPush(data.trigger_on_push ?? true);
        setTriggerTag(data.trigger_on_tag ?? false);
        setTriggerPr(data.trigger_on_pr ?? false);
      }
      setLoading(false);
    }
    load();
  }, [id]);

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
          <Link
            href={`/dashboard/projects/${id}`}
            className="px-4 py-2.5 rounded-lg bg-gf-elevated border border-gf-border text-sm text-gf-text-secondary hover:border-gf-border-hover transition-colors"
          >
            Back to Project
          </Link>
        </div>
      </div>
    </div>
  );
}
