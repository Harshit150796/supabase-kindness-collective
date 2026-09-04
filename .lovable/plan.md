# Rethinking the strip under the hero

## The honest read on what's there

Today's strip is a simulated activity ticker: donor names, amounts, retailers and "10s ago" timestamps are generated in the browser every 3.5 seconds. Alongside it sit a "Live program" badge and a hardcoded "24 donations".

What the database actually holds: 19 completed donations, $1,214 raised, 116 vouchers created, 10 live campaigns, 4 active retail partners, 3 distinct donors.

Two independent problems:

1. **Credibility.** A simulated feed is the single easiest thing for a payments underwriter or a sharp donor to catch — the numbers don't reconcile with the ledger, and the moment a visitor notices "David P." reappears with a different amount, everything else on the page becomes suspect.
2. **Job to be done.** The strip is prime real estate — the first thing after the hero, seen by 100% of visitors — and it currently spends that on ambient noise instead of answering the one question a first-time visitor has: *what actually happens to my money?*

Removing the fake parts is settled. The real question is what earns that space.

## Four patterns worth considering

### A. Mechanism strip — "money in, voucher out" (recommended)
A single horizontal three-beat: `You give $25` → `We buy a retailer voucher` → `A US family redeems it`, with small retailer logos sitting on the middle beat and a "no cash ever leaves the platform" micro-line. Beats connect with a thin animated line that draws once on scroll.

This is what Stripe, Wise, Plaid and Ramp all do directly under the hero: explain the mechanism in one glance before asking for anything. It's the strongest fit here because the product is genuinely unusual — visitors don't yet know that donations become vouchers, and that's the differentiator. Every word is defensible under compliance review, and nothing depends on volume, so it looks just as strong at 19 donations as at 19,000.

### B. Verified metrics bar
Same layout as today but every number pulled live from the database with a "verified from ledger" tooltip: funds converted, vouchers created, live campaigns, retail partners. Honest and cheap to build.
Weakness: at current volume, real numbers read small. Charity: Water only leads with counters because the counters are big. A truthful `19 donations` under the hero invites the wrong comparison.

### C. Progress-to-goal bar
One community goal — "Fund 1,000 grocery vouchers" — with a real progress bar at 116/1,000, plus a "fund the next voucher" button. GoFundMe, Kickstarter and Wikipedia's fundraiser all use this: small absolute numbers become a *motivating* story rather than a weak one, because the frame is distance-to-goal, not size-of-crowd.
Strong conversion pattern; needs a goal number chosen and owned.

### D. Retailer proof rail
Just the retailer logos with a clear label: "Vouchers redeemable at" — the way Klarna and Afterpay run merchant rails. Borrowed credibility from Walmart, Target, Amazon, Starbucks, and factually precise.
Too thin on its own, but excellent as a supporting element.

## Recommended build: A + D in one row, C as the follow-on

One strip, three mechanism beats, retailer logos anchored to the voucher beat, and the "zero cash disbursement" line as the closing note. It answers the visitor's real question, borrows retailer credibility, survives underwriter scrutiny word-for-word, and does not depend on donation volume.

Then the goal bar (C) becomes the closing CTA band further down the page, where distance-to-goal drives action instead of competing with the hero. Verified live metrics (B) move into the existing Impact Dashboard section, where numbers belong and where a small number reads as transparency rather than weakness.

Deleted for good: the donor-name pill and its generator, "Live program", and the hardcoded "24 donations".

## Layout

```text
desktop
  You give $25  ──→   We buy a retail voucher   ──→   A US family redeems it
                     [W] [T] [A] [S] [D] [U]
            Funds convert directly to vouchers · zero cash disbursement · US only

mobile
  three stacked beats, each one line, connector becomes a vertical rule;
  retailer logos keep the existing marquee treatment beneath
```

## Technical notes

- Replace `src/components/landing/LiveActivityBar.tsx` with `src/components/landing/VoucherPipelineStrip.tsx`; delete `generateDonation`, `DonationPill` and the 3.5s interval; update the import in `src/pages/Index.tsx`.
- Fully static and presentational — no data fetching, so it costs nothing on first paint and cannot show a wrong number.
- Retailer logos reuse `popularBrands` from `src/data/brandLogos.ts` and the existing `animate-marquee` + mask treatment on mobile.
- Connector line draws on first view via an IntersectionObserver-gated CSS transition; respects `prefers-reduced-motion`.
- Semantic tokens only (primary / accent / muted / foreground), no hardcoded colors, contrast checked in both themes.
- Goal band (C) and live metrics in the Impact Dashboard (B) are follow-up steps, not part of this change — flag them as pending after approval.

## Open question before build

The goal band needs a target you're willing to publish. Suggested: "Fund 1,000 grocery vouchers" (currently 116). Confirm or replace that number when we get to that step.
