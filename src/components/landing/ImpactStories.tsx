import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Users, Heart, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { impactStories } from '@/data/impactStories';
import { useFundraisers, Fundraiser } from '@/hooks/useFundraisers';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  family: 'Feed a Family',
  child: 'Help a Child',
  emergency: 'Emergency Relief',
  community: 'Community Support',
  food: 'Food Support',
  household: 'Household',
  health: 'Healthcare',
  childcare: 'Childcare',
  education: 'Education',
  utilities: 'Utilities',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  family: 'bg-primary/10 text-primary',
  child: 'bg-amber-500/10 text-amber-600',
  emergency: 'bg-red-500/10 text-red-600',
  community: 'bg-blue-500/10 text-blue-600',
  food: 'bg-emerald-500/10 text-emerald-600',
  household: 'bg-blue-500/10 text-blue-600',
  health: 'bg-red-500/10 text-red-600',
  childcare: 'bg-pink-500/10 text-pink-600',
  education: 'bg-purple-500/10 text-purple-600',
  utilities: 'bg-orange-500/10 text-orange-600',
  other: 'bg-gray-500/10 text-gray-600',
};

const STORIES_PER_PAGE = 4;

interface UnifiedStory {
  id: string;
  name: string;
  location: string;
  image: string;
  story: string;
  impact: string;
  category: string;
  donorsCount: number;
  amountRaised: number;
  goal: number;
  type: 'fundraiser' | 'success';
  slug?: string;
}

function mapFundraiserToStory(f: Fundraiser): UnifiedStory {
  return {
    id: f.id,
    name: f.title,
    location: f.country || 'United States',
    image: f.cover_photo_url || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=300&fit=crop',
    story: f.story,
    impact: 'Active Campaign',
    category: f.category,
    donorsCount: f.donors_count || 0,
    amountRaised: f.amount_raised || 0,
    goal: f.monthly_goal,
    type: 'fundraiser',
    slug: f.unique_slug,
  };
}

export function ImpactStories() {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Fetch real fundraisers
  const { data: fundraisers, isLoading } = useFundraisers({ limit: 8 });
  
  // Combine real fundraisers with mock success stories
  const realStories: UnifiedStory[] = (fundraisers || []).map(mapFundraiserToStory);
  const mockStories: UnifiedStory[] = impactStories.slice(0, 4).map(s => ({
    ...s,
    type: 'success' as const,
  }));
  
  // Prioritize real fundraisers, fill with mock if needed
  const allStories = [...realStories, ...mockStories].slice(0, 8);
  
  const totalPages = Math.ceil(allStories.length / STORIES_PER_PAGE);
  
  const currentStories = allStories.slice(
    currentPage * STORIES_PER_PAGE,
    (currentPage + 1) * STORIES_PER_PAGE
  );

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

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
              <Card key={i} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <Skeleton className="sm:w-40 h-48 sm:h-auto" />
                  <div className="flex-1 p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
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

        {/* Stories Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto transition-opacity duration-300">
          {currentStories.map((story) => {
            const progress = story.goal > 0 ? (story.amountRaised / story.goal) * 100 : 0;
            const linkTo = story.type === 'fundraiser' && story.slug 
              ? `/f/${story.slug}` 
              : `/story/${story.id}`;
            
            return (
              <Link to={linkTo} key={`${story.type}-${story.id}`} className="block">
                <Card 
                  className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="sm:w-40 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                      <img 
                        src={story.image} 
                        alt={story.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=300&fit=crop';
                        }}
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[story.category] || categoryColors.other}`}>
                          {categoryLabels[story.category] || 'Support'}
                        </span>
                        {story.type === 'fundraiser' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{story.location}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {story.name}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                        "{story.story}"
                      </p>
                      
                      {/* Impact Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                        <Heart className="w-3.5 h-3.5" />
                        {story.impact}
                      </div>
                      
                      {/* Progress */}
                      <div className="space-y-2">
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground font-medium">
                            ${story.amountRaised.toLocaleString()} raised
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {story.donorsCount} donors
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Link - Bottom Right */}
        <div className="flex justify-end max-w-5xl mx-auto mt-4 mb-2">
          <Link 
            to="/stories" 
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 hover:underline underline-offset-4"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Custom Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              disabled={currentPage === 0}
              className={cn(
                "w-14 h-14 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-center transition-all duration-200",
                currentPage === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-muted hover:border-border hover:shadow-md"
              )}
              aria-label="Previous stories"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            {/* Pill Pagination Indicator */}
            <div className="bg-muted/50 rounded-full px-5 py-3 flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    currentPage === index
                      ? "w-8 h-3 bg-primary"
                      : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className={cn(
                "w-14 h-14 rounded-xl border border-border/50 bg-background shadow-sm flex items-center justify-center transition-all duration-200",
                currentPage === totalPages - 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-muted hover:border-border hover:shadow-md"
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
