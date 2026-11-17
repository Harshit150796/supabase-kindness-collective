import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FundraiserSearch } from '@/components/search/FundraiserSearch';

/**
 * /search — the page the header's magnifier opens (founder request, Nov 17 2026, like GoFundMe's search page).
 * Search results are not indexed (noindex); every fundraiser and need page has its own indexed address.
 */
export default function SearchPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SEO title="Search fundraisers" description="Find an open fundraiser by need, name, city or store, then give gift cards for what the family asked for." path="/search" noindex />
      <Navbar />
      <main>
        <section className="pb-24 pt-12 md:pb-32 md:pt-20">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-5xl font-normal leading-none text-foreground md:text-7xl">Search fundraisers</h1>
            <p className="mb-8 mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground md:mb-10">Find a request by what it is for, who started it, where they live or a store they asked for.</p>
            <FundraiserSearch autoFocus />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
