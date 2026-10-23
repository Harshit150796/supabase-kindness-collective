import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { useFundraisers } from '@/hooks/useFundraisers';
import { useLandingStats, formatUSD } from '@/hooks/useLandingStats';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { StartFundraiserCard } from '@/components/fundraiser/StartFundraiserCard';
import { CompletedCampaigns } from '@/components/proof/ProofSections';
import { FundraiserFilterBar, type FundraiserFilters } from '@/components/stories/FundraiserFilterBar';
import { useZipStates } from '@/lib/zipStates';
import { brandLogos } from '@/data/brandLogos';


export default function Stories() {
  const [fundraiserFilters, setFundraiserFilters] = useState<FundraiserFilters>({ category: 'all', state: 'all' });
  const { data: fundraisers, isLoading, isError, refetch } = useFundraisers();
  const stats = useLandingStats();
  const stateMap = useZipStates(fundraisers || []);
  const filteredFundraisers = useMemo(() => (fundraisers || []).filter((item) => {
    if (fundraiserFilters.category !== 'all' && item.category !== fundraiserFilters.category) return false;
    if (fundraiserFilters.state !== 'all') return item.zip_code ? stateMap.get(item.zip_code) === fundraiserFilters.state : false;
    return true;
  }), [fundraisers, fundraiserFilters, stateMap]);
  const liveTotals = stats ? [
    { label: 'Completed donations', value: stats.donations_count.toLocaleString() },
    { label: 'Donated', value: formatUSD(stats.total_raised) },
    { label: 'Coupons created', value: stats.coupons_created.toLocaleString() },
    { label: 'Active fundraisers', value: stats.active_fundraisers.toLocaleString() },
  ].filter((item) => item.value !== '0' && item.value !== '$0') : [];

  return (
    <div className="min-h-dvh bg-background">
      <SEO title="Fundraisers for Families in Need: Help Someone Today" description="Browse open requests for groceries, medicine, rides and household essentials. Pick one and give gift cards for the stores they asked for." path="/stories" jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Stories', path: '/stories' }])} />
      <Navbar />
      <main>
        <section className="py-24 md:py-36">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl">
              <LineReveal><h1 className="max-w-4xl font-display text-6xl font-normal leading-none text-foreground md:text-8xl">Find a need you can help meet.</h1></LineReveal>
              <Reveal delay={0.1}><p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">Every fundraiser here is a live request, and every figure comes from completed donations.</p></Reveal>
            </div>
            {liveTotals.length > 0 && (
              <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
                {liveTotals.map((item, index) => <Reveal key={item.label} delay={index * 0.06} className="rounded-[1.5rem] bg-secondary p-6"><div className="font-display text-4xl text-foreground">{item.value}</div><div className="mt-1 text-sm text-muted-foreground">{item.label}</div></Reveal>)}
              </div>
            )}
          </div>
        </section>

        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div><LineReveal><h2 className="font-display text-5xl font-normal text-foreground md:text-6xl">Fundraisers open now.</h2></LineReveal><Reveal delay={0.08}><p className="mt-4 text-lg text-muted-foreground">Every amount and progress figure below comes from its campaign record.</p></Reveal></div>
              <Button variant="outline" asChild><Link to="/apply"><PlusCircle className="mr-2 h-4 w-4" />Start a fundraiser</Link></Button>
            </div>
            <FundraiserFilterBar filters={fundraiserFilters} onChange={setFundraiserFilters} />
            {isLoading ? (
              <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item}><Skeleton className="aspect-[4/3] w-full rounded-sm" /><Skeleton className="mt-4 h-5 w-3/4" /><Skeleton className="mt-3 h-2 w-full" /></div>)}</div>
            ) : isError ? (<div className="mt-8 border-y border-border py-12"><p>Campaigns could not be loaded.</p><Button variant="outline" className="mt-4" onClick={() => refetch()}>Try again</Button></div>) : filteredFundraisers.length > 0 ? (
              <div className="mt-8 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{filteredFundraisers.map((fundraiser) => <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />)}<StartFundraiserCard /></div>
            ) : (
              <div className="mt-8 border-y border-border py-14"><h3 className="font-display text-3xl text-foreground">No matching fundraisers yet.</h3><p className="mt-3 text-muted-foreground">Clear the filters or start a fundraiser of your own.</p></div>
            )}
          </div>
        </section>
        <CompletedCampaigns />

        {/* Editorial stories were removed in the October 2026 legal review: they described people and
            results that weren't real. Only live fundraisers and real totals appear here. */}

        <section className="py-24 md:py-32">
          <div className="container mx-auto max-w-4xl px-4">
            <div><LineReveal><h2 className="font-display text-5xl font-normal text-foreground">Retailers donors chose.</h2></LineReveal><div className="mt-8 divide-y divide-border border-y border-border">{stats?.brands.length ? stats.brands.slice(0,5).map((brand, index) => <Reveal key={brand.name} className="grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-3 py-5"><span className="text-sm text-muted-foreground">0{index+1}</span><img width={32} height={32} loading="lazy" decoding="async" src={brandLogos[brand.name]?.logo} alt="" className="h-8 w-8 object-contain" /><span className="font-medium text-foreground">{brand.name}</span><strong className="text-primary">{formatUSD(brand.total)}</strong></Reveal>) : <p className="py-8 text-muted-foreground">Retailer totals will appear after completed donations are allocated.</p>}</div></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
