import { lazy } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { LiveActivityBar } from '@/components/landing/LiveActivityBar';
import { SEO } from '@/components/SEO';
import { LazySection } from '@/components/landing/LazySection';

// Heavy below-the-fold sections — split into their own chunks and mounted on scroll.
const ImpactStories = lazy(() =>
  import('@/components/landing/ImpactStories').then((m) => ({ default: m.ImpactStories }))
);
const TrustTransparency = lazy(() =>
  import('@/components/landing/TrustTransparency').then((m) => ({ default: m.TrustTransparency }))
);
const BrandLeaderboard = lazy(() =>
  import('@/components/landing/BrandLeaderboard').then((m) => ({ default: m.BrandLeaderboard }))
);
const DonationFlow = lazy(() =>
  import('@/components/landing/DonationFlow').then((m) => ({ default: m.DonationFlow }))
);
const SecurityBadges = lazy(() =>
  import('@/components/landing/SecurityBadges').then((m) => ({ default: m.SecurityBadges }))
);
const TestimonialsSection = lazy(() =>
  import('@/components/landing/TestimonialsSection').then((m) => ({ default: m.TestimonialsSection }))
);
const ImpactDashboard = lazy(() =>
  import('@/components/landing/ImpactDashboard').then((m) => ({ default: m.ImpactDashboard }))
);
const CTASection = lazy(() =>
  import('@/components/landing/CTASection').then((m) => ({ default: m.CTASection }))
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="CouponDonation - Transforming Giving Through Generosity"
        description="CouponDonation converts your donation into grocery coupons for verified families in need. Donate to causes from Walmart, Target, Amazon and more."
        path="/"
      />
      <Navbar />
      <main>
        {/* 1. Human-centered hero with featured story */}
        <HeroSection />

        {/* 2. Live activity - creates urgency and social proof */}
        <LiveActivityBar />

        {/* 3. Real recipient stories - builds emotional connection */}
        <LazySection minHeight={520}><ImpactStories /></LazySection>

        {/* 4. Transparency - where money goes + how it works flow */}
        <LazySection minHeight={600}><TrustTransparency /></LazySection>

        {/* 5. Brand leaderboard - Top Donors → Live Leaderboard */}
        <LazySection minHeight={520}><BrandLeaderboard /></LazySection>

        {/* 6. Donation flow - impact-focused, not rewards-focused */}
        <LazySection minHeight={640}><DonationFlow /></LazySection>

        {/* 7. Security badges - trust reassurance before testimonials */}
        <LazySection minHeight={240}><SecurityBadges /></LazySection>

        {/* 8. Community testimonials with photos */}
        <LazySection minHeight={520}><TestimonialsSection /></LazySection>

        {/* 9. Overall impact statistics */}
        <LazySection minHeight={420}><ImpactDashboard /></LazySection>

        {/* 10. Final call to action */}
        <LazySection minHeight={360}><CTASection /></LazySection>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
