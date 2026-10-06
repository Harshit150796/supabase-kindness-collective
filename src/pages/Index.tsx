import { lazy } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhatWeDo } from '@/components/landing/WhatWeDo';
import { SEO } from '@/components/SEO';
import { LazyOnView } from '@/components/LazyOnView';
import { CompletedCampaigns } from '@/components/proof/ProofSections';
import { WordReveal } from '@/components/ui/editorial-motion';

// Below-the-fold sections — lazy chunks, only fetched as user scrolls.
import { LiveActivityBar } from '@/components/landing/LiveActivityBar';
const ImpactStories = lazy(() => import('@/components/landing/ImpactStories').then(m => ({ default: m.ImpactStories })));
const TrustTransparency = lazy(() => import('@/components/landing/TrustTransparency').then(m => ({ default: m.TrustTransparency })));
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

        <LazyOnView minHeight={2700} intrinsicSize={{ mobile: 2700, tablet: 1650, desktop: 1450 }} rootMargin="900px" contentVisibilityAuto>
          <>
            <ImpactStories />
            <CompletedCampaigns limit={3} compact />
          </>
        </LazyOnView>

        <LazyOnView minHeight={510} intrinsicSize={{ mobile: 510, tablet: 480, desktop: 430 }} rootMargin="900px" contentVisibilityAuto>
          <>
            <TrustTransparency />
          </>
        </LazyOnView>


        <section className="bg-background py-12 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <WordReveal className="font-display text-5xl leading-tight text-foreground md:text-7xl">We don't track the person. We track the money.</WordReveal>
          </div>
        </section>

        <LazyOnView minHeight={1550} intrinsicSize={{ mobile: 1550, tablet: 1250, desktop: 900 }} rootMargin="900px" contentVisibilityAuto>
          <>
            <DonationFlow />
          </>
        </LazyOnView>

        <LazyOnView minHeight={780} intrinsicSize={{ mobile: 780, tablet: 710, desktop: 480 }} rootMargin="900px" contentVisibilityAuto>
          <>
            <SecurityBadges />
          </>
        </LazyOnView>

        <LazyOnView minHeight={680} intrinsicSize={{ mobile: 680, tablet: 1100, desktop: 760 }} rootMargin="900px" contentVisibilityAuto>
          <>
            <TestimonialsSection />
          </>
        </LazyOnView>

        <LazyOnView minHeight={1100} intrinsicSize={{ mobile: 1100, tablet: 900, desktop: 800 }} rootMargin="900px" contentVisibilityAuto>
          <>
            <ImpactDashboard />
          </>
        </LazyOnView>

        <LazyOnView minHeight={470} intrinsicSize={{ mobile: 470, tablet: 420, desktop: 400 }} rootMargin="900px" contentVisibilityAuto>
          <>
            <CTASection />
          </>
        </LazyOnView>
      </main>
      <LazyOnView minHeight={1150} intrinsicSize={{ mobile: 1150, tablet: 700, desktop: 470 }} rootMargin="900px" contentVisibilityAuto>
        <>
          <Footer />
        </>
      </LazyOnView>
    </div>
  );
};

export default Index;
