import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, MapPin, Users, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { featuredStory } from '@/data/impactStories';

// Circular photos of recipients around the hero
const recipientPhotos = [
  { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', position: 'top-20 left-[8%]' },
  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', position: 'top-32 right-[12%]' },
  { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', position: 'bottom-40 left-[5%]' },
  { src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', position: 'top-48 left-[18%]' },
  { src: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=80&h=80&fit=crop&crop=face', position: 'bottom-32 right-[8%]' },
  { src: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=80&h=80&fit=crop&crop=face', position: 'top-24 right-[22%]' },
];

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
  const progress = (featuredStory.amountRaised / featuredStory.goal) * 100;

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
      
      {/* Floating recipient photos */}
      {recipientPhotos.map((photo, i) => (
        <div 
          key={i}
          className={`absolute ${photo.position} hidden lg:block`}
          style={{ animationDelay: `${i * 0.5}s` }}
        >
          <div className="relative">
            <img 
              src={photo.src}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-4 border-background shadow-lg opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs">❤️</span>
            </div>
          </div>
        </div>
      ))}

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
                onClick={() => navigate('/auth?mode=signup&role=donor')}
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
                Apply for Help
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
          <Card className="max-w-2xl mx-auto mt-8 md:mt-12 overflow-hidden border-border/50 shadow-lg">
            <div className="flex flex-col sm:flex-row">
              <div className="h-48 sm:w-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                <img 
                  src={featuredStory.image}
                  alt={featuredStory.name}
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
                  <span>{featuredStory.location}</span>
                </div>
                
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-1.5 md:mb-2">
                  {featuredStory.name}'s family received groceries for 3 months
                </h3>
                
                <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                  "{featuredStory.story}"
                </p>
                
                {/* Progress */}
                <div className="space-y-1.5 md:space-y-2">
                  <Progress value={progress} className="h-1.5 md:h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium">
                      ${featuredStory.amountRaised.toLocaleString()} raised
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {featuredStory.donorsCount} donors helped
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
