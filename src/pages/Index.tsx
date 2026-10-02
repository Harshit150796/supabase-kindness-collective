import { lazy, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhatWeDo } from '@/components/landing/WhatWeDo';
import { SEO } from '@/components/SEO';
import { LazyOnView } from '@/components/LazyOnView';
import { CompletedCampaigns, ProofFigures } from '@/components/proof/ProofSections';
import { WordReveal } from '@/components/ui/editorial-motion';

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

const Index = () => {
  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="CouponDonation - Transforming Giving Through Generosity"
        description="CouponDonation converts your donation into grocery coupons for verified families in need. Donate to causes from Walmart, Target, Amazon and more."
        path="/"
      />
      <Navbar />
      <main>
        {/* 1. Human-centered hero with featured story */}
        <HeroSection />

        <LiveActivityBar />

        <WhatWeDo />

        <LazyOnView minHeight={600} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <ImpactStories />
            <ProofFigures />
            <CompletedCampaigns limit={3} compact />
          </Suspense>
        </LazyOnView>

        <LazyOnView minHeight={600} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <TrustTransparency />
          </Suspense>
        </LazyOnView>

        <LazyOnView minHeight={500} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <BrandLeaderboard />
          </Suspense>
        </LazyOnView>

        <section className="bg-background py-24 md:py-36">
          <div className="container mx-auto max-w-6xl px-4">
            <WordReveal className="font-display text-5xl leading-tight text-foreground md:text-7xl">We don't track the person. We track the money.</WordReveal>
          </div>
        </section>

        <LazyOnView minHeight={700} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <DonationFlow />
          </Suspense>
        </LazyOnView>

        <LazyOnView minHeight={300} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <SecurityBadges />
          </Suspense>
        </LazyOnView>

        <LazyOnView minHeight={500} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <TestimonialsSection />
          </Suspense>
        </LazyOnView>

        <LazyOnView minHeight={400} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <ImpactDashboard />
          </Suspense>
        </LazyOnView>

        <LazyOnView minHeight={300} rootMargin="900px" contentVisibilityAuto>
          <Suspense fallback={null}>
            <CTASection />
          </Suspense>
        </LazyOnView>
      </main>
      <LazyOnView minHeight={300} rootMargin="900px" contentVisibilityAuto>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </LazyOnView>
    </div>
  );
};

export default Index;
