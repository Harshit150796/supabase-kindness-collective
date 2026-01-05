import { useState } from 'react';
import { RecentDonor } from '@/data/impactStories';
import { Button } from '@/components/ui/button';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportersListProps {
  donors: RecentDonor[];
  maxVisible?: number;
}

export function SupportersList({ donors, maxVisible = 5 }: SupportersListProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleDonors = showAll ? donors : donors.slice(0, maxVisible);
  const hasMore = donors.length > maxVisible;

  if (!donors || donors.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Be the first to support!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleDonors.map((donor, index) => (
        <div key={index} className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {donor.isAnonymous ? (
              <Heart className="w-4 h-4 text-primary" />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {donor.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground text-sm truncate">
                {donor.isAnonymous ? 'Anonymous' : donor.name}
              </span>
              <span className="text-sm font-semibold text-primary flex-shrink-0">
                ${donor.amount}
              </span>
            </div>
            {donor.message && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                "{donor.message}"
              </p>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(donor.date), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show all {donors.length} supporters
            </>
          )}
        </Button>
      )}
    </div>
  );
}
