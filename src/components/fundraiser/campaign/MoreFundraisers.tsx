import { useState } from 'react';
import { useFundraisers } from '@/hooks/useFundraisers';
import { FundraiserCard } from '@/components/stories/FundraiserCard';

/** Dark band of other active fundraisers. Shows no money figures: stored counters are not trusted (see roadmap discrepancy report). */
export function MoreFundraisers({ excludeId }: { excludeId: string }) {
  const { data = [] } = useFundraisers({ limit: 24 });
  const rows = data.filter((row) => row.id !== excludeId);
  const [country, setCountry] = useState('all');
  if (!rows.length) return null;
  const countries = Array.from(new Set(rows.map((r) => r.country).filter(Boolean))) as string[];
  const shown = rows.filter((r) => country === 'all' || r.country === country).slice(0, 12);
  return (
    <section className="bg-ink py-20 text-ink-foreground md:py-28">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-5xl font-normal md:text-6xl">More people to support</h2>
          {countries.length > 1 && (
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-full bg-ink-foreground/10 px-4 py-2 text-sm text-ink-foreground" aria-label="Filter by location">
              <option value="all" className="text-foreground">All locations</option>
              {countries.map((c) => <option key={c} value={c} className="text-foreground">{c}</option>)}
            </select>
          )}
        </div>
        <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {shown.map((f) => <div key={f.id} className="w-80 shrink-0 snap-start"><FundraiserCard fundraiser={f} inverse /></div>)}
        </div>
      </div>
    </section>
  );
}
