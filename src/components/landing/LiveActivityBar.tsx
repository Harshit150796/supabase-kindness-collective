import { memo, useEffect, useRef, useState } from 'react';
import { Heart, TrendingUp, Users, Zap } from 'lucide-react';
import { popularBrands } from '@/data/brandLogos';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [currentDonation, setCurrentDonation] = useState<DonationEvent>(() => generateDonation(1));
  const [donationCount, setDonationCount] = useState(8234);
  const [amountRaised, setAmountRaised] = useState(127450);
  const scrollingRef = useRef(false);

  // Track scroll activity on mobile so we can pause text rotation during swipes
  useEffect(() => {
    if (!isMobile) return;
    let timer: number | undefined;
    const onScroll = () => {
      scrollingRef.current = true;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        scrollingRef.current = false;
      }, 250);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) window.clearTimeout(timer);
    };
  }, [isMobile]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Don't change text mid-swipe on mobile — feels like blinking
      if (scrollingRef.current) return;
      const next = generateDonation(Date.now());
      setCurrentDonation(next);
      if (Math.random() > 0.5) {
        setDonationCount((c) => c + 1);
        setAmountRaised((a) => a + next.amount);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  if (!currentDonation) return null;

  return (
    <section className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-y border-border/50 overflow-hidden">
      {/* Animated tint only on desktop — kept off mobile for stable rendering */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50 hidden md:block md:animate-pulse" />

      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 min-h-[44px]">

          {/* Live Donation Feed */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full md:w-auto justify-center md:justify-start min-h-[32px]">
            <div className="relative flex-shrink-0">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full md:animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full opacity-0 md:opacity-100 md:animate-ping" />
            </div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Live</span>
            <DonationPill donation={currentDonation} />
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">1</span>
                <span className="hidden sm:inline"> donation</span>/8s
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{donationCount.toLocaleString()}</span>
                <span className="hidden sm:inline"> today</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">${(amountRaised / 1000).toFixed(0)}K</span>
                <span className="hidden sm:inline"> raised</span>
              </span>
            </div>
          </div>

          {/* Scrolling Brand Logos — desktop inline */}
          <div className="hidden lg:flex items-center gap-3 overflow-hidden max-w-xs">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Powered by</span>
            <div className="flex gap-4 overflow-hidden">
              <div className="flex gap-4 animate-marquee">
                {popularBrands.slice(0, 6).map((brand) => (
                  <div
                    key={brand.name}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
                    title={brand.name}
                  >
                    <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" />
                  </div>
                ))}
                {popularBrands.slice(0, 6).map((brand) => (
                  <div
                    key={`${brand.name}-dup`}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
                    title={brand.name}
                  >
                    <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only brand marquee row */}
        <div
          aria-hidden="true"
          className="lg:hidden mt-2 -mx-4 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="flex gap-3 animate-marquee w-max px-4">
            {[...popularBrands, ...popularBrands].map((brand, i) => (
              <div
                key={`m-${brand.name}-${i}`}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
              >
                <img src={brand.logo} alt="" className="w-4 h-4 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Memoised pill so the surrounding stats row and brand marquee don't reflow
// every 3.5s when only the donation event changes.
const DonationPill = memo(function DonationPill({ donation }: { donation: DonationEvent }) {
  return (
    <div className="flex items-center gap-2 bg-background md:bg-background/80 md:backdrop-blur-sm rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-border/50 shadow-sm max-w-[280px] md:max-w-none">
      <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary fill-primary md:animate-pulse flex-shrink-0" />
      <div className="overflow-hidden">
        <p className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap truncate">
          <span className="font-semibold">{donation.name}</span>
          {' '}donated{' '}
          <span className="text-primary font-bold">${donation.amount}</span>
          <span className="hidden sm:inline">
            {' '}via{' '}
            <span className="text-muted-foreground">{donation.brand}</span>
          </span>
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{donation.timeAgo}</span>
    </div>
  );
});

