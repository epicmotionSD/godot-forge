"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  pushed_at: string;
  language: string | null;
  owner: { login: string; avatar_url: string };
}

interface Detection {
  found: boolean;
  projectPath: string | null;
  godotVersion: string | null;
  exportPresets: string[];
}

const allPlatforms = [
  { id: "windows", label: "Windows", icon: "🪟" },
  { id: "linux", label: "Linux", icon: "🐧" },
  { id: "macos", label: "macOS", icon: "🍎" },
  { id: "web", label: "Web", icon: "🌐" },
  { id: "android", label: "Android", icon: "🤖" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "detect" | "configure">("select");

  // Step 1 — repo selection
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  // Step 2 — detection
  const [detection, setDetection] = useState<Detection | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Step 3 — configure
  const [name, setName] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["windows", "linux"]);
  const [creating, setCreating] = useState(false);

  // Fetch repos on mount
  useEffect(() => {
    async function load() {
      setReposLoading(true);
      const res = await fetch("/api/github/repos");
      if (!res.ok) {
        const data = await res.json();
        setReposError(data.error || "Failed to load repos");
        setReposLoading(false);
        return;
      }
      const data = await res.json();
      setRepos(data.repos);
      setReposLoading(false);
    }
    load();
  }, []);

  // Filter repos by search
  const filtered = useMemo(
    () =>
      repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (r.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
      ),
    [repos, search]
  );

  // Select repo → run detection
  const selectRepo = async (repo: Repo) => {
    setSelectedRepo(repo);
    setName(repo.name);
    setStep("detect");
    setDetecting(true);

    const [owner, repoName] = repo.full_name.split("/");
    const res = await fetch(`/api/github/repos/${owner}/${repoName}/detect`);
    const data: Detection = await res.json();
    setDetection(data);
    setDetecting(false);
    setStep("configure");
  };

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!selectedRepo || !name.trim() || platforms.length === 0) return;
    setCreating(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: name.trim(),
        repo_provider: "github",
        repo_url: selectedRepo.html_url,
        repo_branch: selectedRepo.default_branch,
        godot_version: detection?.godotVersion || null,
        project_path: detection?.projectPath || ".",
        platforms,
      })
      .select("id")
      .single();

    if (error || !project) {
      console.error("Failed to create project:", error);
      setCreating(false);
      return;
    }

    // Register webhook (best-effort — don't block on failure)
    fetch("/api/github/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: project.id }),
    }).catch(() => {});

    router.push(`/dashboard/projects/${project.id}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gf-text mb-2">New Project</h1>
      <p className="text-sm text-gf-text-secondary mb-8">
        Select a GitHub repo and GodotForge will detect your Godot project automatically
      </p>

      {/* Step 1: Select Repository */}
      <div className="bg-gf-card border border-gf-border rounded-xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "select"
                ? "bg-gf-blue/20 border border-gf-blue/30 text-gf-blue"
                : "bg-gf-green/20 border border-gf-green/30 text-gf-green"
            }`}
          >
            {step === "select" ? "1" : "✓"}
          </div>
          <h2 className="text-base font-semibold text-gf-text">
            Select Repository
          </h2>
          {selectedRepo && step !== "select" && (
            <button
              onClick={() => {
                setStep("select");
                setSelectedRepo(null);
                setDetection(null);
              }}
              className="ml-auto text-xs text-gf-text-muted hover:text-gf-text transition-colors"
            >
              Change
            </button>
          )}
        </div>

        {step === "select" ? (
          <>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories..."
              className="w-full px-3 py-2.5 bg-gf-elevated border border-gf-border rounded-lg text-sm text-gf-text font-mono outline-none focus:border-gf-blue transition-colors placeholder:text-gf-text-muted mb-3"
            />

            {/* Repo list */}
            {reposLoading ? (
              <div className="py-8 text-center">
                <div className="text-sm text-gf-text-secondary animate-pulse">
                  Loading your repositories...
                </div>
              </div>
            ) : reposError ? (
              <div className="py-8 text-center">
                <div className="text-sm text-gf-red mb-2">{reposError}</div>
                <p className="text-xs text-gf-text-muted">
                  Try signing out and signing in again to refresh your GitHub connection.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gf-text-muted">
                {search ? "No repos match your search" : "No repositories found"}
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-1.5">
                {filtered.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => selectRepo(repo)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-gf-elevated border border-gf-border hover:border-gf-border-hover transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-gf-card border border-gf-border flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {repo.private ? "🔒" : "📂"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gf-text truncate">
                        {repo.full_name}
                      </div>
                      {repo.description && (
                        <div className="text-xs text-gf-text-muted truncate mt-0.5">
                          {repo.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {repo.language && (
                          <span className="text-xs text-gf-text-secondary">
                            {repo.language}
                          </span>
                        )}
                        <span className="text-xs text-gf-text-muted">
                          {repo.default_branch}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gf-elevated border border-gf-border">
            <div className="w-8 h-8 rounded-md bg-gf-card border border-gf-border flex items-center justify-center text-xs">
              {selectedRepo!.private ? "🔒" : "📂"}
            </div>
            <div>
              <div className="text-sm font-medium text-gf-text">
                {selectedRepo!.full_name}
              </div>
              <div className="text-xs text-gf-text-muted">
                {selectedRepo!.default_branch}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Detection */}
      {(step === "detect" || step === "configure") && (
        <div className="bg-gf-card border border-gf-border rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                detecting
                  ? "bg-gf-blue/20 border border-gf-blue/30 text-gf-blue"
                  : detection?.found
                  ? "bg-gf-green/20 border border-gf-green/30 text-gf-green"
                  : "bg-gf-red/20 border border-gf-red/30 text-gf-red"
              }`}
            >
              {detecting ? "⏳" : detection?.found ? "✓" : "!"}
            </div>
            <h2 className="text-base font-semibold text-gf-text">
              Project Detection
            </h2>
          </div>

          {detecting ? (
            <div className="py-4 text-center">
              <div className="text-sm text-gf-text-secondary animate-pulse">
                Scanning repository for Godot project...
              </div>
            </div>
          ) : detection?.found ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gf-elevated">
                <span className="text-gf-green text-sm">✓</span>
                <span className="text-sm text-gf-text">project.godot found</span>
                <span className="ml-auto text-xs font-mono text-gf-text-muted">
                  {detection.projectPath === "." ? "root" : detection.projectPath}
                </span>
              </div>
              {detection.godotVersion && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gf-elevated">
                  <span className="text-gf-green text-sm">✓</span>
                  <span className="text-sm text-gf-text">Godot Engine</span>
                  <span className="ml-auto text-xs font-mono text-gf-text-muted">
                    v{detection.godotVersion}
                  </span>
                </div>
              )}
              {detection.exportPresets.length > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gf-elevated">
                  <span className="text-gf-green text-sm">✓</span>
                  <span className="text-sm text-gf-text">Export presets</span>
                  <span className="ml-auto text-xs font-mono text-gf-text-muted">
                    {detection.exportPresets.join(", ")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-gf-text-secondary">
                No project.godot found in this repo. You can still set it up manually below.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Configure */}
      <div
        className={`bg-gf-card border border-gf-border rounded-xl p-6 transition-opacity ${
          step !== "configure" ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-full bg-gf-blue/20 border border-gf-blue/30 flex items-center justify-center text-xs font-bold text-gf-blue">
            3
          </div>
          <h2 className="text-base font-semibold text-gf-text">
            Configure Build
          </h2>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gf-text-secondary mb-1.5">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-godot-game"
            className="w-full px-3 py-2.5 bg-gf-elevated border border-gf-border rounded-lg text-sm text-gf-text font-mono outline-none focus:border-gf-blue transition-colors placeholder:text-gf-text-muted"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gf-text-secondary mb-1.5">
            Target Platforms
          </label>
          <div className="grid grid-cols-2 gap-2">
            {allPlatforms.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  platforms.includes(p.id)
                    ? "bg-gf-blue/10 border-gf-blue/30 text-gf-text"
                    : "bg-gf-elevated border-gf-border text-gf-text-secondary hover:border-gf-border-hover"
                }`}
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating || !name.trim() || platforms.length === 0}
          className="w-full py-3 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}
        >
          {creating ? "Creating project..." : "Create Project"}
        </button>
      </div>
    </div>
  );
}
