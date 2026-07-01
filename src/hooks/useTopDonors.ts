import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDailyPlaceholderDonors } from "@/lib/placeholderDonors";

export interface TopDonor {
  display_name: string;
  is_anonymous: boolean;
  total: number;
  donations_count: number;
  is_placeholder?: boolean;
}

const TARGET_COUNT = 3;

function padWithPlaceholders(real: TopDonor[]): TopDonor[] {
  if (real.length >= TARGET_COUNT) return real.slice(0, TARGET_COUNT);
  const placeholders = getDailyPlaceholderDonors(TARGET_COUNT);
  const realNames = new Set(real.map((d) => d.display_name.toLowerCase()));
  const filtered = placeholders.filter((p) => !realNames.has(p.display_name.toLowerCase()));
  const merged = [...real, ...filtered].slice(0, TARGET_COUNT);
  merged.sort((a, b) => b.total - a.total);
  return merged;
}

export function useTopDonors() {
  // Seed synchronously with placeholders so the panel is never empty on first paint.
  const [donors, setDonors] = useState<TopDonor[]>(() => padWithPlaceholders([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      const { data, error } = await supabase.rpc("get_top_donors_week");
      if (cancelled) return;
      if (!error && data) {
        const real: TopDonor[] = (data as any[]).map((d) => ({
          display_name: d.display_name,
          is_anonymous: d.is_anonymous,
          total: Number(d.total),
          donations_count: Number(d.donations_count),
        }));
        setDonors(padWithPlaceholders(real));
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

