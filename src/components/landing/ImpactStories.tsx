import { NEEDS } from '@/data/needs';
import { StartFundraiserCard } from '@/components/fundraiser/StartFundraiserCard';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, LayoutGrid } from 'lucide-react';
import { NeedIcon } from '@/components/needs/NeedIcon';
import { HELP_NEEDS, needById, needLabel } from '@/lib/helpNeeds';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useFundraisers } from '@/hooks/useFundraisers';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { ReservedSectionState } from './ReservedSectionState';
import { FundraiserMosaic } from './FundraiserMosaic';
import { CollectionSwitcher } from './CollectionSwitcher';
import { collect, COLLECTIONS, photoLabel, type CollectionId } from '@/lib/fundraiserCollections';
import { type Fundraiser } from '@/hooks/useFundraisers';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useHomepageLineup } from '@/hooks/useHomepageLineup';
import { applyLineup, HOMEPAGE_LIMIT } from '@/lib/homepageLineup';

/** One id per need, so old and new ids for the same need (health and healthcare) make one filter. */
const needKey = (id: string) => needById(id)?.id ?? id;
/** Needs show in the apply form's order; unknown ids go last. */
const needOrder = (id: string) => { const i = HELP_NEEDS.findIndex((n) => n.id === (needById(id)?.id ?? id)); return i < 0 ? HELP_NEEDS.length : i; };
/** Switching collections, GoFundMe-style: the old cards slide left and fade one after another, then the new ones follow (index.css). */
const OUT_MS = 200;
const IN_MS = 520;
type View = { collection: CollectionId; category: string };

