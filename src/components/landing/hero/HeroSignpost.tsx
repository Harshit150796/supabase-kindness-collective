import { signpostLayout, SIGN_BOARD_H, SIGN_FONT_PX, SIGN_PAD } from '@/lib/heroSignpost';

/**
 * Phones: a small, still signpost standing at the back of the grass on the right (founder-chosen,
 * Oct 2026), saying "$10 donated" then "1 tree planted", both boards pointing left at the tree.
 * Each board is as wide as its words, so the sign stays narrow; src/lib/heroSignpost.ts places it
 * below the canopy's lowest leaves, and the garden keeps its plants and name tags off it.
 * Logo-green painted boards read on both skies. No animation, so Pause animations has nothing to stop.
 */
export function HeroSignpost({ width, height }: { width: number; height: number }) {
  if (!width || !height) return null;
  const { postX, postTop, foot, boardRight, boardTops } = signpostLayout(width, height);
  const board = (top: number, text: string, tilt: number) => (
    <div
      className="absolute flex items-center"
      style={{
        right: width - boardRight,
        top,
        height: SIGN_BOARD_H,
        padding: `0 ${SIGN_PAD[1]}px 0 ${SIGN_PAD[0]}px`,
        transform: `rotate(${tilt}deg)`,
        transformOrigin: `calc(100% - 5px) 50%`,
        filter: 'drop-shadow(0 1.5px 1.5px rgba(18, 40, 22, 0.35))',
      }}
    >
      <span className="absolute inset-0" style={{ background: '#2e6b34', borderRadius: '0 2px 2px 0', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.12), inset 0 -1.5px 0 rgba(0,0,0,.18)', clipPath: 'polygon(7px 0, 100% 0, 100% 100%, 7px 100%, 0 50%)' }} />
      <span className="relative font-display whitespace-nowrap" style={{ fontSize: SIGN_FONT_PX, lineHeight: `${SIGN_BOARD_H}px`, color: '#f3f8ef' }}>{text}</span>
      <span className="absolute rounded-full" style={{ right: 4, top: 4, width: 2, height: 2, background: '#173a1c' }} />
      <span className="absolute rounded-full" style={{ right: 4, top: 11, width: 2, height: 2, background: '#173a1c' }} />
    </div>
  );
  return (
    <div aria-hidden="true">
      <div className="absolute rounded-[50%]" style={{ left: postX - 10, top: foot - 3, width: 26, height: 5, background: 'rgba(38, 60, 28, 0.3)', filter: 'blur(1.5px)' }} />
      <div className="absolute" style={{ left: postX, top: postTop, width: 5, height: foot - postTop, borderRadius: '2px 2px 1px 1px', background: 'linear-gradient(90deg, #26402c, #3a5a40 55%, #233a28)' }} />
      {board(boardTops[0], '$10 donated', 2)}
      {board(boardTops[1], '1 tree planted', -1.5)}
    </div>
  );
}
