"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleGitHubLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "repo read:user user:email",
      },
    });
  };

  const handleGitLabLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "gitlab",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "read_user read_repository api",
      },
    });
  };

  return (
    <div className="min-h-screen bg-gf-deep flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gf-blue to-gf-red flex items-center justify-center text-white font-extrabold text-lg">
            ⚒
          </div>
          <span className="font-mono text-xl font-bold text-gf-text tracking-tight">
            GodotForge
          </span>
        </div>

        {/* Card */}
        <div className="bg-gf-card border border-gf-border rounded-xl p-8">
          <h1 className="text-xl font-bold text-gf-text mb-2 text-center">
            Sign in to your account
          </h1>
          <p className="text-sm text-gf-text-secondary mb-8 text-center">
            Connect your GitHub or GitLab to get started
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-gf-red/10 border border-gf-red/20 text-gf-red text-sm text-center">
              Authentication failed. Please try again.
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGitHubLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gf-elevated border border-gf-border rounded-lg text-gf-text font-medium hover:border-gf-border-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <button
              onClick={handleGitLabLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gf-elevated border border-gf-border rounded-lg text-gf-text font-medium hover:border-gf-border-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
              </svg>
              Continue with GitLab
            </button>
          </div>
        </div>

        <p className="text-xs text-gf-text-muted text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
