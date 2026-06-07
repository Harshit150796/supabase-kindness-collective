import { lazy, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { SEO } from '@/components/SEO';
import { LazyOnView } from '@/components/LazyOnView';

// Below-the-fold sections — lazy chunks, only fetched as user scrolls.
import { LiveActivityBar } from '@/components/landing/LiveActivityBar';
const ImpactStories = lazy(() => import('@/components/landing/ImpactStories').then(m => ({ default: m.ImpactStories })));
const TrustTransparency = lazy(() => import('@/components/landing/TrustTransparency').then(m => ({ default: m.TrustTransparency })));
const BrandLeaderboard = lazy(() => import('@/components/landing/BrandLeaderboard').then(m => ({ default: m.BrandLeaderboard })));
const DonationFlow = lazy(() => import('@/components/landing/DonationFlow').then(m => ({ default: m.DonationFlow })));
const SecurityBadges = lazy(() => import('@/components/landing/SecurityBadges').then(m => ({ default: m.SecurityBadges })));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const ImpactDashboard = lazy(() => import('@/components/landing/ImpactDashboard').then(m => ({ default: m.ImpactDashboard })));
const CTASection = lazy(() => import('@/components/landing/CTASection').then(m => ({ default: m.CTASection })));
const Footer = lazy(() => import('@/components/layout/Footer').then(m => ({ default: m.Footer })));

const Fallback = ({ h = 400 }: { h?: number }) => <div style={{ minHeight: h }} aria-hidden />;

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

        <Suspense fallback={<Fallback h={80} />}>
          <LazyOnView minHeight={80}>
            <LiveActivityBar />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={600} />}>
          <LazyOnView minHeight={600}>
            <ImpactStories />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={600} />}>
          <LazyOnView minHeight={600}>
            <TrustTransparency />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={500} />}>
          <LazyOnView minHeight={500}>
            <BrandLeaderboard />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={700} />}>
          <LazyOnView minHeight={700}>
            <DonationFlow />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={300} />}>
          <LazyOnView minHeight={300}>
            <SecurityBadges />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={500} />}>
          <LazyOnView minHeight={500}>
            <TestimonialsSection />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={400} />}>
          <LazyOnView minHeight={400}>
            <ImpactDashboard />
          </LazyOnView>
        </Suspense>

        <Suspense fallback={<Fallback h={300} />}>
          <LazyOnView minHeight={300}>
            <CTASection />
          </LazyOnView>
        </Suspense>
      </main>
      <Suspense fallback={<Fallback h={300} />}>
        <LazyOnView minHeight={300}>
          <Footer />
        </LazyOnView>
      </Suspense>
    </div>
  );
};

export default Index;
