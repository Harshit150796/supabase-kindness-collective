/** The card row uses actual visibility, independently of early editorial reveals. */
export const CARD_DEAL_TIMING = { hold: 120, duration: 520, stagger: 300 } as const;

export function cardDealThreshold(rowHeight: number, viewportHeight: number): number {
  if (rowHeight <= 0 || viewportHeight <= 0) return 1;
  return Math.min(rowHeight, viewportHeight) * 0.35 / rowHeight;
}

export function cardDealEligible(visibleHeight: number, rowHeight: number, viewportHeight: number): boolean {
  return rowHeight > 0 && visibleHeight >= rowHeight * cardDealThreshold(rowHeight, viewportHeight);
}