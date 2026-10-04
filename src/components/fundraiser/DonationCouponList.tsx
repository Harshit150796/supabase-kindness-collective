export type OwnerCoupon = {
  id: string; donation_id: string; store_name: string; value: number | null;
  status: string; code: string | null; redemption_url: string | null;
  revealed_at?: string | null; used_at?: string | null; used_category?: string | null; used_note?: string | null;
  receipt_count?: number; can_reveal?: boolean;
};

const label = (c: OwnerCoupon, isOwner: boolean) =>
  c.used_at ? 'Used' : c.revealed_at ? 'Received' : c.can_reveal ? 'Ready to reveal in Coupons'
  : !isOwner && ['claimed', 'reserved', 'redeemed'].includes(c.status) ? 'Code visible to the fundraiser owner' : 'Coupon being prepared';

/** Coupons created from one donation (status only — codes are revealed in the Coupons section). */
export function DonationCouponList({ coupons, isOwner = true }: { coupons: OwnerCoupon[]; isOwner?: boolean }) {
  if (!coupons.length) return null;
  return (
    <ul className="mt-3 space-y-2">
      {coupons.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background p-3 text-sm">
          <span className="font-medium text-foreground">${Number(c.value ?? 0)} {c.store_name} coupon</span>
          {c.can_reveal && !c.revealed_at
            ? <a href="#coupons" className="text-xs text-primary">Ready to reveal in Coupons</a>
            : <span className="text-xs text-muted-foreground">{label(c, isOwner)}</span>}
        </li>
      ))}
    </ul>
  );
}
