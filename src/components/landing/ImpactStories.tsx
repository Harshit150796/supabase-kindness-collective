import { NEEDS } from '@/data/needs';
import { StartFundraiserCard } from '@/components/fundraiser/StartFundraiserCard';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useFundraisers } from '@/hooks/useFundraisers';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

type Sort = 'newest' | 'supported' | 'goal';
export function ImpactStories() {
  const { data, isLoading, isError, refetch } = useFundraisers({ limit: 24 });
  const [category, setCategory] = useState('all'); const [sort, setSort] = useState<Sort>('newest');
  const categories = useMemo(() => ['all', ...Array.from(new Set((data ?? []).map((f) => f.category)))], [data]);
  const shown = useMemo(() => (data ?? []).filter((f) => category === 'all' || f.category === category).sort((a, b) => sort === 'supported' ? b.live_donations_count - a.live_donations_count : sort === 'goal' ? (b.monthly_goal ? b.live_raised / b.monthly_goal : 0) - (a.monthly_goal ? a.live_raised / a.monthly_goal : 0) : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [category, data, sort]);
  const secondLead = shown.length >= 6 ? shown[5] : shown.length === 5 ? shown[1] : null;
  const rightFundraisers = shown.slice(1, 5);
  return <section className="bg-background py-14 lg:py-28" aria-labelledby="fundraisers-heading"><div className="container mx-auto px-4"><div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] md:items-end"><LineReveal><h2 id="fundraisers-heading" className="font-display text-5xl leading-none text-foreground md:text-7xl">Fundraisers open now.</h2></LineReveal><Reveal><p className="text-lg leading-relaxed text-muted-foreground">Real campaigns, completed donations, and coupon-locked support.</p><Button asChild className="mt-5"><Link to="/apply">Start a fundraiser</Link></Button></Reveal></div>
  <div className="mt-10 flex flex-col gap-4 border-y border-border py-4 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [&>*]:shrink-0 [&>*]:snap-start">{categories.map((item) => <Button key={item} size="sm" variant={category === item ? 'default' : 'ghost'} onClick={() => setCategory(item)}>{item === 'all' ? 'All needs' : item}</Button>)}{NEEDS.map((n) => <Button key={n.slug} asChild size="sm" variant="ghost" className="text-muted-foreground"><Link to={`/help/${n.slug}`}>{n.name}</Link></Button>)}</div><label className="flex items-center gap-2 text-sm text-muted-foreground">Sort <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="min-h-11 bg-transparent text-base font-medium text-foreground outline-none"><option value="newest">Newest</option><option value="supported">Most supported</option><option value="goal">Close to goal</option></select></label></div>
  {isLoading ? <div className="mt-8 grid gap-6 md:grid-cols-2"><Skeleton className="aspect-[16/10]"/><Skeleton className="aspect-[16/10]"/></div> : isError ? <div className="mt-10 border-y border-border py-12"><p>Campaigns could not be loaded.</p><Button variant="outline" className="mt-4" onClick={() => refetch()}>Try again</Button></div> : shown.length ? <><div className="mt-8 hidden gap-7 md:grid md:grid-cols-[1.3fr_1fr]"><div className="flex flex-col gap-7 self-start"><FundraiserCard fundraiser={shown[0]} lead/>{secondLead && <FundraiserCard fundraiser={secondLead} lead/>}</div><div className="grid grid-cols-2 grid-rows-[auto_auto_minmax(22rem,1fr)] gap-x-6 gap-y-10">{rightFundraisers.map((f) => <FundraiserCard key={f.id} fundraiser={f}/>)}<StartFundraiserCard className="col-span-2 min-h-0" /></div></div><div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:hidden">{shown.map((f) => <div key={f.id} className="w-[86vw] shrink-0 snap-center"><FundraiserCard fundraiser={f}/></div>)}<div className="w-[86vw] shrink-0 snap-center"><StartFundraiserCard /></div></div><div className="mt-4 flex justify-center gap-2 md:hidden" aria-label={`${shown.length} fundraisers and a start-your-own card`}>{shown.map((f) => <span key={f.id} className="h-1.5 w-6 bg-primary/25 first:bg-primary" />)}</div></> : <div className="mt-10 border-y border-border py-12"><h3 className="font-display text-3xl">No matching fundraisers.</h3><p className="mt-2 text-muted-foreground">Choose another need to see active campaigns.</p></div>}
  <Link to="/stories" className="mt-10 inline-flex min-h-11 items-center font-semibold text-primary">Browse all stories <ArrowRight className="ml-2 h-4 w-4"/></Link></div></section>;
}
