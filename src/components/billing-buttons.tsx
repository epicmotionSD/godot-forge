"use client";

import { useState } from "react";

export function UpgradeButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="px-4 py-2 bg-gf-blue text-white text-sm font-medium rounded-lg hover:bg-gf-blue/90 disabled:opacity-50 transition-colors"
    >
      {loading ? "Redirecting…" : "Upgrade to Indie"}
    </button>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="px-4 py-2 bg-gf-elevated border border-gf-border text-gf-text text-sm font-medium rounded-lg hover:bg-gf-elevated/80 disabled:opacity-50 transition-colors"
    >
      {loading ? "Redirecting…" : "Manage Billing"}
    </button>
  );
}
