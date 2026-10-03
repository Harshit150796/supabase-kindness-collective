import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type OwnerCoupon = {
  id: string; donation_id: string; store_name: string; value: number | null;
  status: string; code: string | null; redemption_url: string | null;
};

/** Coupons created from one donation, as seen by the fundraiser owner/team. */
export function DonationCouponList({ coupons, isOwner = true }: { coupons: OwnerCoupon[]; isOwner?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!coupons.length) return null;
  const copy = async (c: OwnerCoupon) => {
    if (!c.code) return;
    try { await navigator.clipboard.writeText(c.code); setCopied(c.id); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <ul className="mt-3 space-y-2">
      {coupons.map((c) => (
        <li key={c.id} className="rounded-lg bg-background p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-foreground">${Number(c.value ?? 0)} {c.store_name} coupon</span>
            {!c.code && (!isOwner && ['claimed', 'reserved', 'redeemed'].includes(c.status)
              ? <span className="text-xs text-muted-foreground">Code visible to the fundraiser owner</span>
              : !c.code && c.status !== 'redeemed' && <span className="text-xs text-muted-foreground">Coupon being prepared</span>)}
            {c.status === 'redeemed' && <span className="text-xs text-muted-foreground">Used</span>}
          </div>
          {isOwner && c.code && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm tracking-wide text-foreground break-all">{c.code}</code>
              <Button size="sm" variant="outline" onClick={() => copy(c)}>
                {copied === c.id ? <><Check className="mr-1 h-3.5 w-3.5" />Copied</> : <><Copy className="mr-1 h-3.5 w-3.5" />Copy</>}
              </Button>
              {c.redemption_url && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={c.redemption_url} target="_blank" rel="noopener noreferrer">Redeem <ExternalLink className="ml-1 h-3.5 w-3.5" /></a>
                </Button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
