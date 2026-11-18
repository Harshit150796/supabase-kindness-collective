import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';

export default function Donate() {
  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title="Donate Coupons and Gift Cards to Families in Need"
        description="Pick stores like Walmart, Kroger or CVS and give from $10. Your donation becomes coupons for a family who asked for help, with a receipt for every gift."
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
