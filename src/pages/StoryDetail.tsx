import { useParams, Link, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { impactStories } from '@/data/impactStories';
import { StoryGallery } from '@/components/story/StoryGallery';
import { DonationPanel } from '@/components/story/DonationPanel';
import { UpdatesTimeline } from '@/components/story/UpdatesTimeline';
import { ShareButtons } from '@/components/story/ShareButtons';
import { RelatedStories } from '@/components/story/RelatedStories';
import { 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Heart,
  Users,
  Shield,
  User
} from 'lucide-react';

const categoryLabels: Record<string, string> = {
  family: 'Family Support',
  child: 'Child Welfare',
  emergency: 'Emergency Aid',
  community: 'Community',
};

const categoryColors: Record<string, string> = {
  family: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  child: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  emergency: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  community: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const story = impactStories.find(s => s.id === id);

  if (!story) {
    return <Navigate to="/stories" replace />;
  }

  const progressPercent = (story.amountRaised / story.goal) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/stories">Stories</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{story.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Left Column - Story Content */}
          <div className="space-y-8">
            {/* Image Gallery */}
            <StoryGallery 
              mainImage={story.image} 
              galleryImages={story.galleryImages}
              alt={story.name}
            />

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${categoryColors[story.category]} border`}>
                {categoryLabels[story.category]}
              </Badge>
              {story.verified && (
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified by CouponDonation
                </Badge>
              )}
              {story.familySize && (
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  Family of {story.familySize}
                </Badge>
              )}
            </div>

            {/* Identity Section */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {story.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{story.location}</span>
                </div>
                {story.dateHelped && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{story.dateHelped}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Donation Summary - Only visible on mobile */}
            <div className="lg:hidden bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    ${story.amountRaised.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    raised of ${story.goal.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-primary">
                    {Math.round(progressPercent)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {story.donorsCount} donors
                  </div>
                </div>
              </div>
              <Button size="lg" className="w-full gap-2" asChild>
                <Link to="/auth?mode=signup&role=donor">
                  <Heart className="w-5 h-5" />
                  Donate Now
                </Link>
              </Button>
            </div>

            {/* Impact Badge */}
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
              <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                <Heart className="w-5 h-5" />
                Impact Achieved
              </div>
              <p className="text-xl text-foreground font-medium">{story.impact}</p>
            </div>

            {/* The Story */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">The Story</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {story.fullStory.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <Separator />

            {/* Updates Section */}
            {story.updates && story.updates.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Updates
                </h2>
                <UpdatesTimeline updates={story.updates} />
              </div>
            )}

            {/* Organizer Section */}
            {story.organizer && (
              <div className="bg-muted/30 rounded-xl p-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Campaign Organizer
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {story.organizer.avatar ? (
                      <img 
                        src={story.organizer.avatar} 
                        alt={story.organizer.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{story.organizer.name}</div>
                    <div className="text-sm text-muted-foreground">{story.organizer.relationship}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Campaign verified by CouponDonation</span>
                </div>
              </div>
            )}

            {/* Mobile Share Section */}
            <div className="lg:hidden">
              <h3 className="text-lg font-semibold text-foreground mb-3">Share this story</h3>
              <ShareButtons title={`Help ${story.name} - CouponDonation`} />
            </div>
          </div>

          {/* Right Column - Sticky Donation Panel (Desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <DonationPanel story={story} />
            </div>
          </div>
        </div>

        {/* Related Stories */}
        <RelatedStories currentStoryId={story.id} category={story.category} />
      </main>

      {/* Mobile Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40">
        <div className="container mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="text-lg font-bold text-foreground">
              ${story.amountRaised.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                of ${story.goal.toLocaleString()}
              </span>
            </div>
          </div>
          <Button size="lg" className="gap-2" asChild>
            <Link to="/auth?mode=signup&role=donor">
              <Heart className="w-5 h-5" />
              Donate
            </Link>
          </Button>
          <ShareButtons title={`Help ${story.name}`} compact />
        </div>
      </div>

      {/* Add padding for fixed bottom bar on mobile */}
      <div className="lg:hidden h-20" />

      <Footer />
    </div>
  );
}
