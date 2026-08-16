import { useEffect, useState } from "react";
import { useTopDonors } from "@/hooks/useTopDonors";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hero-top-donors-collapsed";

const RANK_STYLES = [
  "bg-amber-400 text-amber-950",
  "bg-slate-300 text-slate-800",
  "bg-orange-400 text-orange-950",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
];

function initial(name: string) {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

function formatAmount(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

export function TopDonorsPanel() {
  const { donors, loading } = useTopDonors();
  // Collapsed by default; expands only if the visitor opts in.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="absolute top-28 md:top-32 right-3 md:right-4 z-30 w-[260px] hidden md:block pointer-events-auto">
      <div className="rounded-2xl border border-border bg-background/85 backdrop-blur-xl shadow-2xl overflow-hidden">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div className="text-left">
              <div className="text-sm font-bold text-foreground leading-tight">Top Donors</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">This week</div>
            </div>
          </div>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {!collapsed && (
          <div className="px-3 pb-3 space-y-1.5">
            {loading && (
              <div className="space-y-2 py-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-8 rounded-md bg-muted/50 animate-pulse" />
                ))}
              </div>
            )}

            {!loading && donors.length === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Be the first donor this week 🌱
              </div>
            )}

            {!loading &&
              donors.map((d, i) => (
                <div
                  key={`${d.display_name}-${i}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      RANK_STYLES[i],
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {d.is_anonymous ? "?" : initial(d.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {d.display_name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {d.donations_count} gift{d.donations_count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    {formatAmount(d.total)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
