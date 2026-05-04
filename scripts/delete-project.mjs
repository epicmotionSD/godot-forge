// Delete one or more projects (and all related builds/logs/artifacts).
// Run with:
//   node --env-file=.env.production scripts/delete-project.mjs <project_id> [<project_id>...]

const clean = (s) => s.replace(/\\r|\\n|\r|\n/g, "").trim();
const url = clean(process.env.SUPABASE_URL);
const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("Usage: node scripts/delete-project.mjs <project_id> [<project_id>...]");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function del(path) {
  const r = await fetch(url + path, { method: "DELETE", headers });
  if (!r.ok && r.status !== 404 && r.status !== 204) {
    throw new Error(`DELETE ${path} → HTTP ${r.status}: ${await r.text()}`);
  }
  return r;
}

async function get(path) {
  const r = await fetch(url + path, { headers });
  if (!r.ok) throw new Error(`GET ${path} → HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

for (const projectId of ids) {
  console.log(`\n=== Deleting project ${projectId} ===`);

  const builds = await get(`/rest/v1/builds?select=id&project_id=eq.${projectId}`);
  console.log(`  ${builds.length} builds`);

  if (builds.length > 0) {
    const buildIds = builds.map((b) => b.id);
    const inFilter = `(${buildIds.join(",")})`;
    await del(`/rest/v1/build_logs?build_id=in.${inFilter}`);
    console.log(`  build_logs deleted`);
    await del(`/rest/v1/artifacts?build_id=in.${inFilter}`);
    console.log(`  artifacts deleted`);
    await del(`/rest/v1/builds?id=in.${inFilter}`);
    console.log(`  builds deleted`);
  }

  await del(`/rest/v1/projects?id=eq.${projectId}`);
  console.log(`  project deleted ✓`);
}

console.log("\nDone.");
