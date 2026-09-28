import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFundraisers } from '@/hooks/useFundraisers';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import {
  FundraiserFilterBar,
  type FundraiserFilters,
} from '@/components/stories/FundraiserFilterBar';
import { useZipStates } from '@/lib/zipStates';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

const STORIES_PER_PAGE = 6;

export function ImpactStories() {
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<FundraiserFilters>({ category: 'all', state: 'all' });

  const { data: fundraisers, isLoading } = useFundraisers({ limit: 24 });
  const allStories = fundraisers || [];
  const stateMap = useZipStates(allStories);

  const filtered = useMemo(() => {
    return allStories.filter((f) => {
      if (filters.category !== 'all' && f.category !== filters.category) return false;
      if (filters.state !== 'all') {
        const st = f.zip_code ? stateMap.get(f.zip_code) : null;
        if (st !== filters.state) return false;
      }
      return true;
    });
  }, [allStories, filters, stateMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / STORIES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const currentStories = filtered.slice(
    safePage * STORIES_PER_PAGE,
    (safePage + 1) * STORIES_PER_PAGE
  );

  const goToPrevious = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  const handleFiltersChange = (next: FundraiserFilters) => {
    setFilters(next);
    setCurrentPage(0);
  };

  if (isLoading) {
    return (
      <section className="bg-background py-24 md:py-36">
        <div className="container mx-auto px-4">
          <SectionHeading />
          <div className="max-w-6xl mx-auto grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-[4/3] rounded-sm" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-1.5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (allStories.length === 0) return null;

  return (
    <section className="bg-background py-24 md:py-36">
      <div className="container mx-auto px-4">
        <SectionHeading />

        <div className="max-w-6xl mx-auto mb-6">
          <FundraiserFilterBar filters={filters} onChange={handleFiltersChange} />
        </div>

        {currentStories.length === 0 ? (
          <div className="mx-auto max-w-6xl border-y border-border py-16 text-center">
            <p className="text-muted-foreground">
              No fundraisers match these filters yet. Try clearing them.
            </p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {currentStories.map((f, index) => (
              <Reveal key={f.id} delay={index * 0.06}>
                <FundraiserCard fundraiser={f} />
              </Reveal>
            ))}
          </div>
        )}

        <div className="flex justify-end max-w-6xl mx-auto mt-6 mb-2">
          <Link
            to="/stories"
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 hover:underline underline-offset-4"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={safePage === 0}
              className={cn(
                'h-10 w-10 md:h-12 md:w-12',
                safePage === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-muted'
              )}
              aria-label="Previous stories"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>

            <div className="flex items-center gap-3 px-2 py-3">
              {Array.from({ length: totalPages }).map((_, index) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={cn(
                    'h-7 w-7 rounded-none p-0 transition-opacity',
                    safePage === index
                      ? 'border-b-2 border-primary'
                      : 'opacity-45 hover:opacity-100'
                  )}
                  aria-label={`Go to page ${index + 1}`}
                >{index + 1}</Button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={safePage === totalPages - 1}
              className={cn(
                'h-10 w-10 md:h-12 md:w-12',
                safePage === totalPages - 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-muted'
              )}
              aria-label="Next stories"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
      <LineReveal>
        <h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">
          Meet the families you're helping.
        </h2>
      </LineReveal>
      <Reveal delay={0.1} className="mt-5">
        <p className="text-lg leading-relaxed text-muted-foreground">
        Every donation creates a story of hope. Browse by cause or state to find a family to support.
        </p>
      </Reveal>
    </div>
  );
}
