import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gf-text">Settings</h1>
        <p className="text-sm text-gf-text-secondary mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gf-text mb-4">
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gf-text-secondary mb-1.5">
                Email
              </label>
              <div className="px-3 py-2.5 bg-gf-elevated border border-gf-border rounded-lg text-sm text-gf-text font-mono">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gf-text-secondary mb-1.5">
                GitHub Username
              </label>
              <div className="px-3 py-2.5 bg-gf-elevated border border-gf-border rounded-lg text-sm text-gf-text font-mono">
                {user?.user_metadata?.user_name ?? "Not connected"}
              </div>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gf-text mb-4">Plan</h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-gf-green/10 text-gf-green border border-gf-green/20">
              BETA
            </span>
            <span className="text-sm text-gf-text-secondary">
              All features unlocked during beta
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
