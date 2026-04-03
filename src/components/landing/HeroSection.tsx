import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Play, MapPin, Users, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentFeaturedStory } from '@/hooks/useFeaturedStories';
import { useCMSStories } from '@/hooks/useCMSContent';


function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return <span>{count.toLocaleString()}</span>;
}

export function HeroSection() {
  const navigate = useNavigate();
  const { data: cmsStories, isLoading: cmsLoading } = useCMSStories(true);

  const { story: rotatingStory } = useCurrentFeaturedStory();

  // Pick the story with the lowest display_order (admin-set featured)
  const activeCMS = cmsStories && cmsStories.length > 0 ? cmsStories[0] : null;

  const story = activeCMS
    ? {
        id: activeCMS.id,
        name: activeCMS.name,
        location: activeCMS.location || '',
        image: activeCMS.image_url || rotatingStory.image,
        story: activeCMS.short_story,
        amountRaised: Number(activeCMS.amount_raised) || 0,
        goal: Number(activeCMS.goal) || 1,
        donorsCount: activeCMS.donors_count || 0,
        headline: `${activeCMS.name}'s family received groceries for 3 months`,
      }
    : rotatingStory;

  const storyLink = activeCMS
    ? `/story-detail/${story.id}`
    : `/featured/${rotatingStory.storyKey}`;

  const progress = (story.amountRaised / story.goal) * 100;

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
      

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-8 md:mb-10">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs md:text-sm font-medium text-primary">Trusted by 50,000+ donors worldwide</span>
            </div>

            {/* Headline - Specific & Impact-focused */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 text-foreground">
              <AnimatedCounter end={15000} /> families fed this month.
              <br />
              <span className="text-primary">Help us reach 20,000.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8 px-2">
              Your donation becomes real grocery coupons for families in need. 
              100% transparent. 95% goes directly to recipients.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-4 px-4 sm:px-0">
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 gap-2 w-full sm:w-auto"
                onClick={() => navigate('/donate')}
              >
                Start Donating
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                onClick={() => navigate('/apply')}
              >
                <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                Apply as Recipient
              </Button>
            </div>
            
            {/* Secondary CTA */}
            <div className="flex justify-center">
              <Button 
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground text-sm md:text-base"
                onClick={() => navigate('/how-it-works')}
              >
                <Play className="w-4 h-4" />
                See how it works
              </Button>
            </div>
          </div>

          {/* Featured Story Card */}
          {cmsLoading ? (
            <div className="max-w-2xl mx-auto mt-8 md:mt-12">
              <Card className="overflow-hidden border-border/50 shadow-lg">
                <div className="flex flex-col sm:flex-row">
                  <Skeleton className="h-40 sm:h-48 sm:w-48 flex-shrink-0" />
                  <div className="flex-1 p-4 md:p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-2 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
          <Link to={storyLink} className="block max-w-2xl mx-auto mt-8 md:mt-12">
            <Card className="overflow-hidden border-border/50 shadow-lg cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              <div className="flex flex-col sm:flex-row">
                <div className="h-40 sm:h-48 sm:w-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                  <img 
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-background/90 text-foreground text-xs font-medium">
                      Featured Story
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-4 md:p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm mb-1.5 md:mb-2">
                    <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span>{story.location}</span>
                  </div>
                  
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-1.5 md:mb-2">
                    {story.headline}
                  </h3>
                  
                  <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                    "{story.story}"
                  </p>
                  
                  {/* Progress */}
                  <div className="space-y-1.5 md:space-y-2">
                    <Progress value={progress} className="h-1.5 md:h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium">
                        ${story.amountRaised.toLocaleString()} raised
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {story.donorsCount} donors helped
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
          )}
        </div>
      </div>
    </section>
  );
}
