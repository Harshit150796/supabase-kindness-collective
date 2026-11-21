import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Phones and tablets (below lg): "One coin's path" (founder's pick, Nov 12, 2026, option 05 of 10, built
 * as an exact replica of the design: founder request, Nov 12, 2026). The four steps zigzag down the page,
 * each beside a tile, 170px apart. One dotted S-curve runs from tile centre to tile centre, as drawn in the
 * design; each step shows its one-line phone text (founder's pick, Nov 12, 2026), which keeps the words
 * clear of the curve.
 *
 * It follows the scroll and never plays by itself (founder request, Nov 12, 2026). A blue coin rides a
 * reading line READ_AT of the way down the screen: as the visitor scrolls, it travels the curve at that
 * height, the curve fills in behind it, and each tile lights up in logo green or logo blue (with a small
 * pop) the moment the line reaches its centre. Scrolling back runs it all backwards.
 *
 * Everything that needs layout is measured per layout (ResizeObserver on the list and the page, and once
 * each time the list comes near): the tile centres, the list's place on the page and a table of where the
 * curve sits at each height. A scroll frame only reads scrollY, looks the coin's place up in that table and
 * writes a transform and the line's dash offset; the listener is attached only while the list is near.
 * Pause animations shows the finished picture: every tile lit, the curve drawn, no coin.
 */

type Step = { title: string; phone: string };
type Point = { x: number; y: number };
type Geometry = { width: number; height: number; centers: Point[] };
type Sample = { x: number; y: number; along: number };

const COIN = 30;
// The coin sits this far down the screen while it travels, so it reaches each tile as that tile scrolls past
// the middle of a phone screen.
const READ_AT = 0.58;
// Points per step in the height-to-distance table.
const SAMPLES = 64;
// The design's curve leaves each tile straight down and enters the next straight down: its handles reach
// 100px of the 170px between rows. That also keeps it always heading down, so each height has one point.
const HANDLE = 100 / 170;
// Logo green for steps 1 and 3, logo blue for 2 and 4.
const TONE = ['primary', 'verify', 'primary', 'verify'] as const;

// Where the curve crosses a given height, from the table (sorted by height).
function pointAtHeight(table: Sample[], y: number): Sample {
  if (y <= table[0].y) return table[0];
  const last = table[table.length - 1];
  if (y >= last.y) return last;
  let lo = 0;
  let hi = table.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid].y <= y) lo = mid; else hi = mid;
  }
  const a = table[lo];
  const b = table[hi];
  const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
  return { x: a.x + (b.x - a.x) * t, y, along: a.along + (b.along - a.along) * t };
}

