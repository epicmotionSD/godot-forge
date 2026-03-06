"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface BuildStatus {
  id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
}

export function useBuildStatus(buildId: string, initialStatus: string) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`build-status-${buildId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "builds",
          filter: `id=eq.${buildId}`,
        },
        (payload) => {
          setStatus((payload.new as BuildStatus).status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buildId]);

  return status;
}
