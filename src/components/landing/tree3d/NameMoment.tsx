import type { CSSProperties } from 'react';
import { Html } from '@react-three/drei';
import { displayDonor, formatGift, useGardenDistanceFactor, type MomentKind } from './gardenMoments';
import './garden.css';

interface Props {
  kind: MomentKind;
  donorName: string;
  amount: number;
  /** +1 when the plant stands right of the trunk, -1 when left: the tag sits outward, the seeds and the butterfly travel on the tree's side. */
  side: 1 | -1;
  /** Which side of the plant the dandelion's tag sits (inward near the screen's edges). */
  tagSide?: 1 | -1;
  /** Near a screen edge the butterfly's hanging tag opens inward instead of centring. */
  edge?: 'l' | 'r' | null;
  isMobile: boolean;
  /** The site's gentle-motion setting: the tag alone, no flight. */
  still?: boolean;
}

// Seed drift toward the canopy, in the 1440-wide hero's pixels (Html rescales them).
const SEEDS = [
  { x: 6, y: -8, dx: 120, dy: -150, r: -30, d: 0 },
  { x: -10, y: -12, dx: 170, dy: -120, r: -50, d: 0.25 },
  { x: 12, y: 6, dx: 80, dy: -190, r: 20, d: 0.5 },
  { x: -6, y: -18, dx: 210, dy: -160, r: -70, d: 0.7 },
  { x: 2, y: 10, dx: 140, dy: -215, r: 35, d: 0.95 },
  { x: -14, y: 2, dx: 245, dy: -110, r: -20, d: 1.2 },
  { x: 10, y: -16, dx: 60, dy: -235, r: 50, d: 1.4 },
];

function Seed() {
  return (
    <svg viewBox="-8 -11 16 22" aria-hidden="true">
      <path d="M0 -2L-6 -8M0 -2L-3 -9.5M0 -2L0 -10.5M0 -2L3 -9.5M0 -2L6 -8M0 -2L0 7" stroke="#FFFFFF" strokeWidth=".9" strokeLinecap="round" fill="none" />
      <ellipse cx="0" cy="8.5" rx="1" ry="2.2" fill="#B9C2B0" />
    </svg>
  );
}

function Wings({ className }: { className: string }) {
  return (
    <g className={className}>
      <path d="M17 14C13 5 3 1 1.5 6C0 11 7 15 17 14Z" fill="#1566C1" />
      <path d="M17 14C11 16 5.5 23 8.5 26C11.5 28 16 21 17 14Z" fill="#2F7FD6" />
      <path d="M17 14C21 5 31 1 32.5 6C34 11 27 15 17 14Z" fill="#1566C1" />
      <path d="M17 14C23 16 28.5 23 25.5 26C22.5 28 18 21 17 14Z" fill="#2F7FD6" />
      <circle cx="6.5" cy="7" r="1.4" fill="#F7FAF7" />
      <circle cx="27.5" cy="7" r="1.4" fill="#F7FAF7" />
      <circle cx="10.5" cy="22" r="1" fill="#F7FAF7" />
      <circle cx="23.5" cy="22" r="1" fill="#F7FAF7" />
    </g>
  );
}

function Tag({ name, amount }: { name: string; amount: number }) {
  return (
    <span className="gm-tag">
      <span className="gm-name">{name}</span>
      <span className="gm-amt">donated <b>{formatGift(amount)}</b></span>
    </span>
  );
}

/**
 * The donor's name, the moment a coupon lands: carried up by dandelion seeds, or brought down by a
 * butterfly. Drawn in the page (crisp at any size) and anchored to the plant in the scene; it plays
 * once (MOMENT_SECONDS) and the layer unmounts it. Below the hero's headline layer, never clickable.
 */
export function NameMoment({ kind, donorName, amount, side, tagSide = side, edge = null, isMobile, still = false }: Props) {
  const distanceFactor = useGardenDistanceFactor(isMobile);
  const name = displayDonor(donorName);
  const toward = -side; // the tree is on this side of the plant
  const sx = toward * 150;
  const flight = `path('M ${sx} -170 C ${toward * 40} -205, ${toward * 135} -60, 0 -6')`;

  return (
    <Html center distanceFactor={distanceFactor} zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
      <div
        className={`gm gm-${kind} gm-side-${tagSide > 0 ? 'r' : 'l'}${edge ? ` gm-edge-${edge}` : ''}${still ? ' gm-still' : ''}${isMobile ? ' gm-phone' : ''}`}
        style={{ ['--side' as string]: tagSide, ['--toward' as string]: toward } as CSSProperties}
        aria-hidden="true"
      >
        {kind === 'dandelion' ? (
          <>
            <span className="gm-tagwrap">
              <Tag name={name} amount={amount} />
            </span>
            {!still && SEEDS.map((s, i) => (
              <span
                key={i}
                className="gm-seed"
                style={{
                  left: s.x,
                  top: s.y,
                  ['--dx' as string]: `${toward * s.dx}px`,
                  ['--dy' as string]: `${s.dy}px`,
                  ['--r' as string]: `${toward * s.r}deg`,
                  animationDelay: `${s.d}s`,
                } as CSSProperties}
              >
                <Seed />
              </span>
            ))}
          </>
        ) : (
          <span className="gm-exit">
            <span className="gm-flyer" style={{ offsetPath: flight } as CSSProperties}>
              {!still && (
                <svg className="gm-fly" viewBox="0 0 34 28" aria-hidden="true">
                  <Wings className="gm-wings-fast" />
                  <Wings className="gm-wings-slow" />
                  <path d="M17 8V21" stroke="#14213D" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17 8L14 3M17 8L20 3" stroke="#14213D" strokeWidth=".8" strokeLinecap="round" />
                </svg>
              )}
              <span className="gm-hang">
                <i aria-hidden="true" />
                <Tag name={name} amount={amount} />
              </span>
            </span>
          </span>
        )}
      </div>
    </Html>
  );
}