export function ImpactStories() {
  const { data: open, isLoading, isError, isFetching, refetch } = useFundraisers({ cards: true });
  // The team's lineup (Admin → Homepage): hidden campaigns never show here; placed ones lead Trending.
  const lineup = useHomepageLineup();
  // `picked` follows the controls at once; `view` is what the cards show, swapped once the old cards are out.
  const [picked, setPicked] = useState<View>({ collection: 'trending', category: 'all' });
  const [view, setView] = useState<View>(picked);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const timers = useRef<number[]>([]);
  // The site's Pause control (not the OS setting) turns the switch into an instant swap.
  const motion = useMotionPreference();
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const change = useCallback((next: Partial<View>) => {
    const target = { ...picked, ...next };
    if (target.collection === picked.collection && target.category === picked.category) return;
    setPicked(target);
    timers.current.forEach(clearTimeout); timers.current = [];
    if (motion !== 'full') { setView(target); setPhase('idle'); return; }
    setPhase('out');
    timers.current.push(window.setTimeout(() => { setView(target); setPhase('in'); }, OUT_MS));
    timers.current.push(window.setTimeout(() => setPhase('idle'), OUT_MS + IN_MS));
  }, [motion, picked]);
  const category = picked.category;
  const data = useMemo(() => (open ? applyLineup(open, lineup.data ?? [], false) : open), [open, lineup.data]);
  const categories = useMemo(() => ['all', ...Array.from(new Set((data ?? []).map((f) => f.category).filter(Boolean).map(needKey))).sort((a, b) => needOrder(a) - needOrder(b))], [data]);
  // Trending keeps the ranked order from useFundraisers (src/lib/fundraiserRanking.ts); the other collections pick and order their own (src/lib/fundraiserCollections.ts).
  const shown = useMemo(() => collect(applyLineup((open ?? []).filter((f) => view.category === 'all' || needKey(f.category) === view.category), lineup.data ?? [], view.collection === 'trending'), view.collection).slice(0, HOMEPAGE_LIMIT), [open, lineup.data, view]);
  const labelFor = useCallback((f: Fundraiser) => photoLabel(f, view.collection), [view.collection]);
  const viewName = COLLECTIONS.find((c) => c.id === view.collection)?.label ?? 'Trending';
  const secondLead = shown.length >= 6 ? shown[5] : shown.length === 5 ? shown[1] : null;
  const rightFundraisers = shown.slice(1, 5);
  return <section className="flex min-h-[var(--lazy-reserved-height,0px)] flex-col bg-background py-14 lg:py-28" aria-labelledby="fundraisers-heading"><div className="container mx-auto flex flex-1 flex-col px-4"><div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] md:items-end"><LineReveal><h2 id="fundraisers-heading" className="font-display text-5xl leading-none text-foreground md:text-7xl">Fundraisers open now.</h2></LineReveal><Reveal><p className="text-lg leading-relaxed text-muted-foreground">See what’s trending, close to goal or just launched.</p><Button asChild className="mt-5"><Link to="/apply">Start a fundraiser</Link></Button></Reveal></div>
  <div className="mt-10 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-3"><CollectionSwitcher value={picked.collection} onChange={(id) => change({ collection: id })} /><span className="hidden h-8 w-px bg-border md:mx-1 md:block" aria-hidden="true" /><div role="group" aria-label="Filter fundraisers by need" className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3">{categories.map((item) => { const active = category === item; return <button key={item} type="button" aria-pressed={active} onClick={() => change({ category: item })} className={cn('flex min-h-[52px] items-center gap-2.5 rounded-[14px] border px-3 text-left text-[15px] leading-tight text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:pl-3.5 md:pr-[18px] md:text-base', active ? 'border-primary bg-[hsl(var(--primary-93))] font-semibold shadow-[inset_0_0_0_.5px_hsl(var(--primary))]' : 'border-border bg-card font-medium hover:border-primary/40 hover:bg-[hsl(var(--primary-97))]')}>{item === 'all' ? <LayoutGrid className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" strokeWidth={1.75} /> : <NeedIcon id={item} className="h-5 w-5 shrink-0 text-primary" />}<span className="min-w-0">{item === 'all' ? 'All needs' : needLabel(item)}</span></button>; })}</div></div>
  <details className="group mt-4 border-t border-border"><summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 pt-1 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span className="text-muted-foreground">Asking for yourself?</span><span className="font-medium text-primary">Read a guide</span><ChevronDown className="h-4 w-4 text-primary transition-transform group-open:rotate-180" aria-hidden="true" /></summary><div className="flex flex-wrap gap-x-5 pb-1">{NEEDS.map((n) => <Link key={n.slug} to={`/help/${n.slug}`} className="inline-flex min-h-11 items-center text-[15px] font-medium text-primary underline-offset-4 hover:underline">{n.name}</Link>)}</div></details>
  {isLoading ? <div className="mt-8 grid gap-6 md:grid-cols-2"><Skeleton className="aspect-[16/10]"/><Skeleton className="aspect-[16/10]"/></div> : isError ? <ReservedSectionState title="Campaigns could not be loaded." description="Your connection may be taking longer than usual. Try again, or explore the stories behind CouponDonation." onRetry={() => refetch()} retrying={isFetching} /> : shown.length ? <div data-collection-phase={phase}><p className="sr-only" aria-live="polite">{`${viewName}: ${shown.length} ${shown.length === 1 ? 'fundraiser' : 'fundraisers'}`}</p><div className="mt-8 hidden gap-7 md:grid md:grid-cols-[1.3fr_1fr]"><div className="flex flex-col gap-7 self-start"><Reveal><div className="collection-item" style={{ '--i': 0 } as CSSProperties}><FundraiserCard fundraiser={shown[0]} lead showLastGift={false} photoLabel={labelFor(shown[0])}/></div></Reveal>{secondLead && <Reveal delay={0.06}><div className="collection-item" style={{ '--i': 5 } as CSSProperties}><FundraiserCard fundraiser={secondLead} lead showLastGift={false} photoLabel={labelFor(secondLead)}/></div></Reveal>}</div><div className="grid grid-cols-2 grid-rows-[auto_auto_minmax(22rem,1fr)] gap-x-6 gap-y-10">{rightFundraisers.map((f, index) => <Reveal key={f.id} delay={index * 0.05}><div className="collection-item h-full" style={{ '--i': index + 1 } as CSSProperties}><FundraiserCard fundraiser={f} showLastGift={false} photoLabel={labelFor(f)}/></div></Reveal>)}<Reveal className="col-span-2 min-h-0" delay={0.08}><StartFundraiserCard className="min-h-0" /></Reveal></div></div><Reveal className="mt-6 md:hidden"><div className="collection-item"><FundraiserMosaic key={`${view.collection}-${view.category}`} fundraisers={shown} labelFor={labelFor} /></div></Reveal></div> : <ReservedSectionState title={data?.length ? (view.collection === 'new' ? 'No fundraisers started in the last 30 days.' : 'No matching fundraisers.') : "A place for the next fundraiser."} description={data?.length ? "Choose another view or need, or explore all stories of support." : "There are no active campaigns to show right now. You can explore past stories or start a fundraiser above."} onReset={category !== "all" || picked.collection !== 'trending' ? () => change({ collection: 'trending', category: 'all' }) : undefined} />}
  <Button asChild variant="outline" className="mt-5 min-h-11 w-full border-primary text-[15px] font-semibold text-primary md:hidden"><Link to="/stories">See all fundraisers</Link></Button>
  <Link to="/stories" className="mt-10 hidden min-h-11 items-center font-semibold text-primary md:inline-flex">See all fundraisers <ArrowRight className="ml-2 h-4 w-4"/></Link></div></section>;
}
