"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuildNowButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleBuild() {
    setLoading(true);
    try {
      const res = await fetch("/api/builds/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuild}
      disabled={loading}
      className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, #4d8fcc, #e05572)" }}
    >
      {loading ? "Starting..." : "Build Now"}
    </button>
  );
}
