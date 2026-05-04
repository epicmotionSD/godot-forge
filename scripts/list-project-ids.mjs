const clean = (s) => s.replace(/\\r|\\n|\r|\n/g, "").trim();
const url = clean(process.env.SUPABASE_URL);
const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const r = await fetch(url + "/rest/v1/projects?select=id,name", {
  headers: { apikey: key, Authorization: "Bearer " + key },
});
const p = await r.json();
for (const x of p) console.log(x.id, x.name);
