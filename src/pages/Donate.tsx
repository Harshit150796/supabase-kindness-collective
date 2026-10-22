import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';

export default function Donate() {
  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="Donate Now — Turn Your Gift Into Grocery Coupons"
        description="Support US families with store coupons and gift cards. Choose stores like Walmart, Target or Amazon, and track where your gift goes."
        path="/donate"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Donate', path: '/donate' }])}
      />
      <Navbar />
      <main>
        <DonationFlow />
        <SecurityBadges />
      </main>
      <Footer />
    </div>
  );
}
