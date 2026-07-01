import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFundraisers } from '@/hooks/useFundraisers';
import { FundraiserCard } from '@/components/stories/FundraiserCard';
import { cn } from '@/lib/utils';

const STORIES_PER_PAGE = 4;

export function ImpactStories() {
  const [currentPage, setCurrentPage] = useState(0);

  const { data: fundraisers, isLoading } = useFundraisers({ limit: 8 });
  const allStories = fundraisers || [];

  const totalPages = Math.max(1, Math.ceil(allStories.length / STORIES_PER_PAGE));

  const currentStories = allStories.slice(
    currentPage * STORIES_PER_PAGE,
    (currentPage + 1) * STORIES_PER_PAGE
  );

  const goToPrevious = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Real Stories, Real Impact
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Meet the Families You're Helping
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[520px] rounded-3xl" />
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
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Real Stories, Real Impact
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet the Families You're Helping
          </h2>
          <p className="text-muted-foreground text-lg">
            Every donation creates a story of hope. These are real families whose lives
            have been changed by generous donors like you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {currentStories.map((f) => (
            <FundraiserCard key={f.id} fundraiser={f} />
          ))}
        </div>

        <div className="flex justify-end max-w-5xl mx-auto mt-4 mb-2">
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
              disabled={currentPage === 0}
              className={cn(
                'w-10 h-10 md:w-14 md:h-14 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-center transition-all duration-200',
                currentPage === 0
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
                    currentPage === index
                      ? 'w-8 h-3 bg-primary'
                      : 'w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className={cn(
                'w-10 h-10 md:w-14 md:h-14 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-center transition-all duration-200',
                currentPage === totalPages - 1
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
