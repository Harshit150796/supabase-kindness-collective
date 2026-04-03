import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { VineBackground } from '@/components/landing/VineBackground';
import { LiveActivityBar } from '@/components/landing/LiveActivityBar';
import { ImpactStories } from '@/components/landing/ImpactStories';
import { TrustTransparency } from '@/components/landing/TrustTransparency';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { BrandLeaderboard } from '@/components/landing/BrandLeaderboard';
import { ImpactDashboard } from '@/components/landing/ImpactDashboard';
import { CTASection } from '@/components/landing/CTASection';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="relative">
        <VineBackground />
        <div className="relative z-10">
          <HeroSection />
          <LiveActivityBar />
          <ImpactStories />
          <TrustTransparency />
          <BrandLeaderboard />
          <DonationFlow />
          <SecurityBadges />
          <TestimonialsSection />
          <ImpactDashboard />
          <CTASection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
