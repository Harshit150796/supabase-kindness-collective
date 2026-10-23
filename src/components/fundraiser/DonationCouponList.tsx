export type OwnerCoupon = {
  id: string; donation_id: string; store_name: string; value: number | null;
  status: string; code: string | null; redemption_url: string | null;
  revealed_at?: string | null; used_at?: string | null; used_category?: string | null; used_note?: string | null;
  receipt_count?: number; can_reveal?: boolean;
  issued_brand?: string | null; credential_type?: string | null; card_last4?: string | null; value_expires_on?: string | null;
};

const label = (c: OwnerCoupon, isOwner: boolean) =>
  c.used_at ? 'Used' : c.revealed_at ? 'Received' : c.can_reveal ? 'Ready to reveal in Coupons'
  : !isOwner && ['claimed', 'reserved', 'redeemed'].includes(c.status) ? 'Code visible to the fundraiser owner' : 'Coupon being prepared';

const tone = (c: OwnerCoupon) => c.used_at
  ? 'bg-muted text-muted-foreground'
  : c.revealed_at || c.can_reveal
    ? 'bg-primary/10 text-primary'
    : 'bg-warning/15 text-warning-foreground';

/** Coupons created from one donation (status only — codes are revealed in the Coupons section). */
export function DonationCouponList({ coupons, isOwner = true }: { coupons: OwnerCoupon[]; isOwner?: boolean }) {
  if (!coupons.length) return null;
  return (
    <ul className="ml-12 mt-2 flex flex-wrap gap-1.5">
      {coupons.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-full bg-muted/70 px-2.5 py-1 text-[12px] transition-colors duration-200 hover:bg-secondary">
          <span className="font-semibold text-foreground">${Number(c.value ?? 0)} {c.issued_brand || c.store_name}</span>
          {c.can_reveal && !c.revealed_at
            ? <a href="#coupons" className={`rounded-full px-2 py-0.5 font-semibold ${tone(c)}`}>Ready to reveal</a>
            : <span className={`rounded-full px-2 py-0.5 font-semibold ${tone(c)}`}>{label(c, isOwner)}</span>}
        </li>
      ))}
    </ul>
  );
}
