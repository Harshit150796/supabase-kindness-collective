import { useState } from 'react';
import { MapPin, Users, Heart, Quote, BadgeCheck, Calendar, Filter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { impactStories, ImpactStory } from '@/data/impactStories';

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

type CategoryFilter = 'all' | ImpactStory['category'];

const Stories = () => {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  const filteredStories = activeFilter === 'all' 
    ? impactStories 
    : impactStories.filter(story => story.category === activeFilter);

  const totalRaised = impactStories.reduce((sum, story) => sum + story.amountRaised, 0);
  const totalDonors = impactStories.reduce((sum, story) => sum + story.donorsCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Real Stories, Real Impact
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Stories of Hope & Generosity
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Every donation creates a ripple of hope. Meet the families and communities 
                whose lives have been transformed by donors like you.
              </p>
              
              {/* Impact Stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">${totalRaised.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Raised</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{totalDonors.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Generous Donors</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{impactStories.length}</p>
                  <p className="text-sm text-muted-foreground">Families Helped</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                All Stories
              </Button>
              <Button
                variant={activeFilter === 'family' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('family')}
                className={activeFilter === 'family' ? '' : 'hover:bg-primary/10 hover:text-primary'}
              >
                Feed a Family
              </Button>
              <Button
                variant={activeFilter === 'child' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('child')}
                className={activeFilter === 'child' ? '' : 'hover:bg-amber-500/10 hover:text-amber-600'}
              >
                Help a Child
              </Button>
              <Button
                variant={activeFilter === 'emergency' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('emergency')}
                className={activeFilter === 'emergency' ? '' : 'hover:bg-red-500/10 hover:text-red-600'}
              >
                Emergency Relief
              </Button>
              <Button
                variant={activeFilter === 'community' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('community')}
                className={activeFilter === 'community' ? '' : 'hover:bg-blue-500/10 hover:text-blue-600'}
              >
                Community Support
              </Button>
            </div>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => {
                const progress = (story.amountRaised / story.goal) * 100;
                
                return (
                  <Card 
                    key={story.id} 
                    className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50"
                  >
                    {/* Image */}
                    <div className="h-56 relative overflow-hidden">
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
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium">
                            <BadgeCheck className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
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
                      
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        {story.name}
                      </h3>
                      
                      <div className="relative mb-4">
                        <Quote className="absolute -top-1 -left-1 w-4 h-4 text-primary/30" />
                        <p className="text-muted-foreground text-sm leading-relaxed pl-4">
                          {story.story}
                        </p>
                      </div>
                      
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
                            ${story.amountRaised.toLocaleString()} of ${story.goal.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {story.donorsCount} donors
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredStories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No stories found for this category.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Be Part of Someone's Story
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Your donation, no matter how small, can make a real difference in someone's life. 
              Join our community of generous donors today.
            </p>
            <Button size="lg" className="gap-2">
              <Heart className="w-4 h-4" />
              Start Donating
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Stories;
