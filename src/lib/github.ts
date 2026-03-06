const GITHUB_API = "https://api.github.com";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  pushed_at: string;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GodotDetection {
  found: boolean;
  projectPath: string | null;
  godotVersion: string | null;
  exportPresets: string[];
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function listRepos(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  // Fetch up to 3 pages (300 repos)
  while (page <= 3) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?sort=pushed&per_page=100&page=${page}`,
      { headers: headers(token) }
    );
    if (!res.ok) break;
    const batch: GitHubRepo[] = await res.json();
    if (batch.length === 0) break;
    repos.push(...batch);
    page++;
  }

  return repos;
}

export async function detectGodotProject(
  token: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<GodotDetection> {
  const result: GodotDetection = {
    found: false,
    projectPath: null,
    godotVersion: null,
    exportPresets: [],
  };

  // Get repo contents at the given path
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    { headers: headers(token) }
  );
  if (!res.ok) return result;

  const contents: { name: string; type: string; path: string; download_url: string | null }[] =
    await res.json();

  if (!Array.isArray(contents)) return result;

  // Look for project.godot
  const projectFile = contents.find((f) => f.name === "project.godot");
  if (projectFile) {
    result.found = true;
    result.projectPath = path || ".";

    // Fetch project.godot to get engine version
    if (projectFile.download_url) {
      const fileRes = await fetch(projectFile.download_url);
      if (fileRes.ok) {
        const text = await fileRes.text();
        // Look for config_version or features with engine version
        const versionMatch = text.match(
          /config\/features=PackedStringArray\(([^)]+)\)/
        );
        if (versionMatch) {
          const features = versionMatch[1];
          const engineMatch = features.match(/"(\d+\.\d+(?:\.\d+)?)"/);
          if (engineMatch) {
            result.godotVersion = engineMatch[1];
          }
        }
      }
    }

    // Look for export_presets.cfg
    const presetsFile = contents.find(
      (f) => f.name === "export_presets.cfg"
    );
    if (presetsFile && presetsFile.download_url) {
      const presetsRes = await fetch(presetsFile.download_url);
      if (presetsRes.ok) {
        const text = await presetsRes.text();
        // Extract preset names
        const presetRegex = /\nname="([^"]+)"/g;
        let presetMatch;
        while ((presetMatch = presetRegex.exec(text)) !== null) {
          result.exportPresets.push(presetMatch[1]);
        }
      }
    }

    return result;
  }

  // Check subdirectories (1 level deep) for project.godot
  if (!path) {
    const dirs = contents.filter((f) => f.type === "dir").slice(0, 10);
    for (const dir of dirs) {
      const sub = await detectGodotProject(token, owner, repo, dir.path);
      if (sub.found) return sub;
    }
  }

  return result;
}

export async function createWebhook(
  token: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string
): Promise<{ id: number } | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["push", "create", "pull_request"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return { id: data.id };
}
