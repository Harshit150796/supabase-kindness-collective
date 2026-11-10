import { Link } from 'react-router-dom';

// Same file the homepage opening shows, so the logo it flies into the nav is pixel-identical.
const logo = '/brand/logo-256.webp';

/**
 * The header brand. The homepage opening measures `[data-nav-brand] img` and lands its
 * lockup on this exact geometry, so the sizes and spacing here must not change.
 */
export function BrandLockup({ navBrand = false, onClick }: { navBrand?: boolean; onClick?: () => void }) {
  return (
    <Link to="/" data-nav-brand={navBrand ? '' : undefined} onClick={onClick} className="group flex min-h-11 shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <img src={logo} alt="CouponDonation" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" width={48} height={48} loading="eager" decoding="async" />
      <div className="flex flex-col">
        <span className="font-bold text-base sm:text-lg leading-tight">
          <span className="brand-coupon">Coupon</span>
          <span className="brand-donation">Donation</span>
        </span>
        <span className="hidden text-xs text-muted-foreground leading-tight sm:block">Transforming Giving</span>
      </div>
    </Link>
  );
}
