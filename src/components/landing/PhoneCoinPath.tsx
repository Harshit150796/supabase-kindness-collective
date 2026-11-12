import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Phones and tablets (below lg): "One coin's path" (founder's pick, Nov 12, 2026, option 05 of 10).
 * The four steps zigzag down the page, each beside a tile. A blue coin travels a dotted path from tile
 * to tile, the path fills in behind it, and each tile lights up in logo green or logo blue as the coin
 * arrives. The loop runs only while the list is on screen and the tab is visible.
 *
 * Geometry is measured once per layout (ResizeObserver), never during the animation. The coin's route
 * is sampled from the drawn path at that time and played as transform keyframes through
 * element.animate, so the moving parts are transform, opacity and the line's dash offset.
 * Pause animations shows the finished picture: every tile lit, the path drawn, no coin.
 */

type Step = { title: string; body: string };
type Point = { x: number; y: number };
type Geometry = { width: number; height: number; centers: Point[]; tops: number[]; bottoms: number[] };

const CYCLE_MS = 9000;
const COIN = 30;
// When the coin leaves and reaches each tile, as fractions of one loop.
const TRAVEL = [[0.08, 0.25], [0.33, 0.5], [0.58, 0.75]] as const;
const ARRIVE = [0, 0.25, 0.5, 0.75];
const LIT_UNTIL = 0.92;
const RESET_AT = 0.97;
const SAMPLES = 28;
// Logo green for steps 1 and 3, logo blue for 2 and 4.
const TONE = ['primary', 'verify', 'primary', 'verify'] as const;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// From one tile down its own column to below that step's words, across the gap between steps in one
// swoop, then into the next tile from its top edge, so the line never runs through any text.
function segmentPath(geometry: Geometry, index: number) {
  const a = geometry.centers[index];
  const b = geometry.centers[index + 1];
  const leave = geometry.bottoms[index] + 4;
  const enter = geometry.tops[index + 1] - 4;
  const pull = (enter - leave) * 0.75;
  return `M${a.x} ${a.y} L${a.x} ${leave} C ${a.x} ${leave + pull}, ${b.x} ${enter - pull}, ${b.x} ${enter} L${b.x} ${b.y}`;
}

function GiveArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-[73%] w-[73%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="30" y="18" width="52" height="84" rx="11" />
      <path d="M40 32h24" opacity=".7" />
      <path d="M40 42h32" opacity=".5" />
      <rect x="38" y="74" width="36" height="18" rx="9" fill="currentColor" />
      <path d="M92 48c0-4 6-6 8-2 2-4 8-2 8 2 0 5-8 11-8 11s-8-6-8-11z" />
    </svg>
  );
}

function CouponArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-[77%] w-[77%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="12" y="34" width="96" height="52" rx="10" />
      <path d="M80 36v48" strokeDasharray="5 5" opacity=".7" />
      <g fill="currentColor" stroke="none">
        {[[24, 3], [30, 2], [36, 2], [42, 3], [48, 2], [54, 2], [60, 3], [66, 2]].map(([x, w]) => <rect key={x} x={x} y="50" width={w} height="22" rx="1" />)}
        <rect x="87" y="57" width="14" height="13" rx="3" />
      </g>
      <path d="M89.5 57v-4a4.5 4.5 0 0 1 9 0v4" />
    </svg>
  );
}

function BagArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-[77%] w-[77%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M30 50c0-7 5-12 12-12h8c6 0 11 5 11 11v9H30z" />
      <path d="M53 58V39l7-7h10l5 7v19z" />
      <circle cx="84" cy="48" r="10" />
      <path d="M84 38v-5m0 2c4-4 7-2 8 0" />
      <path d="M27 57h66l-6 42a6 6 0 0 1-6 5H43a6 6 0 0 1-6-5z" />
      <path d="M45 57v-8a15 15 0 0 1 30 0v8" />
    </svg>
  );
}

function ReceiptArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-[73%] w-[73%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M32 16h56v86l-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5z" />
      <path d="M48 48l7 7 14-15" strokeWidth="2.8" />
      <path d="M44 72h32" opacity=".7" />
      <path d="M44 82h22" opacity=".5" />
    </svg>
  );
}

