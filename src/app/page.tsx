"use client";

import { useState } from "react";
import Link from "next/link";

function WaitlistForm({ id }: { id: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center p-4 bg-[rgba(61,220,132,0.08)] border border-[rgba(61,220,132,0.15)] rounded-[10px] text-[var(--accent-green)] font-semibold text-[15px] max-w-[460px] mx-auto">
        🎯 You&apos;re on the list! We&apos;ll email you when the beta opens.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-[460px] mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@gamedev.com"
          required
          className="flex-1 px-[18px] py-[14px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] text-[var(--text-primary)] font-mono text-sm outline-none transition-colors focus:border-[var(--accent-blue)] placeholder:text-[var(--text-muted)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-7 py-[14px] bg-[var(--gradient-brand)] border-none rounded-[10px] text-white font-sans text-[15px] font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}
        >
          {status === "loading" ? "Joining..." : id === "hero" ? "Join Waitlist" : "Get Early Access"}
        </button>
      </form>
      {id === "hero" && (
        <p className="text-center text-[13px] text-[var(--text-muted)] mt-3">
          Free beta access · Indie tier free for 6 months · No spam
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Ambient background */}
      <div className="fixed -top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse, rgba(77,143,204,0.06) 0%, rgba(224,85,114,0.03) 40%, transparent 70%)" }}
      />

      <div className="max-w-[720px] mx-auto px-6 relative z-[1]">
        {/* Nav */}
        <nav className="py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}>
              ⚒
            </div>
            <span className="font-mono text-lg font-bold text-[var(--text-primary)] tracking-[-0.5px]">
              GodotForge
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="font-mono text-xs font-semibold text-[var(--accent-blue)] hover:text-[var(--text-primary)] transition-colors no-underline"
            >
              Sign In
            </Link>
            <span className="font-mono text-[11px] font-semibold text-[var(--accent-green)] bg-[rgba(61,220,132,0.08)] border border-[rgba(61,220,132,0.15)] px-3 py-1 rounded-full tracking-[0.5px]">
              BETA COMING SOON
            </span>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-20 pb-[60px] text-center">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[var(--accent-red)] bg-[rgba(224,85,114,0.08)] border border-[rgba(224,85,114,0.15)] px-4 py-1.5 rounded-3xl tracking-[0.3px] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] animate-pulse" />
            W4 Build is dead. The replacement is here.
          </div>
          <h1 className="text-[clamp(36px,6vw,52px)] font-bold leading-[1.1] tracking-[-1.5px] mb-5">
            Ship your Godot game.
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #4d8fcc, #e05572)" }}>
              Not YAML.
            </span>
          </h1>
          <p className="text-[17px] text-[var(--text-secondary)] max-w-[520px] mx-auto mb-10 leading-[1.7]">
            The managed CI/CD platform built exclusively for Godot Engine.
            Connect your repo, pick your platforms, deploy to Steam and itch.io.
            No Docker. No config files. No DevOps degree.
          </p>
          <WaitlistForm id="hero" />
        </section>

        {/* Problem / Solution */}
        <section className="py-[60px]">
          {/* Terminal mockup */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-10">
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="font-mono text-[11px] text-[var(--text-muted)] ml-2">your-current-workflow.sh</span>
            </div>
            <div className="p-5 font-mono text-[13px] leading-[2]">
              <div className="flex gap-3"><span className="text-[var(--accent-blue)]">$</span><span>vim .github/workflows/godot-build.yml</span></div>
              <div className="flex gap-3"><span className="text-[var(--text-muted)] italic"># 87 lines of YAML later...</span></div>
              <div className="flex gap-3"><span className="text-[var(--accent-blue)]">$</span><span>git push origin main</span></div>
              <div className="flex gap-3"><span className="text-[var(--accent-red)]">✗ Build failed: .godot folder not found</span></div>
              <div className="flex gap-3"><span className="text-[var(--accent-blue)]">$</span><span className="text-[var(--text-muted)] italic"># Google for 45 minutes...</span></div>
              <div className="flex gap-3"><span className="text-[var(--accent-blue)]">$</span><span>git push origin main</span></div>
              <div className="flex gap-3"><span className="text-[var(--accent-red)]">✗ Export failed: template not installed</span></div>
              <div className="flex gap-3"><span className="text-[var(--accent-blue)]">$</span><span className="text-[var(--text-muted)] italic"># Give up. Export manually from editor. Again.</span></div>
            </div>
          </div>

          {/* VS comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-5 items-center">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
              <div className="font-mono text-[11px] font-bold tracking-[1px] text-[var(--accent-red)] mb-4">WITHOUT GODOTFORGE</div>
              {["😤 Write YAML for each platform", "🐳 Configure Docker images", "🔧 Debug headless export issues", "📦 Manually upload to Steam/itch", "🔁 Redo everything per update"].map((item) => (
                <div key={item} className="text-sm text-[var(--text-secondary)] py-1.5">{item}</div>
              ))}
            </div>
            <div className="font-mono text-2xl text-[var(--text-muted)] text-center hidden sm:block">→</div>
            <div className="bg-[var(--bg-card)] border border-[rgba(77,143,204,0.3)] rounded-xl p-6" style={{ background: "linear-gradient(135deg, rgba(77,143,204,0.04), var(--bg-card))" }}>
              <div className="font-mono text-[11px] font-bold tracking-[1px] text-[var(--accent-blue)] mb-4">WITH GODOTFORGE</div>
              {["🔗 Connect GitHub repo", "🎯 Toggle platforms in a UI", "⚡ Push code, builds run", "🚀 Auto-deploy to Steam/itch", "😎 Go make your game"].map((item) => (
                <div key={item} className="text-sm text-[var(--text-secondary)] py-1.5">{item}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-[60px]">
          <div className="font-mono text-[11px] font-bold tracking-[1.5px] text-[var(--accent-blue)] mb-3">MVP FEATURES</div>
          <h2 className="text-[28px] font-bold tracking-[-0.5px] mb-10">Everything you need to ship</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: "🔍", name: "Auto-Detect Everything", desc: "Connect your repo and GodotForge finds your project.godot, reads your export presets, and detects your engine version automatically." },
              { icon: "🖥️", name: "Visual Build Matrix", desc: "Toggle Windows, Linux, macOS, Android, and Web exports from a dashboard. No config files. Parallel builds across platforms." },
              { icon: "📡", name: "Real-Time Build Logs", desc: "Watch your builds stream live. See exactly what's happening at each phase: clone, import, export, upload. Debug failures instantly." },
              { icon: "🚂", name: "Deploy to Steam", desc: "One-click Steam deployment via SteamCMD. Configure your app ID and depot mappings once, then every build auto-deploys." },
              { icon: "🎮", name: "Deploy to itch.io", desc: "Butler integration built-in. Enter your API key and game slug — builds go straight to your itch.io page with proper channel mapping." },
              { icon: "⚡", name: "Build on Push", desc: "GitHub and GitLab webhooks trigger builds automatically. Push to main? Build. Create a tag? Release build. You set the rules." },
            ].map((f) => (
              <div key={f.name} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--border-hover)] transition-colors">
                <div className="text-[22px] mb-3">{f.icon}</div>
                <div className="text-[15px] font-semibold mb-1.5">{f.name}</div>
                <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="py-[60px]">
          <div className="font-mono text-[11px] font-bold tracking-[1.5px] text-[var(--accent-blue)] mb-3">SIMPLE PRICING</div>
          <h2 className="text-[28px] font-bold tracking-[-0.5px] mb-10">Free to start. Scale when you ship.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-7">
              <div className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Starter</div>
              <div className="text-4xl font-bold tracking-[-1px] mb-1">$0<span className="text-base text-[var(--text-muted)] font-normal">/mo</span></div>
              <div className="text-[13px] text-[var(--text-muted)] mb-5">For game jams and hobby projects</div>
              {["2 projects", "100 build min/month", "2 platforms per build", "7-day artifact retention", "Community support"].map((f) => (
                <div key={f} className="text-[13px] text-[var(--text-secondary)] py-1.5 flex items-center gap-2">
                  <span className="text-[var(--accent-green)] text-sm">✓</span> {f}
                </div>
              ))}
            </div>
            <div className="bg-[var(--bg-card)] border border-[rgba(77,143,204,0.3)] rounded-xl p-7 relative" style={{ background: "linear-gradient(135deg, rgba(77,143,204,0.04), var(--bg-card))" }}>
              <div className="absolute -top-px right-5 text-white font-mono text-[9px] font-bold tracking-[1px] px-3 py-1 rounded-b-md" style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}>MOST POPULAR</div>
              <div className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Indie</div>
              <div className="text-4xl font-bold tracking-[-1px] mb-1">$19<span className="text-base text-[var(--text-muted)] font-normal">/mo</span></div>
              <div className="text-[13px] text-[var(--text-muted)] mb-5">For devs shipping real games</div>
              {["10 projects", "500 build min/month", "All platforms", "Steam + itch.io deploy", "30-day artifact retention", "Priority builds"].map((f) => (
                <div key={f} className="text-[13px] text-[var(--text-secondary)] py-1.5 flex items-center gap-2">
                  <span className="text-[var(--accent-green)] text-sm">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 text-center">
          <h2 className="text-[28px] font-bold tracking-[-0.5px] mb-3">Beta launches in 8 weeks</h2>
          <p className="text-[var(--text-secondary)] mb-8 text-base">Join the waitlist for free early access and 6 months of Indie tier — on the house.</p>
          <WaitlistForm id="cta" />
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-[var(--border)] text-center text-[13px] text-[var(--text-muted)]">
          <p>GodotForge is a <span className="text-[var(--text-secondary)]">Sonnier Ventures</span> product · Built with Godot devs, for Godot devs</p>
          <p className="mt-2">Not affiliated with the Godot Engine project or Godot Foundation</p>
        </footer>
      </div>
    </>
  );
}
