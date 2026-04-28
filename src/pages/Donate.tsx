import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';

export default function Donate() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Donate - Turn Your Gift Into Grocery Coupons"
        description="Make a tax-deductible donation that becomes real grocery coupons for verified families. Choose your amount, select brands like Walmart, Target, or Amazon, and see your impact."
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