// One piece of the S-curve, from one tile centre to the next.
function segmentCurve(a: Point, b: Point) {
  const pull = (b.y - a.y) * HANDLE;
  return `C ${a.x} ${a.y + pull}, ${b.x} ${b.y - pull}, ${b.x} ${b.y}`;
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
  const litRefs = useRef<Array<HTMLDivElement | null>>([]);
  const segmentRefs = useRef<Array<SVGPathElement | null>>([]);
  const drawRef = useRef<SVGPathElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  // The list's top on the page, and the scroll frame to run when it changes.
  const topRef = useRef(0);
  const redrawRef = useRef<(() => void) | null>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  // Measure once per layout change (fonts settling, rotation, resizing, anything above growing).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const box = list.getBoundingClientRect();
      topRef.current = box.top + window.scrollY;
      const centers = tileRefs.current.map((tile) => {
        if (!tile) return null;
        const rect = tile.getBoundingClientRect();
        return { x: Math.round(rect.left - box.left + rect.width / 2), y: Math.round(rect.top - box.top + rect.height / 2) };
      });
      if (centers.some((center) => !center) || box.width === 0) return;
      const next = { width: Math.round(box.width), height: Math.round(box.height), centers: centers as Point[] };
      setGeometry((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      redrawRef.current?.();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(list);
    resize.observe(document.body);
    return () => resize.disconnect();
  }, []);

  // Tie the coin, the line and the tiles to the scroll.
  useEffect(() => {
    const coin = coinRef.current;
    const list = listRef.current;
    const draw = drawRef.current;
    const segments = segmentRefs.current;
    const lits = litRefs.current;
    const tiles = tileRefs.current;
    if (!geometry || !coin || !list || !draw || segments.some((path) => !path) || lits.some((lit) => !lit) || tiles.some((tile) => !tile)) return;

    const lengths = segments.map((path) => path!.getTotalLength());
    const total = lengths[0] + lengths[1] + lengths[2];
    draw.style.strokeDasharray = `${total}`;
    draw.style.strokeDashoffset = still ? '0' : `${total}`;
    lits.forEach((lit) => { lit!.style.opacity = still ? '1' : '0'; });
    coin.style.opacity = '0';
    if (still) return;

    // Per layout: where the curve is at each height, so a scroll frame only looks numbers up.
    const table: Sample[] = [];
    let before = 0;
    segments.forEach((path, index) => {
      for (let i = index === 0 ? 0 : 1; i <= SAMPLES; i += 1) {
        const along = (i / SAMPLES) * lengths[index];
        const point = path!.getPointAtLength(along);
        table.push({ x: point.x, y: point.y, along: before + along });
      }
      before += lengths[index];
    });
    const { centers } = geometry;
    const lit = centers.map(() => false);
    let viewHeight = window.innerHeight;
    let shown = -1;
    let raf = 0;
    coin.style.transform = `translate3d(${centers[0].x - COIN / 2}px, ${centers[0].y - COIN / 2}px, 0)`;
    coin.style.opacity = '1';

    const frame = () => {
      raf = 0;
      const line = window.scrollY + viewHeight * READ_AT - topRef.current;
      const point = pointAtHeight(table, line);
      if (Math.abs(point.along - shown) > 0.25) {
        shown = point.along;
        coin.style.transform = `translate3d(${point.x - COIN / 2}px, ${point.y - COIN / 2}px, 0)`;
        draw.style.strokeDashoffset = `${total - point.along}`;
      }
      centers.forEach((center, index) => {
        const on = line >= center.y;
        if (on === lit[index]) return;
        lit[index] = on;
        lits[index]!.style.opacity = on ? '1' : '0';
        if (on) tiles[index]!.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
      });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const onResize = () => { viewHeight = window.innerHeight; schedule(); };
    redrawRef.current = schedule;

    // Listen to the scroll only while the list is within half a screen of view; settle once on leaving.
    let listening = false;
    const listen = (near: boolean) => {
      if (near === listening) return;
      listening = near;
      if (near) {
        topRef.current = list.getBoundingClientRect().top + window.scrollY;
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', onResize);
      } else {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', onResize);
      }
      schedule();
    };
    const watch = new IntersectionObserver(([entry]) => listen(entry.isIntersecting), { rootMargin: '50% 0px' });
    watch.observe(list);
    schedule();
    return () => {
      watch.disconnect();
      listen(false);
      if (raf) cancelAnimationFrame(raf);
      redrawRef.current = null;
      coin.style.opacity = '0';
    };
  }, [geometry, still]);

  const curves = geometry ? [0, 1, 2].map((index) => segmentCurve(geometry.centers[index], geometry.centers[index + 1])) : [];
  const whole = geometry ? `M${geometry.centers[0].x} ${geometry.centers[0].y} ${curves.join(' ')}` : '';

  return (
    <div className="relative mx-auto mt-[34px] max-w-[520px]">
      {geometry && (
        <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute left-0 top-0" width={geometry.width} height={geometry.height} viewBox={`0 0 ${geometry.width} ${geometry.height}`} fill="none">
          <path d={whole} stroke="hsl(120 15% 76%)" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
          <path ref={drawRef} d={whole} stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
          {/* Each step's piece, unpainted, to measure the coin's route. */}
          {curves.map((curve, index) => (
            <path key={index} ref={(node) => { segmentRefs.current[index] = node; }} d={`M${geometry.centers[index].x} ${geometry.centers[index].y} ${curve}`} stroke="none" />
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
      <ol ref={listRef} className="relative flex flex-col" data-giving-steps="coin-path">
        {steps.map((step, index) => {
          const Art = ARTS[index];
          const tone = TONE[index];
          const right = index % 2 === 1;
          const last = index === steps.length - 1;
          const tile = (
            <div ref={(node) => { tileRefs.current[index] = node; }} aria-hidden="true" className="relative h-[104px] w-[104px] shrink-0 rounded-[30px] bg-card min-[360px]:h-[120px] min-[360px]:w-[120px]" data-coin-tile>
              <div className={`absolute inset-0 flex items-center justify-center rounded-[30px] ${tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-verify/10 text-verify'}`}><Art /></div>
              <div ref={(node) => { litRefs.current[index] = node; }} className={`absolute inset-0 flex items-center justify-center rounded-[30px] text-white opacity-0 transition-opacity duration-300 ${tone === 'primary' ? 'bg-primary' : 'bg-verify'}`}><Art /></div>
            </div>
          );
          return (
            // Rows sit 170px apart as in the design; a row whose words run longer grows instead of overlapping the next.
            <li key={step.title} data-coin-step={index + 1} className={`grid items-start gap-[18px] ${last ? '' : 'min-h-[170px] pb-2'} ${right ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[auto_minmax(0,1fr)]'}`}>
              {!right && tile}
              <div className="pt-2">
                <div className="flex items-baseline gap-2">
                  <span aria-hidden="true" className={`text-[13px] font-semibold tabular-nums ${tone === 'primary' ? 'text-primary' : 'text-verify'}`}>0{index + 1}</span>
                  <h3 className="font-display text-[25px] font-normal leading-[1.1] text-foreground">{step.title}</h3>
                </div>
                <p className="mt-1.5 text-[15px] leading-[1.5] text-muted-foreground">{step.phone}</p>
              </div>
              {right && tile}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
