import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { LiveActivityBar } from '@/components/landing/LiveActivityBar';
import { ImpactStories } from '@/components/landing/ImpactStories';
import { TrustTransparency } from '@/components/landing/TrustTransparency';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { BrandLeaderboard } from '@/components/landing/BrandLeaderboard';
import { ImpactDashboard } from '@/components/landing/ImpactDashboard';
import { CTASection } from '@/components/landing/CTASection';
import { SEO } from '@/components/SEO';

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
        <ImpactStories />

        {/* 4. Transparency - where money goes + how it works flow */}
        <TrustTransparency />

        {/* 5. Brand leaderboard - Top Donors → Live Leaderboard */}
        <BrandLeaderboard />

        {/* 6. Donation flow - impact-focused, not rewards-focused */}
        <DonationFlow />

        {/* 7. Security badges - trust reassurance before testimonials */}
        <SecurityBadges />

        {/* 8. Community testimonials with photos */}
        <TestimonialsSection />

        {/* 9. Overall impact statistics */}
        <ImpactDashboard />

        {/* 10. Final call to action */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
