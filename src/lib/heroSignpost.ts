/**
 * Where the phone hero's signpost stands (HeroSignpost), shared with the garden so plants, falling
 * coupons and name tags keep clear of it (gardenSpots). Pure geometry, in px from the hero's top-left.
 *
 * Founder-chosen (Oct 2026): a small sign at the back of the grass on the right, boards pointing
 * left at the tree. It sits as far back as it can while its boards stay below the canopy's lowest
 * leaves on that side.
 */
import { canopyTopPx, horizonPx, trunkBasePx } from '@/lib/heroBackdrop';

export const SIGN_POST_H = 50;
export const SIGN_BOARD_H = 17;
export const SIGN_FONT_PX = 10.5;
/** Arrow side (left) and post side (right) padding of a board. */
export const SIGN_PAD: [number, number] = [13, 9];
/** Instrument Serif advances (em) of the two boards' text, measured from the site's font file. */
const TEXT_EM = { donated: 4.101, planted: 4.48 };
/** Widest board: "1 tree planted" plus its padding. */
export const SIGN_BOARD_MAX_W = Math.ceil(TEXT_EM.planted * SIGN_FONT_PX + SIGN_PAD[0] + SIGN_PAD[1]);

export interface Box { x1: number; y1: number; x2: number; y2: number }
export interface SignpostLayout {
  /** The post's left edge and its top/foot. */
  postX: number;
  postTop: number;
  foot: number;
  /** Where every board's right edge sits (over the post). */
  boardRight: number;
  boardTops: [number, number];
  /** The whole sign (boards, post, shadow). */
  rect: Box;
}

export function signpostLayout(width: number, height: number): SignpostLayout {
  const postX = width - 20;
  const horizon = horizonPx(postX, width, height, true);
  const base = trunkBasePx(width, height, true);
  const canopyTop = canopyTopPx(width, height, true);
  // The canopy's lowest leaves on the sign's side, measured on rendered phone frames.
  const canopyLow = canopyTop + 0.75 * (base - canopyTop);
  const back = horizon + Math.max(12, (base - horizon) * 0.42);
  const foot = Math.min(Math.max(back, canopyLow + SIGN_POST_H - 4), height - 66);
  const postTop = foot - SIGN_POST_H;
  const boardRight = postX + 8;
  return {
    postX,
    postTop,
    foot,
    boardRight,
    boardTops: [postTop + 6, postTop + 27],
    rect: { x1: boardRight - SIGN_BOARD_MAX_W, y1: postTop, x2: boardRight + 4, y2: foot + 3 },
  };
}
