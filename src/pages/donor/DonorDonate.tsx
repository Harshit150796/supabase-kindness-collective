import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DonationFlow } from '@/components/landing/DonationFlow';
import { SecurityBadges } from '@/components/landing/SecurityBadges';

export default function DonorDonate() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Make a Donation</h1>
          <p className="text-muted-foreground mt-1">
            Your contribution helps families in need through partner brand coupons
          </p>
        </div>
        
        {/* Donation Flow - Stripe integration */}
        <DonationFlow />
        
        {/* Security Badges for Trust */}
        <SecurityBadges />
      </div>
    </DashboardLayout>
  );
}
