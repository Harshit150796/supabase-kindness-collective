import { Link } from 'react-router-dom';
import { MapPin, Users, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentFeaturedStory } from '@/hooks/useFeaturedStories';
import { useCMSStories } from '@/hooks/useCMSContent';
import heroEarthHeart from '@/assets/hero-earth-heart.png';
import heroEarthHands from '@/assets/hero-earth-hands.png';

export function HeroSection() {
  const { data: cmsStories, isLoading: cmsLoading } = useCMSStories(true);
  const { story: rotatingStory } = useCurrentFeaturedStory();

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
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex flex-col items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Split-screen image layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 items-center relative max-w-5xl mx-auto mb-10 md:mb-14">
          {/* Left side - Earth heart image */}
          <div className="flex justify-center md:justify-end md:pr-8">
            <img
              src={heroEarthHeart}
              alt="CouponDonation - Giving with heart"
              className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-xl"
            />
          </div>

          {/* Center connector badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex">
            <div className="flex items-center gap-2 bg-background border border-border shadow-lg px-4 py-2 rounded-full">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Transparent & Secure Donations
              </span>
            </div>
          </div>

          {/* Right side - Placeholder for second image */}
          <div className="flex justify-center md:justify-start md:pl-8">
            <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Second image coming soon</span>
            </div>
          </div>

          {/* Mobile connector badge */}
          <div className="flex md:hidden justify-center -mt-3 -mb-3 order-2 col-span-1">
            <div className="flex items-center gap-2 bg-background border border-border shadow-md px-4 py-2 rounded-full">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Transparent & Secure Donations
              </span>
            </div>
          </div>
        </div>

        {/* Featured Story Card (preserved) */}
        {cmsLoading ? (
          <div className="max-w-2xl mx-auto">
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
          <Link to={storyLink} className="block max-w-2xl mx-auto">
            <Card className="overflow-hidden border-border/50 shadow-lg cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              <div className="flex flex-col sm:flex-row">
                <div className="h-40 sm:h-48 sm:w-48 relative overflow-hidden flex-shrink-0">
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
    </section>
  );
}
