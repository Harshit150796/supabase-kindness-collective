import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TopDonor {
  display_name: string;
  is_anonymous: boolean;
  total: number;
  donations_count: number;
}

export function useTopDonors() {
  const [donors, setDonors] = useState<TopDonor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      const { data, error } = await supabase.rpc("get_top_donors_week");
      if (cancelled) return;
      if (!error && data) {
        setDonors(
          (data as any[]).map((d) => ({
            display_name: d.display_name,
            is_anonymous: d.is_anonymous,
            total: Number(d.total),
            donations_count: Number(d.donations_count),
          })),
        );
      }
      setLoading(false);
    };

    load();
    const poll = setInterval(load, 60_000);

    const channel = supabase
      .channel("top-donors-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations" },
        () => {
          if (refreshTimer) clearTimeout(refreshTimer);
          refreshTimer = setTimeout(load, 5000);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  return { donors, loading };
}
