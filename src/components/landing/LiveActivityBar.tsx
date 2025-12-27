import { useEffect, useState } from 'react';
import { Heart, TrendingUp, Users, Zap } from 'lucide-react';
import { popularBrands } from '@/data/brandLogos';

interface DonationEvent {
  id: number;
  name: string;
  amount: number;
  brand: string;
  timeAgo: string;
}

const generateDonation = (id: number): DonationEvent => {
  const names = ['Sarah M.', 'John D.', 'Emily R.', 'Michael T.', 'Lisa K.', 'David P.', 'Anna S.', 'James W.'];
  const amounts = [25, 50, 75, 100, 150, 200, 250];
  const brands = popularBrands.map(b => b.name);
  const times = ['just now', '10s ago', '30s ago', '1m ago', '2m ago'];
  
  return {
    id,
    name: names[Math.floor(Math.random() * names.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    brand: brands[Math.floor(Math.random() * brands.length)],
    timeAgo: times[Math.floor(Math.random() * times.length)]
  };
};

export const LiveActivityBar = () => {
  const [donations, setDonations] = useState<DonationEvent[]>([
    generateDonation(1),
    generateDonation(2),
    generateDonation(3)
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [donationCount, setDonationCount] = useState(8234);
  const [amountRaised, setAmountRaised] = useState(127450);

  // Rotate through donations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % donations.length);
      
      // Occasionally add new donation
      if (Math.random() > 0.5) {
        const newDonation = generateDonation(Date.now());
        setDonations(prev => [...prev.slice(-4), newDonation]);
        setDonationCount(prev => prev + 1);
        setAmountRaised(prev => prev + newDonation.amount);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [donations.length]);

  const currentDonation = donations[currentIndex];

  return (
    <section className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-y border-border/50 overflow-hidden">
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 animate-pulse opacity-50" />
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Live Donation Feed */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            </div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Live</span>
            
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border/50 shadow-sm">
              <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground whitespace-nowrap animate-fade-in" key={currentDonation.id}>
                  <span className="font-semibold">{currentDonation.name}</span>
                  {' '}donated{' '}
                  <span className="text-primary font-bold">${currentDonation.amount}</span>
                  {' '}via{' '}
                  <span className="text-muted-foreground">{currentDonation.brand}</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{currentDonation.timeAgo}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">1 donation</span> every 8 seconds
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{donationCount.toLocaleString()}</span> today
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">${amountRaised.toLocaleString()}</span> raised
              </span>
            </div>
          </div>

          {/* Scrolling Brand Logos */}
          <div className="hidden lg:flex items-center gap-3 overflow-hidden max-w-xs">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Powered by</span>
            <div className="flex gap-4 animate-marquee">
              {popularBrands.slice(0, 6).map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
                  title={brand.name}
                >
                  <span className="text-lg">{brand.logo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