const ARTS = [GiveArt, CouponArt, BagArt, ReceiptArt];

export function PhoneCoinPath({ steps, still }: { steps: Step[]; still: boolean }) {
  const listRef = useRef<HTMLOListElement>(null);
  const tileRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);
  const litRefs = useRef<Array<HTMLDivElement | null>>([]);
  const segmentRefs = useRef<Array<SVGPathElement | null>>([]);
  const coinRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  // Measure the tile centres once per layout change (fonts settling, rotation, resizing).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const box = list.getBoundingClientRect();
      const centers = tileRefs.current.map((tile) => {
        if (!tile) return null;
        const rect = tile.getBoundingClientRect();
        return { x: Math.round(rect.left - box.left + rect.width / 2), y: Math.round(rect.top - box.top + rect.height / 2) };
      });
      const rows = rowRefs.current.map((row) => row?.getBoundingClientRect());
      if (centers.some((center) => !center) || rows.some((row) => !row) || box.width === 0) return;
      const next = {
        width: Math.round(box.width),
        height: Math.round(box.height),
        centers: centers as Point[],
        tops: rows.map((row) => Math.round(row!.top - box.top)),
        bottoms: rows.map((row) => Math.round(row!.bottom - box.top)),
      };
      setGeometry((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(list);
    return () => resize.disconnect();
  }, []);

  // Build the loop from the drawn path, and run it only while the list is on screen.
  useEffect(() => {
    const coin = coinRef.current;
    const list = listRef.current;
    const segments = segmentRefs.current;
    const lits = litRefs.current;
    const tiles = tileRefs.current;
    if (!geometry || !coin || !list || segments.some((path) => !path) || lits.some((lit) => !lit) || tiles.some((tile) => !tile)) return;

    const lengths = segments.map((path) => path!.getTotalLength());
    segments.forEach((path, index) => {
      path!.style.strokeDasharray = `${lengths[index]}`;
      path!.style.strokeDashoffset = still ? '0' : `${lengths[index]}`;
    });
    lits.forEach((lit) => { lit!.style.opacity = still ? '1' : '0'; });
    coin.style.opacity = '0';
    if (still) return;

    const at = (point: Point) => `translate3d(${point.x - COIN / 2}px, ${point.y - COIN / 2}px, 0)`;
    const { centers } = geometry;
    const coinFrames: Keyframe[] = [
      { offset: 0, transform: at(centers[0]), opacity: 0 },
      { offset: 0.04, transform: at(centers[0]), opacity: 1 },
      { offset: TRAVEL[0][0], transform: at(centers[0]), opacity: 1 },
    ];
    TRAVEL.forEach(([start, end], index) => {
      const path = segments[index]!;
      for (let i = 1; i <= SAMPLES; i += 1) {
        const t = i / SAMPLES;
        const point = path.getPointAtLength(easeInOut(t) * lengths[index]);
        coinFrames.push({ offset: start + t * (end - start), transform: at(point), opacity: 1 });
      }
      const next = TRAVEL[index + 1];
      if (next) coinFrames.push({ offset: next[0], transform: at(centers[index + 1]), opacity: 1 });
    });
    coinFrames.push({ offset: 0.8, transform: at(centers[3]), opacity: 0 }, { offset: 1, transform: at(centers[3]), opacity: 0 });

    const timing = { duration: CYCLE_MS, iterations: Infinity };
    const running: Animation[] = [coin.animate(coinFrames, timing)];
    TRAVEL.forEach(([start, end], index) => {
      const length = lengths[index];
      running.push(segments[index]!.animate([
        { offset: 0, strokeDashoffset: length },
        { offset: start, strokeDashoffset: length, easing: 'cubic-bezier(.65,0,.35,1)' },
        { offset: end, strokeDashoffset: 0 },
        { offset: LIT_UNTIL, strokeDashoffset: 0 },
        { offset: RESET_AT, strokeDashoffset: length },
        { offset: 1, strokeDashoffset: length },
      ], timing));
    });
    ARRIVE.forEach((arrive, index) => {
      const lit = [{ offset: 0, opacity: 0 }, ...(arrive > 0 ? [{ offset: arrive, opacity: 0 }] : []), { offset: arrive + 0.03, opacity: 1 }, { offset: LIT_UNTIL, opacity: 1 }, { offset: RESET_AT, opacity: 0 }, { offset: 1, opacity: 0 }];
      running.push(lits[index]!.animate(lit, timing));
      const pulse = [{ offset: 0, transform: 'scale(1)' }, ...(arrive > 0 ? [{ offset: arrive, transform: 'scale(1)' }] : []), { offset: arrive + 0.03, transform: 'scale(1.06)' }, { offset: arrive + 0.07, transform: 'scale(1)' }, { offset: 1, transform: 'scale(1)' }];
      running.push(tiles[index]!.animate(pulse, timing));
    });
    running.forEach((animation) => animation.pause());

    let onScreen = false;
    const sync = () => {
      const play = onScreen && !document.hidden;
      running.forEach((animation) => (play ? animation.play() : animation.pause()));
    };
    const watch = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }, { threshold: 0.15 });
    watch.observe(list);
    document.addEventListener('visibilitychange', sync);
    return () => {
      watch.disconnect();
      document.removeEventListener('visibilitychange', sync);
      running.forEach((animation) => animation.cancel());
    };
  }, [geometry, still]);

  const segmentsD = geometry ? [0, 1, 2].map((index) => segmentPath(geometry, index)) : [];

  return (
    <div className="relative mx-auto mt-8 max-w-[520px]">
      {geometry && (
        <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute left-0 top-0" width={geometry.width} height={geometry.height} viewBox={`0 0 ${geometry.width} ${geometry.height}`} fill="none">
          <path d={segmentsD.join(' ')} stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
          {segmentsD.map((d, index) => (
            <path key={index} ref={(node) => { segmentRefs.current[index] = node; }} d={d} stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
          ))}
        </svg>
      )}
      <div ref={coinRef} aria-hidden="true" data-coin className="pointer-events-none absolute left-0 top-0 opacity-0" style={{ width: COIN, height: COIN, willChange: 'transform, opacity' }}>
        <svg viewBox="0 0 30 30" width={COIN} height={COIN} focusable="false">
          <circle cx="15" cy="15" r="13.5" fill="hsl(var(--verify))" />
          <circle cx="15" cy="15" r="10" fill="none" stroke="hsl(var(--verify-foreground) / 0.45)" strokeWidth="1" />
          <text x="15" y="19.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="hsl(var(--verify-foreground))">$</text>
        </svg>
      </div>
      <ol ref={listRef} className="relative flex flex-col gap-12" data-giving-steps="coin-path">
        {steps.map((step, index) => {
          const Art = ARTS[index];
          const tone = TONE[index];
          const right = index % 2 === 1;
          const tile = (
            <div ref={(node) => { tileRefs.current[index] = node; }} aria-hidden="true" className="relative h-28 w-28 shrink-0 rounded-[28px] bg-[hsl(var(--primary-97))] sm:h-[120px] sm:w-[120px]" data-coin-tile>
              <div className={`absolute inset-0 flex items-center justify-center rounded-[28px] ${tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-verify/10 text-verify'}`}><Art /></div>
              <div ref={(node) => { litRefs.current[index] = node; }} className={`absolute inset-0 flex items-center justify-center rounded-[28px] text-white opacity-0 ${tone === 'primary' ? 'bg-primary' : 'bg-verify'}`}><Art /></div>
            </div>
          );
          return (
            <li key={step.title} ref={(node) => { rowRefs.current[index] = node; }} data-coin-step={index + 1} className={`grid items-start gap-4 sm:gap-5 ${right ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[auto_minmax(0,1fr)]'}`}>
              {!right && tile}
              <div className="pt-2">
                <h3 className="font-display text-[1.5rem] font-normal leading-[1.1] text-foreground sm:text-[1.625rem]">
                  <span className={`mr-2 font-sans text-[13px] font-semibold tabular-nums ${tone === 'primary' ? 'text-primary' : 'text-verify'}`}>0{index + 1}</span>
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-[1.5] text-muted-foreground">{step.body}</p>
              </div>
              {right && tile}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
