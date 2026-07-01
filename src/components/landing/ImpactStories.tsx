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
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <SectionHeading />
          <div className="max-w-6xl mx-auto grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
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
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <SectionHeading />

        <div className="max-w-6xl mx-auto mb-6">
          <FundraiserFilterBar filters={filters} onChange={handleFiltersChange} />
        </div>

        {currentStories.length === 0 ? (
          <div className="max-w-6xl mx-auto text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">
              No fundraisers match these filters yet. Try clearing them.
            </p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {currentStories.map((f) => (
              <FundraiserCard key={f.id} fundraiser={f} />
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
            <button
              onClick={goToPrevious}
              disabled={safePage === 0}
              className={cn(
                'w-10 h-10 md:w-12 md:h-12 rounded-full border border-border bg-background shadow-sm flex items-center justify-center transition-all duration-200',
                safePage === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-muted hover:border-border hover:shadow-md'
              )}
              aria-label="Previous stories"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            <div className="bg-muted/50 rounded-full px-5 py-3 flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    safePage === index
                      ? 'w-8 h-3 bg-primary'
                      : 'w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              disabled={safePage === totalPages - 1}
              className={cn(
                'w-10 h-10 md:w-12 md:h-12 rounded-full border border-border bg-background shadow-sm flex items-center justify-center transition-all duration-200',
                safePage === totalPages - 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-muted hover:border-border hover:shadow-md'
              )}
              aria-label="Next stories"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="text-center max-w-3xl mx-auto mb-8">
      <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
        Real Stories, Real Impact
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Meet the Families You're Helping
      </h2>
      <p className="text-muted-foreground text-lg">
        Every donation creates a story of hope. Browse by cause or state to find a family to support.
      </p>
    </div>
  );
}
