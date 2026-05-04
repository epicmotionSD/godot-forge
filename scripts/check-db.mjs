// One-off DB inspection script. Run with:
//   node --env-file=.env.production scripts/check-db.mjs

const clean = (s) => s.replace(/\\r|\\n|\r|\n/g, "").trim();
const url = clean(process.env.SUPABASE_URL);
const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

console.log("Querying:", url);
console.log("");

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function get(path) {
  const r = await fetch(url + path, { headers });
  if (!r.ok) {
    console.error(`HTTP ${r.status} on ${path}: ${await r.text()}`);
    return null;
  }
  return r.json();
}

const profiles = await get(
  "/rest/v1/profiles?select=*&order=created_at.desc"
);
if (profiles) {
  console.log(`=== Users (${profiles.length}) ===`);
  if (profiles.length > 0) console.log("  columns:", Object.keys(profiles[0]).join(", "));
  for (const p of profiles) {
    const id = p.id;
    const handle = p.username || p.github_username || p.full_name || p.display_name || "(no name)";
    const hasToken = p.github_token ? "yes" : "no";
    console.log(`  ${handle} | id=${id} | ${p.created_at} | github_token: ${hasToken}`);
  }
  console.log("");
}

const projects = await get(
  "/rest/v1/projects?select=id,user_id,name,repo_url,godot_version,created_at&order=created_at.desc"
);
if (projects) {
  console.log(`=== Projects (${projects.length}) ===`);
  for (const p of projects) {
    console.log(`  ${p.name} | ${p.repo_url} | godot ${p.godot_version} | ${p.created_at}`);
  }
  console.log("");
}

const builds = await get(
  "/rest/v1/builds?select=id,status,created_at,started_at,finished_at,platforms,project_id&order=created_at.desc&limit=20"
);
if (builds) {
  const counts = builds.reduce((a, b) => ((a[b.status] = (a[b.status] || 0) + 1), a), {});
  console.log(`=== Builds (last 20) ===`);
  console.log(`  status counts:`, counts);
  for (const b of builds) {
    console.log(`  [${b.status}] id=${b.id.slice(0,8)} created=${b.created_at} platforms=${(b.platforms||[]).join(",")}`);
  }
  console.log("");
}

const waitlist = await get("/rest/v1/waitlist?select=email,created_at&order=created_at.desc");
if (waitlist) {
  console.log(`=== Waitlist (${waitlist.length}) ===`);
  for (const w of waitlist) {
    console.log(`  ${w.email} | ${w.created_at}`);
  }
}
