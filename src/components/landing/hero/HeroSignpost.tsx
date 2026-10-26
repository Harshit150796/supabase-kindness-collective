import { horizonPx, trunkBasePx } from '@/lib/heroBackdrop';

/**
 * Phones: a small, still signpost standing at the back of the grass on the right (founder-chosen,
 * Oct 2026), saying "$10 donated" then "1 tree planted", both boards pointing left at the tree.
 * Logo-green painted boards read on both skies. No animation, so Pause animations has nothing to stop.
 */
export function HeroSignpost({ width, height }: { width: number; height: number }) {
  if (!width || !height) return null;
  const postX = width - 22;
  const horizon = horizonPx(postX, width, height, true);
  const base = trunkBasePx(width, height, true);
  // Back of the grass: a little in front of the horizon, well behind the trunk's foot.
  const foot = Math.min(horizon + Math.max(12, (base - horizon) * 0.42), height - 70);
  const postTop = foot - 50;
  const board = (top: number, text: string, w: number, tilt: number) => (
    <div className="absolute" style={{ left: postX + 9 - w, top, width: w, height: 17, transform: `rotate(${tilt}deg)`, transformOrigin: `${w - 9}px 8.5px`, filter: 'drop-shadow(0 1.5px 1.5px rgba(18, 40, 22, 0.35))' }}>
      <div className="absolute inset-0 flex items-center justify-end" style={{ paddingRight: 15, background: '#2e6b34', borderRadius: '0 2px 2px 0', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.12), inset 0 -1.5px 0 rgba(0,0,0,.18)', clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)' }}>
        <span className="font-display whitespace-nowrap" style={{ fontSize: 11, lineHeight: '17px', color: '#f3f8ef' }}>{text}</span>
        <span className="absolute rounded-full" style={{ right: 7, top: 4, width: 2, height: 2, background: '#173a1c' }} />
        <span className="absolute rounded-full" style={{ right: 7, top: 11, width: 2, height: 2, background: '#173a1c' }} />
      </div>
    </div>
  );
  return (
    <div aria-hidden="true">
      <div className="absolute rounded-[50%]" style={{ left: postX - 10, top: foot - 3, width: 26, height: 5, background: 'rgba(38, 60, 28, 0.3)', filter: 'blur(1.5px)' }} />
      <div className="absolute" style={{ left: postX, top: postTop, width: 5, height: foot - postTop, borderRadius: '2px 2px 1px 1px', background: 'linear-gradient(90deg, #26402c, #3a5a40 55%, #233a28)' }} />
      {board(postTop + 6, '$10 donated', 82, 2)}
      {board(postTop + 27, '1 tree planted', 92, -1.5)}
    </div>
  );
}
