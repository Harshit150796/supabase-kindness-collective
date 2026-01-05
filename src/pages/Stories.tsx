import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { impactStories, ImpactStory } from '@/data/impactStories';
import { 
  Heart, 
  Users, 
  DollarSign, 
  Trophy, 
  Crown, 
  Medal,
  MapPin,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Coins
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

type CategoryFilter = 'all' | 'family' | 'child' | 'emergency' | 'community';

// Mock top donors data
const topDonors = [
  { id: 1, name: 'Anonymous Philanthropist', amount: 15000, donations: 45, brand: 'Whole Foods' },
  { id: 2, name: 'Sarah M.', amount: 8500, donations: 28, brand: 'Starbucks' },
  { id: 3, name: 'The Johnson Family', amount: 6200, donations: 31, brand: 'Target' },
  { id: 4, name: 'Michael R.', amount: 4800, donations: 19, brand: 'Costco' },
  { id: 5, name: 'Grace L.', amount: 3500, donations: 14, brand: 'Trader Joe\'s' },
];

// Mock brand partners data
const topBrands = [
  { name: 'Whole Foods', logo: 'https://logo.clearbit.com/wholefoods.com', totalRaised: 125000, donors: 892 },
  { name: 'Starbucks', logo: 'https://logo.clearbit.com/starbucks.com', totalRaised: 98000, donors: 1205 },
  { name: 'Target', logo: 'https://logo.clearbit.com/target.com', totalRaised: 87000, donors: 756 },
  { name: 'Costco', logo: 'https://logo.clearbit.com/costco.com', totalRaised: 72000, donors: 634 },
  { name: 'Trader Joe\'s', logo: 'https://logo.clearbit.com/traderjoes.com', totalRaised: 56000, donors: 489 },
];

// Community stats
const communityStats = {
  totalRaised: 438000,
  familiesHelped: 2847,
  activeDonors: 12500,
  avgDonation: 35,
};

export default function Stories() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredStories = activeCategory === 'all' 
    ? impactStories 
    : impactStories.filter(story => story.category === activeCategory);

  const categories: CategoryFilter[] = ['all', 'family', 'child', 'emergency', 'community'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Impact Stories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Heart className="w-3 h-3 mr-1" />
            Real Stories, Real Impact
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Meet the Families You're Helping
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every donation creates a ripple of hope. Discover the stories of families whose lives have been transformed through the generosity of donors like you.
          </p>
        </div>

        {/* Community Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              ${(communityStats.totalRaised / 1000).toFixed(0)}K+
            </div>
            <div className="text-sm text-muted-foreground">Total Raised</div>
          </div>
          <div className="bg-accent/5 rounded-2xl p-6 text-center border border-accent/10">
            <Users className="w-8 h-8 text-accent mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {communityStats.familiesHelped.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Families Helped</div>
          </div>
          <div className="bg-emerald-500/5 rounded-2xl p-6 text-center border border-emerald-500/10">
            <Heart className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {communityStats.activeDonors.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Active Donors</div>
          </div>
          <div className="bg-blue-500/5 rounded-2xl p-6 text-center border border-blue-500/10">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              ${communityStats.avgDonation}
            </div>
            <div className="text-sm text-muted-foreground">Avg. Donation</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All Stories' : categoryLabels[category]}
            </Button>
          ))}
        </div>

        {/* Stories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>

        {/* Top Donors Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 border-accent/30 text-accent">
              <Trophy className="w-3 h-3 mr-1" />
              Donor Leaderboard
            </Badge>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Our Top Donors
            </h2>
            <p className="text-muted-foreground">
              Celebrating the generous hearts making the biggest impact
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Individual Donors */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Individual Donors
              </h3>
              <div className="space-y-4">
                {topDonors.map((donor, index) => (
                  <div key={donor.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                      {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                      {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                      {index > 2 && <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{donor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {donor.donations} donations via {donor.brand}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">${donor.amount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Partners */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Top Brand Partners
              </h3>
              <div className="space-y-4">
                {topBrands.map((brand, index) => (
                  <div key={brand.name} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                      {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                      {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                      {index > 2 && <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>}
                    </div>
                    <img 
                      src={brand.logo} 
                      alt={brand.name}
                      className="w-8 h-8 rounded-lg object-contain bg-white p-1"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=random`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{brand.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {brand.donors.toLocaleString()} donors
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-accent">${(brand.totalRaised / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Button size="lg" className="gap-2" onClick={() => window.location.href = '/auth?mode=signup&role=donor'}>
              <Coins className="w-5 h-5" />
              Join the Leaderboard
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StoryCard({ story }: { story: ImpactStory }) {
  const progressPercent = (story.amountRaised / story.goal) * 100;

  return (
    <Link to={`/story/${story.id}`} className="block">
      <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={story.image} 
            alt={story.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <Badge className={`${categoryColors[story.category]} border`}>
              {categoryLabels[story.category]}
            </Badge>
          </div>
          {story.verified && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary/90 text-primary-foreground rounded-full p-1.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{story.location}</span>
            <span className="text-border">•</span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{story.dateHelped}</span>
          </div>
          
          <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{story.name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{story.story}</p>

          {/* Impact Badge */}
          <div className="bg-primary/5 rounded-lg px-3 py-2 mb-4">
            <p className="text-sm text-primary font-medium">{story.impact}</p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">${story.amountRaised.toLocaleString()} raised</span>
              <span className="font-medium text-foreground">${story.goal.toLocaleString()} goal</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{story.donorsCount} donors</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
