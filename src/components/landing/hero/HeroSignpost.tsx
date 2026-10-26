import { trunkBasePx } from '@/lib/heroBackdrop';

/**
 * Phones: a still signpost in the grass, left of the trunk (founder-chosen, Oct 2026), saying
 * "$10 donated" then "1 tree planted", both boards pointing at the tree. Logo-green painted boards
 * read on both skies. No animation, so Pause animations has nothing to stop here.
 */
export function HeroSignpost({ width, height }: { width: number; height: number }) {
  if (!width || !height) return null;
  const base = trunkBasePx(width, height, true);
  // Post foot in the grass in front of the trunk's foot, right of the Pause button, boards clear of the canopy.
  const foot = Math.min(base + 40, height - 14);
  const postX = Math.min(90, Math.max(64, width / 2 - 128));
  const postTop = foot - 74;
  const board = (top: number, text: string, w: number, tilt: number) => (
    <div className="absolute" style={{ left: postX - 12, top, width: w, height: 24, transform: `rotate(${tilt}deg)`, transformOrigin: '12px 12px', filter: 'drop-shadow(0 2px 2px rgba(18, 40, 22, 0.35))' }}>
      <div className="absolute inset-0 flex items-center" style={{ paddingLeft: 21, background: '#2e6b34', borderRadius: '3px 0 0 3px', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.12), inset 0 -2px 0 rgba(0,0,0,.18)', clipPath: 'polygon(0 0, calc(100% - 11px) 0, 100% 50%, calc(100% - 11px) 100%, 0 100%)' }}>
        <span className="font-display whitespace-nowrap" style={{ fontSize: 14.5, lineHeight: '24px', color: '#f3f8ef' }}>{text}</span>
        <span className="absolute rounded-full" style={{ left: 10, top: 5, width: 3, height: 3, background: '#173a1c' }} />
        <span className="absolute rounded-full" style={{ left: 10, top: 16, width: 3, height: 3, background: '#173a1c' }} />
      </div>
    </div>
  );
  return (
    <div aria-hidden="true">
      <div className="absolute rounded-[50%]" style={{ left: postX - 16, top: foot - 5, width: 40, height: 8, background: 'rgba(38, 60, 28, 0.35)', filter: 'blur(2px)' }} />
      <div className="absolute" style={{ left: postX, top: postTop, width: 8, height: foot - postTop, borderRadius: '3px 3px 1px 1px', background: 'linear-gradient(90deg, #26402c, #3a5a40 55%, #233a28)' }} />
      {board(postTop + 8, '$10 donated', 110, -2.5)}
      {board(postTop + 38, '1 tree planted', 124, 1.8)}
    </div>
  );
}
