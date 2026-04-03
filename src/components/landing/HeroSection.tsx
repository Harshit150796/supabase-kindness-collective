import { Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentFeaturedStory } from '@/hooks/useFeaturedStories';
import { useCMSStories } from '@/hooks/useCMSContent';
import logo from '@/assets/logo.png';

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
    <section className="relative flex flex-col items-center overflow-hidden bg-white">
      <div className="container mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16 relative z-10">
        {/* Centered Logo */}
        <div className="flex justify-center mb-12 md:mb-16">
          <img
            src={logo}
            alt="CouponDonation"
            className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 object-contain drop-shadow-lg"
          />
        </div>

        {/* Featured Story Card */}
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
                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-white/90 text-foreground text-xs font-medium">
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
