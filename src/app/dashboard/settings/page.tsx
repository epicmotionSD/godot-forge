import { createClient } from "@/lib/supabase/server";
import { getUserPlanUsage } from "@/lib/plan-usage";
import { PLANS } from "@/lib/stripe";
import { UpgradeButton, ManageBillingButton } from "@/components/billing-buttons";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile for stripe info
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, stripe_subscription_id")
    .eq("id", user!.id)
    .single();

  const usage = await getUserPlanUsage(user!.id);
  const hasSubscription = !!profile?.stripe_subscription_id;

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

        {/* Plan & Billing */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gf-text mb-4">
            Plan & Billing
          </h2>

          {/* Current plan badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                  usage.planId === "indie"
                    ? "bg-gf-blue/10 text-gf-blue border border-gf-blue/20"
                    : "bg-gf-text-muted/10 text-gf-text-secondary border border-gf-border"
                }`}
              >
                {usage.plan.name.toUpperCase()}
              </span>
              <span className="text-sm text-gf-text-secondary">
                {usage.planId === "starter"
                  ? "Free tier"
                  : `$${usage.plan.priceMonthly}/mo`}
              </span>
            </div>
            <div className="flex gap-2">
              {usage.planId === "starter" && PLANS.indie.stripePriceId ? (
                <UpgradeButton priceId={PLANS.indie.stripePriceId} />
              ) : null}
              {hasSubscription ? <ManageBillingButton /> : null}
            </div>
          </div>

          {/* Usage stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Projects */}
            <div className="bg-gf-elevated border border-gf-border rounded-lg p-4">
              <div className="text-xs font-medium text-gf-text-secondary mb-2">
                Projects
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gf-text font-mono">
                  {usage.projectCount}
                </span>
                <span className="text-sm text-gf-text-muted font-mono">
                  / {usage.plan.maxProjects}
                </span>
              </div>
              <UsageBar
                used={usage.projectCount}
                limit={usage.plan.maxProjects}
              />
            </div>

            {/* Build minutes */}
            <div className="bg-gf-elevated border border-gf-border rounded-lg p-4">
              <div className="text-xs font-medium text-gf-text-secondary mb-2">
                Build Minutes
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gf-text font-mono">
                  {usage.buildMinutesUsed}
                </span>
                <span className="text-sm text-gf-text-muted font-mono">
                  / {usage.plan.buildMinutesPerMonth}
                </span>
              </div>
              <UsageBar
                used={usage.buildMinutesUsed}
                limit={usage.plan.buildMinutesPerMonth}
              />
            </div>

            {/* Platforms per build */}
            <div className="bg-gf-elevated border border-gf-border rounded-lg p-4">
              <div className="text-xs font-medium text-gf-text-secondary mb-2">
                Platforms / Build
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gf-text font-mono">
                  {usage.plan.maxPlatformsPerBuild}
                </span>
              </div>
              <div className="text-xs text-gf-text-muted mt-2">
                {usage.planId === "starter"
                  ? "Upgrade for all platforms"
                  : "All platforms included"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const isHigh = pct >= 80;
  return (
    <div className="mt-2 h-1.5 bg-gf-deep rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          isHigh ? "bg-gf-red" : "bg-gf-blue"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
