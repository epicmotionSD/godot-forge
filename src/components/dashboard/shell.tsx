"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Projects", icon: "📦" },
  { href: "/dashboard/builds", label: "Builds", icon: "🔨" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gf-deep flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-gf-border bg-gf-card flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gf-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gf-blue to-gf-red flex items-center justify-center text-white font-extrabold text-sm">
              ⚒
            </div>
            <span className="font-mono text-base font-bold text-gf-text tracking-tight">
              GodotForge
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gf-elevated text-gf-text border border-gf-border"
                    : "text-gf-text-secondary hover:text-gf-text hover:bg-gf-elevated/50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gf-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gf-elevated border border-gf-border flex items-center justify-center text-xs font-mono text-gf-text-secondary">
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gf-text truncate">
                {user.user_metadata?.user_name ?? user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full mt-2 px-3 py-2 text-xs text-gf-text-muted hover:text-gf-text-secondary transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
