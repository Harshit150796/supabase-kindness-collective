import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/ui/editorial-motion';

interface Card { id: string; title: string; unique_slug: string; cover_photo_url: string | null; country: string | null; monthly_goal: number; fundraiser_images?: { image_url: string; is_primary: boolean | null }[] }

/** Dark band of other active fundraisers. Shows no money figures: stored counters are not trusted (see roadmap discrepancy report). */
export function MoreFundraisers({ excludeId }: { excludeId: string }) {
  const [rows, setRows] = useState<Card[]>([]);
  const [country, setCountry] = useState('all');
  useEffect(() => {
    supabase.from('fundraisers').select('id,title,unique_slug,cover_photo_url,country,monthly_goal,fundraiser_images(image_url,is_primary)').eq('status', 'active').neq('id', excludeId).not('unique_slug', 'is', null).order('created_at', { ascending: false }).limit(24)
      .then(({ data }) => setRows((data ?? []) as Card[]));
  }, [excludeId]);
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
          {shown.map((f, i) => {
            const img = f.fundraiser_images?.find((x) => x.is_primary)?.image_url ?? f.fundraiser_images?.[0]?.image_url ?? f.cover_photo_url;
            return (
              <Reveal key={f.id} delay={i * 0.05} className="w-72 shrink-0 snap-start">
                <Link to={`/f/${f.unique_slug}`} className="group block">
                  <div className="aspect-[16/10] overflow-hidden rounded-[1rem] bg-ink-foreground/10">
                    {img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </div>
                  <p className="mt-3 line-clamp-2 text-lg font-medium">{f.title}</p>
                  <p className="mt-1 text-sm opacity-70">Goal ${Number(f.monthly_goal).toLocaleString()}{f.country ? ` · ${f.country}` : ''}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
