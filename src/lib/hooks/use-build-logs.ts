"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface BuildLog {
  id: string;
  build_id: string;
  phase: string;
  platform: string | null;
  message: string;
  level: string;
  created_at: string;
}

export function useBuildLogs(buildId: string) {
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Fetch existing logs
    async function fetchLogs() {
      const { data } = await supabase
        .from("build_logs")
        .select("*")
        .eq("build_id", buildId)
        .order("created_at", { ascending: true });

      if (data) setLogs(data);
      setLoading(false);
    }

    fetchLogs();

    // Subscribe to new logs via Supabase Realtime
    const channel = supabase
      .channel(`build-logs-${buildId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "build_logs",
          filter: `build_id=eq.${buildId}`,
        },
        (payload) => {
          setLogs((prev) => [...prev, payload.new as BuildLog]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buildId]);

  return { logs, loading };
}
