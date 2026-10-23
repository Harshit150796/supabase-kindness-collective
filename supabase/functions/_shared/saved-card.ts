// What we keep about a saved card: Square's card id plus display details. Never the card number.
// No imports: Deno tests and edge functions both load it.
export interface SavedCardRow { square_card_id: string; brand: string | null; last4: string | null; exp_month: number | null; exp_year: number | null }

// deno-lint-ignore no-explicit-any
export function cardRow(card: any): SavedCardRow {
  const last4 = String(card?.last_4 ?? '').replace(/\D/g, '').slice(-4);
  return {
    square_card_id: String(card.id),
    brand: card?.card_brand ? String(card.card_brand) : null,
    last4: last4.length === 4 ? last4 : null,
    exp_month: Number.isInteger(card?.exp_month) ? card.exp_month : null,
    exp_year: Number.isInteger(card?.exp_year) ? card.exp_year : null,
  };
}

/** A donor may only act on a card that is saved under their own account. */
export function ownsCard(cards: { square_card_id: string; user_id: string }[], userId: string, cardId: string) {
  return cards.some((c) => c.square_card_id === cardId && c.user_id === userId);
}
