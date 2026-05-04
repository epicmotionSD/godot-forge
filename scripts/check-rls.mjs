// Inspect RLS policies on builds, build_logs, artifacts, projects.
const clean = (s) => s.replace(/\\r|\\n|\r|\n/g, "").trim();
const url = clean(process.env.SUPABASE_URL);
const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const r = await fetch(url + "/rest/v1/rpc/pg_policies_dump", {
  method: "POST",
  headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
  body: "{}",
});

if (r.ok) {
  console.log(await r.text());
  process.exit(0);
}

// Fallback: query pg_catalog via PostgREST is not exposed; print a SQL the user can run.
console.log("RPC not available. Run this SQL in Supabase SQL editor:");
console.log(`
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects','builds','build_logs','artifacts')
ORDER BY tablename, cmd;
`);
