import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';

export default function Donate() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <DonationFlow />
        <SecurityBadges />
      </main>
      <Footer />
    </div>
  );
}
