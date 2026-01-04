import { ArrowRight, MapPin, Users, Heart, Quote, BadgeCheck, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { impactStories } from '@/data/impactStories';

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

export function ImpactStories() {
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

        {/* Stories Carousel */}
        <div className="max-w-6xl mx-auto relative">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {impactStories.map((story) => {
                const progress = (story.amountRaised / story.goal) * 100;
                
                return (
                  <CarouselItem key={story.id} className="pl-4 md:basis-1/2">
                    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 h-full">
                      <div className="flex flex-col sm:flex-row h-full">
                        {/* Image */}
                        <div className="sm:w-44 h-52 sm:h-auto relative overflow-hidden flex-shrink-0">
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
                          {story.verified && (
                            <div className="absolute bottom-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{story.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Calendar className="w-3 h-3" />
                              <span>{story.dateHelped}</span>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {story.name}
                          </h3>
                          
                          <div className="relative mb-4 flex-1">
                            <Quote className="absolute -top-1 -left-1 w-4 h-4 text-primary/30" />
                            <p className="text-muted-foreground text-sm leading-relaxed pl-4 line-clamp-4">
                              {story.story}
                            </p>
                          </div>
                          
                          {/* Impact Badge */}
                          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                            <Heart className="w-3.5 h-3.5" />
                            {story.impact}
                          </div>
                          
                          {/* Progress */}
                          <div className="space-y-2 mt-auto">
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
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {/* Navigation Arrows */}
            <CarouselPrevious className="-left-4 md:-left-12 bg-background border-border shadow-md hover:bg-accent" />
            <CarouselNext className="-right-4 md:-right-12 bg-background border-border shadow-md hover:bg-accent" />
          </Carousel>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link to="/stories">
            <Button variant="outline" size="lg" className="gap-2">
              View All Stories
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
