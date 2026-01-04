import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Users, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { impactStories } from '@/data/impactStories';
import { cn } from '@/lib/utils';

const categoryLabels = {
  family: 'Feed a Family',
  child: 'Help a Child',
  emergency: 'Emergency Relief',
  community: 'Community Support'
};

const categoryColors = {
  family: 'bg-primary/10 text-primary',
  child: 'bg-amber-500/10 text-amber-600',
  emergency: 'bg-red-500/10 text-red-600',
  community: 'bg-blue-500/10 text-blue-600'
};

const STORIES_PER_PAGE = 4;

export function ImpactStories() {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(impactStories.length / STORIES_PER_PAGE);
  
  const currentStories = impactStories.slice(
    currentPage * STORIES_PER_PAGE,
    (currentPage + 1) * STORIES_PER_PAGE
  );

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

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
            const progress = (story.amountRaised / story.goal) * 100;
            
            return (
              <Card 
                key={story.id} 
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-40 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                    <img 
                      src={story.image} 
                      alt={story.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[story.category]}`}>
                        {categoryLabels[story.category]}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{story.location}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-2">
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
                      <Progress value={progress} className="h-2" />
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
            );
          })}
        </div>

        {/* Custom Pagination Navigation */}
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
      </div>
    </section>
  );
}
