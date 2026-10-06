import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TopDonor {
  display_name: string;
  is_anonymous: boolean;
  total: number;
  donations_count: number;
  is_placeholder?: boolean;
}

const TARGET_COUNT = 3;

// One shared store per page: every panel using this hook shares a single
// request, poll and realtime channel (the hero renders two panels).
type State = { donors: TopDonor[]; loading: boolean };
let state: State = { donors: [], loading: true };
const listeners = new Set<(s: State) => void>();
let stop: (() => void) | null = null;

function start() {
  let cancelled = false;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  const load = async () => {
    const { data, error } = await supabase.rpc("get_top_donors_week");
    if (cancelled) return;
    const donors = !error && data
      ? (data as any[]).map((d) => ({
          display_name: d.display_name,
          is_anonymous: d.is_anonymous,
          total: Number(d.total),
          donations_count: Number(d.donations_count),
        })).slice(0, TARGET_COUNT)
      : state.donors;
    state = { donors, loading: false };
    listeners.forEach((l) => l(state));
  };
  load();
  const poll = setInterval(load, 60_000);
  const channel = supabase
    .channel("top-donors-live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "donations" }, () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(load, 5000);
    })
    .subscribe();
  return () => {
    cancelled = true;
    clearInterval(poll);
    if (refreshTimer) clearTimeout(refreshTimer);
    supabase.removeChannel(channel);
  };
}

export function useTopDonors() {
  const [s, setS] = useState<State>(state);
  useEffect(() => {
    listeners.add(setS);
    if (!stop) stop = start();
    else setS(state);
    return () => {
      listeners.delete(setS);
      if (listeners.size === 0 && stop) { stop(); stop = null; }
    };
  }, []);
  return s;
}
