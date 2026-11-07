/**
 * Donated cards: unused digital gift cards, store coupons and promo codes people give to a family or the
 * shared pool. Signed-in donors submit through submit_card_donation and guests (no account, optionally
 * anonymous) through public-submit; both sit in card_donations until the team checks the balance, and
 * codes live in card_donation_secrets, which no browser can read.
 */
export type CardType = 'gift_card' | 'store_coupon' | 'promo_code';
export type CardStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface CardDonation {
  id: string;
  store_name: string;
  card_type: CardType;
  value: number | null;
  discount_text: string | null;
  expires_on: string | null;
  terms: string | null;
  note: string | null;
  photo_path: string | null;
  code_hint: string | null;
  status: CardStatus;
  decline_reason: string | null;
  accepted_value: number | null;
  fundraiser_id: string | null;
  is_anonymous: boolean;
  donor_name: string | null;
  donor_email: string | null;
  /** Null for guests, who can donate without an account (founder request, Nov 2026). */
  donor_user_id?: string | null;
  terms_version?: string | null;
  created_at: string;
  reviewed_at: string | null;
  fundraisers?: { title: string; unique_slug: string | null } | null;
}

export const CARD_TYPES: { id: CardType; label: string; hint: string }[] = [
  { id: 'gift_card', label: 'Gift card', hint: 'A digital gift card or e-gift card with a balance' },
  { id: 'store_coupon', label: 'Store coupon', hint: 'A digital coupon or voucher for a store, such as $10 off $50' },
  { id: 'promo_code', label: 'Promo code', hint: 'A code for credit or a discount at a store or app' },
];

export const cardTypeLabel = (type: string) => CARD_TYPES.find((t) => t.id === type)?.label ?? type;

/** Most cards one person can submit in a day (also enforced by the database). */
export const CARD_DAILY_LIMIT = 5;
export const CARD_PHOTO_BUCKET = 'card-donations';
export const CARD_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Who gave the card, for the team: guests may leave no name at all. */
export function donorLabel(card: Pick<CardDonation, 'donor_name' | 'donor_user_id' | 'is_anonymous'>) {
  if (card.donor_name) return card.donor_name;
  if (card.donor_user_id) return '—';
  return card.is_anonymous ? 'Anonymous guest (no account)' : 'Guest (no account)';
}

export function cardStatusText(card: Pick<CardDonation, 'status' | 'fundraiser_id' | 'decline_reason' | 'fundraisers'>) {
  if (card.status === 'pending') return 'We’re checking it';
  if (card.status === 'withdrawn') return 'Withdrawn';
  if (card.status === 'declined') return card.decline_reason ? `Declined: ${card.decline_reason}` : 'Declined';
  return card.fundraiser_id ? `Accepted and given to ${card.fundraisers?.title ?? 'a family'}` : 'Accepted into the shared pool';
}
