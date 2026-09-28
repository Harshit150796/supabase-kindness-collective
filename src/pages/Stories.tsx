import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, PlusCircle } from 'lucide-react';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineReveal, Reveal, ImageReveal } from '@/components/ui/editorial-motion';
import { impactStories, type ImpactStory } from '@/data/impactStories';
import { useFundraisers } from '@/hooks/useFundraisers';
import { useLandingStats, formatUSD } from '@/hooks/useLandingStats';
import { useTopDonors } from '@/hooks/useTopDonors';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { FundraiserFilterBar, type FundraiserFilters } from '@/components/stories/FundraiserFilterBar';
import { useZipStates } from '@/lib/zipStates';
import { brandLogos } from '@/data/brandLogos';

const categoryLabels: Record<string, string> = {
  family: 'Family Support', child: 'Child Welfare', emergency: 'Emergency Aid', community: 'Community',
};
type CategoryFilter = 'all' | 'family' | 'child' | 'emergency' | 'community';

export default function Stories() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [fundraiserFilters, setFundraiserFilters] = useState<FundraiserFilters>({ category: 'all', state: 'all' });
  const { data: fundraisers, isLoading } = useFundraisers();
  const stats = useLandingStats();
  const { donors, loading: donorsLoading } = useTopDonors();
  const stateMap = useZipStates(fundraisers || []);
  const filteredFundraisers = useMemo(() => (fundraisers || []).filter((item) => {
    if (fundraiserFilters.category !== 'all' && item.category !== fundraiserFilters.category) return false;
    if (fundraiserFilters.state !== 'all') return item.zip_code ? stateMap.get(item.zip_code) === fundraiserFilters.state : false;
    return true;
  }), [fundraisers, fundraiserFilters, stateMap]);
  const filteredStories = activeCategory === 'all' ? impactStories : impactStories.filter((story) => story.category === activeCategory);
  const categories: CategoryFilter[] = ['all', 'family', 'child', 'emergency', 'community'];
  const liveTotals = stats ? [
    { label: 'Completed donations', value: stats.donations_count.toLocaleString() },
    { label: 'Donated', value: formatUSD(stats.total_raised) },
    { label: 'Coupons created', value: stats.coupons_created.toLocaleString() },
    { label: 'Active fundraisers', value: stats.active_fundraisers.toLocaleString() },
  ].filter((item) => item.value !== '0' && item.value !== '$0') : [];

  return (
    <div className="min-h-dvh bg-background">
      <SEO title="Stories and Fundraisers" description="Browse active CouponDonation fundraisers and read editorial stories about needs that restricted coupons can meet." path="/stories" jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Stories', path: '/stories' }])} />
      <Navbar />
      <main>
        <section className="border-b border-border py-24 md:py-36">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl">
              <LineReveal><h1 className="max-w-4xl font-display text-6xl font-normal leading-none text-foreground md:text-8xl">Find a need you can help meet.</h1></LineReveal>
              <Reveal delay={0.1}><p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">Active fundraisers use live campaign records. Editorial stories explain the kinds of needs restricted coupons can cover.</p></Reveal>
            </div>
            {liveTotals.length > 0 && (
              <div className="mt-16 grid grid-cols-2 border-y border-border md:grid-cols-4 md:divide-x md:divide-border">
                {liveTotals.map((item, index) => <Reveal key={item.label} delay={index * 0.06} className="border-b border-border px-4 py-7 last:border-b-0 md:border-b-0"><div className="font-display text-4xl text-foreground">{item.value}</div><div className="mt-1 text-sm text-muted-foreground">{item.label}</div></Reveal>)}
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
            ) : filteredFundraisers.length > 0 ? (
              <div className="mt-8 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{filteredFundraisers.map((fundraiser, index) => <Reveal key={fundraiser.id} delay={index * 0.05}><FundraiserCard fundraiser={fundraiser} /></Reveal>)}</div>
            ) : (
              <div className="mt-8 border-y border-border py-14"><h3 className="font-display text-3xl text-foreground">No matching fundraisers yet.</h3><p className="mt-3 text-muted-foreground">Clear the filters or start a fundraiser of your own.</p></div>
            )}
          </div>
        </section>

        <section className="border-y border-border py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mb-10 max-w-3xl"><LineReveal><h2 className="font-display text-5xl font-normal text-foreground md:text-6xl">Stories behind everyday needs.</h2></LineReveal><Reveal delay={0.08}><p className="mt-4 text-lg text-muted-foreground">These are editorial stories, not live fundraisers. Their text and photographs remain separate from campaign totals.</p></Reveal></div>
            <div className="mb-8 flex flex-wrap gap-2">{categories.map((category) => <Button key={category} variant={activeCategory === category ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(category)}>{category === 'all' ? 'All stories' : categoryLabels[category]}</Button>)}</div>
            <div className="grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{filteredStories.map((story, index) => <EditorialStoryCard key={story.id} story={story} index={index} />)}</div>
          </div>
        </section>

        <section className="py-24 md:py-32">
          <div className="container mx-auto grid gap-16 px-4 lg:grid-cols-2">
            <div><LineReveal><h2 className="font-display text-5xl font-normal text-foreground">Donors this week.</h2></LineReveal><div className="mt-8 divide-y divide-border border-y border-border">{donorsLoading ? <Skeleton className="my-6 h-20 w-full" /> : donors.length ? donors.map((donor, index) => <Reveal key={`${donor.display_name}-${index}`} className="grid grid-cols-[2rem_1fr_auto] gap-4 py-5"><span className="text-sm text-muted-foreground">0{index+1}</span><div><p className="font-medium text-foreground">{donor.display_name}</p><p className="text-sm text-muted-foreground">{donor.donations_count} completed {donor.donations_count === 1 ? 'donation' : 'donations'}</p></div><strong className="text-primary">{formatUSD(donor.total)}</strong></Reveal>) : <p className="py-8 text-muted-foreground">The weekly list will appear after completed donations are recorded.</p>}</div></div>
            <div><LineReveal><h2 className="font-display text-5xl font-normal text-foreground">Retailers donors chose.</h2></LineReveal><div className="mt-8 divide-y divide-border border-y border-border">{stats?.brands.length ? stats.brands.slice(0,5).map((brand, index) => <Reveal key={brand.name} className="grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-3 py-5"><span className="text-sm text-muted-foreground">0{index+1}</span><img src={brandLogos[brand.name]?.logo} alt="" className="h-8 w-8 object-contain" /><span className="font-medium text-foreground">{brand.name}</span><strong className="text-primary">{formatUSD(brand.total)}</strong></Reveal>) : <p className="py-8 text-muted-foreground">Retailer totals will appear after completed donations are allocated.</p>}</div></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function EditorialStoryCard({ story, index }: { story: ImpactStory; index: number }) {
  return (
    <Reveal delay={index * 0.05}>
      <Link to={`/story/${story.id}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <article>
          <ImageReveal className="aspect-[4/3] bg-muted"><img src={story.image} alt={story.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" /></ImageReveal>
          <div className="pt-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{story.location}</div><h3 className="mt-3 font-display text-3xl font-normal text-foreground">{story.name}</h3><p className="mt-3 line-clamp-3 leading-relaxed text-muted-foreground">{story.story}</p><span className="mt-5 inline-flex items-center text-sm font-medium text-primary">Read the story <ArrowRight className="ml-2 h-4 w-4" /></span></div>
        </article>
      </Link>
    </Reveal>
  );
}