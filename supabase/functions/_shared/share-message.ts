// The organizer's ready-made message, shared by the emails (account-emails.ts, organizer-emails.ts) and the
// "Text it to 5 people now" screen after someone submits a fundraiser (src/components/apply/ShareScreen.tsx),
// so the screen and the emails always say the same thing. No imports: the site's bundle uses it too.

/** Who a fundraiser is for (apply flow): it decides how the organizer's ready-made message reads. */
export type Beneficiary = 'yourself' | 'family' | 'organization' | string | null | undefined;

/**
 * The message an organizer sends friends, family and their church: what the fundraiser is, what a gift becomes
 * and the share link (which shows the fundraiser's photo and title in chats). Every line is true of every
 * fundraiser: gifts become gift cards for the stores asked for, and the smallest gift is $10.
 */
export function liveShareMessage(o: { title: string; stores?: string[]; beneficiary?: Beneficiary }, shareUrl: string) {
  const shops = (o.stores ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 2).join(' or ');
  const becomes = o.beneficiary === 'organization'
    ? `Every gift becomes a store gift card${shops ? ` (like ${shops})` : ''} for the people our group helps`
    : `Every gift becomes a gift card for ${o.beneficiary === 'family' ? 'a store my family needs' : 'a store I need'}${shops ? `, like ${shops}` : ''}`;
  return {
    becomes,
    chat: `Hi! I started a fundraiser on CouponDonation: “${o.title}”. ${becomes}, so you can see where it goes. Gifts start at $10. Would you take a look, and pass it on?\n${shareUrl}`,
  };
}
