import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
} from 'motion/react';
import { ArrowUpRight, Check, ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Palette — exactly three hues: green-black canvas, amber (money in motion), */
/*  emerald (verified / locked / proven). Everything neutral is green-tinted.  */
/* -------------------------------------------------------------------------- */

const HUE = {
  canvas: '160 30% 5%',
  canvas2: '158 25% 8%',
  surface: '158 24% 9%',
  surface2: '158 22% 12%',
  line: '158 28% 16%',
  line2: '158 26% 22%',
  text: '150 22% 95%',
  dim: '155 12% 60%',
  faint: '156 10% 38%',
  amber: '38 92% 58%',
  amberSoft: '40 95% 72%',
  emerald: '160 70% 45%',
  emeraldBright: '158 68% 60%',
} as const;

const hsl = (v: string, a?: number) => (a === undefined ? `hsl(${v})` : `hsl(${v} / ${a})`);

const AMBER = hsl(HUE.amber);
const AMBER_SOFT = hsl(HUE.amberSoft);
const EMERALD = hsl(HUE.emerald);
const EMERALD_BRIGHT = hsl(HUE.emeraldBright);
const TEXT = hsl(HUE.text);
const DIM = hsl(HUE.dim);
const FAINT = hsl(HUE.faint);
const LINE = hsl(HUE.line);
const LINE2 = hsl(HUE.line2);
const SURFACE = hsl(HUE.surface);
const SURFACE2 = hsl(HUE.surface2);

const PANEL_VARS = Object.fromEntries(
  Object.entries(HUE).map(([k, v]) => [`--wd-${k}`, v]),
) as CSSProperties;

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/* -------------------------------------------------------------------------- */
/*  Route geometry — one continuous loop, sampled once for arc-length lookup.  */
/* -------------------------------------------------------------------------- */

type Pt = { x: number; y: number };
type MarkKey = 'n1' | 'n2' | 'n3' | 'n4' | 'r' | 'home';
type SegSpec = { c1?: Pt; c2?: Pt; to: Pt; mark?: MarkKey };

type Route = {
  d: string;
  start: Pt;
  width: number;
  height: number;
  marks: Record<MarkKey, number>;
  pointAt: (f: number) => Pt;
};

function buildRoute(width: number, height: number, start: Pt, segs: SegSpec[]): Route {
  const pts: Pt[] = [start];
  const cum: number[] = [0];
  const rawMarks: Partial<Record<MarkKey, number>> = {};
  let d = `M ${start.x} ${start.y}`;
  let prev = start;
  let total = 0;

  for (const s of segs) {
    const curved = Boolean(s.c1 && s.c2);
    const steps = curved ? 64 : 8;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      let p: Pt;
      if (curved) {
        const { c1, c2, to } = s as Required<SegSpec>;
        const mt = 1 - t;
        p = {
          x: mt * mt * mt * prev.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * to.x,
          y: mt * mt * mt * prev.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * to.y,
        };
      } else {
        p = { x: prev.x + (s.to.x - prev.x) * t, y: prev.y + (s.to.y - prev.y) * t };
      }
      const last = pts[pts.length - 1];
      total += Math.hypot(p.x - last.x, p.y - last.y);
      pts.push(p);
      cum.push(total);
    }
    d += curved
      ? ` C ${s.c1!.x} ${s.c1!.y} ${s.c2!.x} ${s.c2!.y} ${s.to.x} ${s.to.y}`
      : ` L ${s.to.x} ${s.to.y}`;
    if (s.mark) rawMarks[s.mark] = total;
    prev = s.to;
  }

  const marks = Object.fromEntries(
    Object.entries(rawMarks).map(([k, v]) => [k, (v as number) / total]),
  ) as Record<MarkKey, number>;

  const pointAt = (f: number): Pt => {
    const target = Math.min(1, Math.max(0, f)) * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo === 0) return pts[0];
    const a = pts[lo - 1];
    const b = pts[lo];
    const span = cum[lo] - cum[lo - 1];
    const u = span > 0 ? (target - cum[lo - 1]) / span : 0;
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  };

  return { d, start, width, height, marks, pointAt };
}

/** Wide loop: out along the top, down the right side, home along the bottom. */
const DESKTOP_ROUTE = buildRoute(1100, 450, { x: 70, y: 214 }, [
  { c1: { x: 70, y: 140 }, c2: { x: 170, y: 96 }, to: { x: 262, y: 96 }, mark: 'n1' },
  { c1: { x: 348, y: 96 }, c2: { x: 415, y: 68 }, to: { x: 505, y: 68 }, mark: 'n2' },
  { c1: { x: 595, y: 68 }, c2: { x: 662, y: 96 }, to: { x: 748, y: 96 }, mark: 'n3' },
  { c1: { x: 860, y: 96 }, c2: { x: 1030, y: 120 }, to: { x: 1030, y: 214 }, mark: 'n4' },
  { c1: { x: 1030, y: 305 }, c2: { x: 820, y: 356 }, to: { x: 550, y: 356 }, mark: 'r' },
  { c1: { x: 280, y: 356 }, c2: { x: 70, y: 305 }, to: { x: 70, y: 214 }, mark: 'home' },
]);

/** Tall loop: down the left spine, across the bottom, up the right, home over the top. */
const MOBILE_ROUTE = buildRoute(360, 860, { x: 40, y: 104 }, [
  { to: { x: 40, y: 240 }, mark: 'n1' },
  { to: { x: 40, y: 376 }, mark: 'n2' },
  { to: { x: 40, y: 512 }, mark: 'n3' },
  { to: { x: 40, y: 648 }, mark: 'n4' },
  { c1: { x: 40, y: 720 }, c2: { x: 104, y: 770 }, to: { x: 182, y: 770 }, mark: 'r' },
  { c1: { x: 260, y: 770 }, c2: { x: 324, y: 720 }, to: { x: 324, y: 648 } },
  { to: { x: 324, y: 176 } },
  { c1: { x: 324, y: 104 }, c2: { x: 268, y: 40 }, to: { x: 182, y: 40 } },
  { c1: { x: 104, y: 40 }, c2: { x: 40, y: 56 }, to: { x: 40, y: 104 }, mark: 'home' },
]);

/* -------------------------------------------------------------------------- */
/*  Copy                                                                       */
/* -------------------------------------------------------------------------- */

type NodeKey = 'n1' | 'n2' | 'n3' | 'n4' | 'r';

type NodeCopy = {
  key: NodeKey;
  label: string;
  lines: string[];
  time: string;
  leg: 'out' | 'back';
  emphasized?: boolean;
};

const NODES: NodeCopy[] = [
  { key: 'n1', label: 'Request verified', lines: ['Someone asks for one real thing.'], time: '09:41:02', leg: 'out' },
  { key: 'n2', label: 'Funded', lines: ['You cover it.'], time: '09:41:15', leg: 'out' },
  { key: 'n3', label: 'Locked', lines: ['Becomes a card.', 'It can’t become cash.'], time: '09:41:16', leg: 'back', emphasized: true },
  { key: 'n4', label: 'Redeemed', lines: ['Spent at the store. Nowhere else.'], time: '16:08:44', leg: 'back' },
  { key: 'r', label: 'Receipt', lines: ['Proof lands back with you.'], time: '16:08:47', leg: 'back' },
];

const TRACE_ID = 'CD-8842';
const ARRIVE_AT = 0.985;

type ChipPlacement = { x: number; y: number; w: number; anchor: 'top' | 'middle' };
type Layout = {
  route: Route;
  chips: Record<NodeKey, ChipPlacement>;
  panel: { x: number; y: number; w: number };
  originLabel: { x: number; y: number; align: 'center' | 'right' };
};

const DESKTOP_LAYOUT: Layout = {
  route: DESKTOP_ROUTE,
  chips: {
    n1: { x: 164, y: 118, w: 196, anchor: 'top' },
    n2: { x: 407, y: 90, w: 196, anchor: 'top' },
    n3: { x: 630, y: 120, w: 236, anchor: 'top' },
    n4: { x: 772, y: 224, w: 190, anchor: 'top' },
    r: { x: 445, y: 372, w: 210, anchor: 'top' },
  },
  panel: { x: 140, y: 196, w: 220 },
  originLabel: { x: 70, y: 236, align: 'center' },
};

const MOBILE_LAYOUT: Layout = {
  route: MOBILE_ROUTE,
  chips: {
    n1: { x: 64, y: 240, w: 244, anchor: 'middle' },
    n2: { x: 64, y: 376, w: 244, anchor: 'middle' },
    n3: { x: 64, y: 512, w: 244, anchor: 'middle' },
    n4: { x: 64, y: 648, w: 244, anchor: 'middle' },
    r: { x: 62, y: 792, w: 240, anchor: 'top' },
  },
  panel: { x: 64, y: 118, w: 244 },
  originLabel: { x: 26, y: 104, align: 'right' },
};

/* -------------------------------------------------------------------------- */
/*  Small hooks                                                                */
/* -------------------------------------------------------------------------- */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

type Phase = {
  reached: number; // how many of n1..n4, r have been passed
  locked: boolean;
  returned: boolean;
  arrived: boolean;
  moving: boolean;
};

const INITIAL_PHASE: Phase = { reached: 0, locked: false, returned: false, arrived: false, moving: false };

function phaseFor(p: number, route: Route): Phase {
  const eps = 0.0015;
  const order: MarkKey[] = ['n1', 'n2', 'n3', 'n4', 'r'];
  let reached = 0;
  for (const k of order) if (p >= route.marks[k] - eps) reached += 1;
  return {
    reached,
    locked: p >= route.marks.n3 - eps,
    returned: p >= route.marks.n4 - eps,
    arrived: p >= ARRIVE_AT,
    moving: p > 0.003,
  };
}

function samePhase(a: Phase, b: Phase) {
  return (
    a.reached === b.reached &&
    a.locked === b.locked &&
    a.returned === b.returned &&
    a.arrived === b.arrived &&
    a.moving === b.moving
  );
}

function usePhase(progress: MotionValue<number>, route: Route) {
  const [phase, setPhase] = useState<Phase>(() => phaseFor(progress.get(), route));
  useMotionValueEvent(progress, 'change', (p) => {
    const next = phaseFor(p, route);
    setPhase((prev) => (samePhase(prev, next) ? prev : next));
  });
  useEffect(() => {
    const next = phaseFor(progress.get(), route);
    setPhase((prev) => (samePhase(prev, next) ? prev : next));
  }, [progress, route]);
  return phase;
}

/* -------------------------------------------------------------------------- */
/*  Section                                                                    */
/* -------------------------------------------------------------------------- */

export function WhatWeDo() {
  const reduced = useReducedMotion() ?? false;
  const vertical = useMediaQuery('(max-width: 1023px)');
  const coarse = useMediaQuery('(pointer: coarse)');
  const autoplay = vertical || coarse;
  const scrub = !autoplay && !reduced;

  const revealTransition: Transition = reduced
    ? { duration: 0 }
    : { type: 'spring', stiffness: 110, damping: 22, mass: 0.9 };

  const reveal = (delay = 0) => ({
    initial: reduced ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.35 },
    transition: { ...revealTransition, delay },
  });

  return (
    <section
      aria-labelledby="what-we-do-title"
      className="relative bg-background py-14 md:py-20 lg:py-24"
    >
      <div className="container mx-auto px-4">
        <div
          className="relative overflow-clip rounded-[1.75rem] md:rounded-[2.5rem] border"
          style={{
            ...PANEL_VARS,
            borderColor: hsl(HUE.line, 0.7),
            background: `linear-gradient(180deg, ${hsl(HUE.canvas2)} 0%, ${hsl(HUE.canvas)} 32%, ${hsl(HUE.canvas)} 70%, ${hsl(HUE.canvas2)} 100%)`,
            boxShadow: `0 60px 140px -60px ${hsl('160 40% 3%', 0.9)}, inset 0 1px 0 ${hsl(HUE.line2, 0.35)}`,
            color: TEXT,
          }}
        >
          {/* Grain */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
            style={{ backgroundImage: NOISE, backgroundSize: '180px 180px' }}
          />
          {/* Ambient glows: amber on the outbound side, emerald on the return side */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-[10%] top-[6%] h-[60vw] max-h-[720px] w-[60vw] max-w-[720px] opacity-70"
            style={{ background: `radial-gradient(closest-side, ${hsl(HUE.amber, 0.13)}, transparent 70%)` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[12%] top-[34%] h-[64vw] max-h-[780px] w-[64vw] max-w-[780px] opacity-80"
            style={{ background: `radial-gradient(closest-side, ${hsl(HUE.emerald, 0.14)}, transparent 70%)` }}
          />

          {/* ---- Header ---- */}
          <div className="relative px-5 pt-14 sm:px-8 md:px-14 md:pt-20 lg:px-16 lg:pt-24">
            <motion.p
              {...reveal(0)}
              className="font-mono text-[10px] uppercase tracking-[0.32em] md:text-[11px]"
              style={{ color: hsl(HUE.dim, 0.9) }}
            >
              How it actually works
            </motion.p>
            <motion.h2
              {...reveal(0.05)}
              id="what-we-do-title"
              className="mt-6 font-bold"
              style={{
                fontSize: 'clamp(2.75rem, 7.6vw, 7.75rem)',
                lineHeight: 0.93,
                letterSpacing: '-0.042em',
                color: TEXT,
              }}
            >
              You don’t send money.
              <br />
              You send groceries.
            </motion.h2>
            <motion.p
              {...reveal(0.1)}
              className="mt-7 max-w-[58ch] text-base leading-relaxed md:mt-9 md:text-lg"
              style={{ color: DIM }}
            >
              Someone tells you exactly what they need. Your money arrives as that exact thing — and the receipt comes
              back to you.
            </motion.p>
          </div>

          {/* ---- Centerpiece ---- */}
          <Tracker layout={vertical ? MOBILE_LAYOUT : DESKTOP_LAYOUT} scrub={scrub} autoplay={autoplay} reduced={reduced} />

          {/* ---- Contrast strip ---- */}
          <div className="relative px-5 sm:px-8 md:px-14 lg:px-16">
            <motion.div {...reveal(0)}>
              <ContrastStrip />
              <p className="mt-7 text-center text-sm md:text-[15px]" style={{ color: DIM }}>
                It’s a stricter way to give. That’s deliberate.
              </p>
            </motion.div>

            {/* ---- Two doors ---- */}
            <motion.div {...reveal(0.05)} className="mt-16 grid gap-4 md:mt-20 md:grid-cols-2 md:gap-5">
              <Door to="/donate" title="I want to help someone" subtitle="Pick a real need and cover it." />
              <Door to="/apply" title="I need help" subtitle="Tell us what you need. U.S. residents, free to apply." />
            </motion.div>

            {/* ---- Open loop ---- */}
            <motion.div {...reveal(0.1)} className="pb-14 pt-16 text-center md:pb-20 md:pt-20">
              <p className="text-lg font-medium md:text-xl" style={{ color: hsl(HUE.text, 0.92) }}>
                Real people are asking right now. Here’s who.
              </p>
              <motion.div
                aria-hidden="true"
                className="mx-auto mt-4 w-fit"
                animate={reduced ? undefined : { y: [0, 7, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown className="h-5 w-5" style={{ color: EMERALD_BRIGHT }} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tracker: owns the progress value (scroll-scrubbed, auto-played, or fixed)  */
/* -------------------------------------------------------------------------- */

function Tracker({
  layout,
  scrub,
  autoplay,
  reduced,
}: {
  layout: Layout;
  scrub: boolean;
  autoplay: boolean;
  reduced: boolean;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const { route } = layout;

  // Desktop: the user drives the trace with scroll, smoothed through a spring.
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.7, restDelta: 0.0005 });

  useEffect(() => {
    if (!scrub) return;
    progress.set(Math.min(1, Math.max(0, smooth.get())));
    return smooth.on('change', (v) => progress.set(Math.min(1, Math.max(0, v))));
  }, [scrub, smooth, progress]);

  // Reduced motion: resolved state, immediately.
  useEffect(() => {
    if (reduced) progress.set(1);
  }, [reduced, progress]);

  // Touch / small screens: play once when the tracker enters view.
  useEffect(() => {
    if (!autoplay || reduced) return;
    const el = canvasRef.current;
    if (!el) return;
    let controls: ReturnType<typeof animate> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const m = route.marks;
        const stops = [
          { v: m.n1, travel: 1.15, hold: 0.55 },
          { v: m.n2, travel: 1.05, hold: 0.55 },
          { v: m.n3, travel: 1.05, hold: 1.2 },
          { v: m.n4, travel: 1.25, hold: 0.6 },
          { v: m.r, travel: 1.3, hold: 0.45 },
          { v: 1, travel: 1.5, hold: 0 },
        ];
        const keyframes: number[] = [0];
        const durations: number[] = [];
        const eases: (string | number[])[] = [];
        for (const s of stops) {
          keyframes.push(s.v);
          durations.push(s.travel);
          eases.push([0.62, 0, 0.3, 1]);
          if (s.hold > 0) {
            keyframes.push(s.v);
            durations.push(s.hold);
            eases.push('linear');
          }
        }
        const total = durations.reduce((a, b) => a + b, 0);
        const times = [0];
        let acc = 0;
        for (const d of durations) {
          acc += d;
          times.push(acc / total);
        }
        controls = animate(progress, keyframes, {
          duration: total,
          times,
          ease: eases as never,
          delay: 0.35,
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      controls?.stop();
    };
  }, [autoplay, reduced, progress, route]);

  const phase = usePhase(progress, route);

  return (
    <div
      ref={sceneRef}
      className="relative mt-14 md:mt-20"
      style={scrub ? { height: '250vh' } : undefined}
    >
      <div
        className={cn(
          'px-4 sm:px-8 md:px-14 lg:px-16',
          scrub && 'sticky top-0 flex h-[100svh] flex-col justify-center',
        )}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <TraceHeader phase={phase} reduced={reduced} />
          <div ref={canvasRef} className="mt-4 md:mt-6">
            <TrackerCanvas layout={layout} progress={progress} phase={phase} reduced={reduced} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Trace header — telemetry chrome                                            */
/* -------------------------------------------------------------------------- */

function TraceHeader({ phase, reduced }: { phase: Phase; reduced: boolean }) {
  const status = phase.arrived ? 'COMPLETE' : 'IN TRANSIT';
  const leg = phase.returned ? 'RETURN' : 'OUTBOUND';
  const swap: Transition = reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 30 };

  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-3 font-mono text-[10px] uppercase tracking-[0.2em] md:gap-x-8 md:text-[11px]"
      style={{ borderColor: hsl(HUE.line, 0.9), color: FAINT }}
    >
      <span className="sr-only">Illustrative sample trace, not live platform data.</span>
      <span>
        Trace id <span style={{ color: hsl(HUE.text, 0.85) }}>· {TRACE_ID}</span>
      </span>
      <span className="hidden sm:inline">
        Leg{' '}
        <span className="relative inline-grid overflow-hidden align-bottom">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={leg}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={swap}
              style={{ color: hsl(HUE.text, 0.85) }}
            >
              · {leg}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
      <span className="ml-auto flex items-center gap-2">
        Status
        <span className="relative inline-grid overflow-hidden align-bottom">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={status}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={swap}
              style={{ color: phase.arrived ? EMERALD_BRIGHT : AMBER_SOFT }}
            >
              · {status}
            </motion.span>
          </AnimatePresence>
        </span>
        <motion.span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          animate={
            phase.arrived
              ? { opacity: 1, scale: 1, backgroundColor: EMERALD_BRIGHT, boxShadow: `0 0 10px ${hsl(HUE.emerald, 0.8)}` }
              : reduced
                ? { opacity: 1, backgroundColor: AMBER, boxShadow: `0 0 8px ${hsl(HUE.amber, 0.6)}` }
                : { opacity: [1, 0.25, 1], backgroundColor: AMBER, boxShadow: `0 0 8px ${hsl(HUE.amber, 0.6)}` }
          }
          transition={phase.arrived ? { type: 'spring', stiffness: 300, damping: 18 } : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
      <span
        className="rounded-sm border px-1.5 py-0.5 text-[9px] tracking-[0.18em]"
        style={{ borderColor: LINE2, color: DIM }}
        title="Illustrative sample, not live platform data"
      >
        Sample
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Canvas — SVG path, marker, origin, plus HTML chips scaled to the viewBox   */
/* -------------------------------------------------------------------------- */

function TrackerCanvas({
  layout,
  progress,
  phase,
  reduced,
}: {
  layout: Layout;
  progress: MotionValue<number>;
  phase: Phase;
  reduced: boolean;
}) {
  const { route } = layout;
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `wd-${name}-${rawId}`;
  const lockT = route.marks.n3;

  // Path layers. Note: SVG path props (pathLength/pathOffset) must be MotionValues —
  // motion ignores static numbers for them in `style`.
  const amberLen = useTransform(progress, (p) => Math.min(p, lockT));
  const amberOpacity = useTransform(progress, (p) => (p > 0.002 ? 1 : 0));
  const amberGlow = useTransform(progress, (p) => (p > 0.002 ? 0.32 : 0));
  const emeraldLen = useTransform(progress, (p) => Math.max(0, p - lockT));
  const emeraldOffset = useTransform(progress, () => lockT);
  const emeraldOpacity = useTransform(progress, (p) => (p > lockT + 0.002 ? 1 : 0));
  // The emerald glow deepens once the receipt lands — the loop "settles".
  const emeraldGlowTarget = useTransform(progress, (p) =>
    p > lockT + 0.002 ? (p >= ARRIVE_AT ? 0.58 : 0.36) : 0,
  );
  const emeraldGlowSpring = useSpring(emeraldGlowTarget, { stiffness: 90, damping: 24 });
  const emeraldGlow = reduced ? emeraldGlowTarget : emeraldGlowSpring;

  // Comet tail (two lengths for a stepped fade)
  const TAIL = 0.055;
  const tailOffset = useTransform(progress, (p) => Math.max(0, p - TAIL));
  const tailLen = useTransform(progress, (p) => Math.min(p, TAIL));
  const tail2Offset = useTransform(progress, (p) => Math.max(0, p - TAIL * 0.4));
  const tail2Len = useTransform(progress, (p) => Math.min(p, TAIL * 0.4));
  const tailColor = useTransform(progress, (p) => (p >= lockT ? EMERALD : AMBER));
  const tailOpacity = useTransform(progress, (p) => (p > 0.004 && p < ARRIVE_AT ? 0.28 : 0));
  const tail2Opacity = useTransform(progress, (p) => (p > 0.004 && p < ARRIVE_AT ? 0.6 : 0));

  // Marker position (arc-length lookup)
  const mx = useTransform(progress, (p) => route.pointAt(p).x);
  const my = useTransform(progress, (p) => route.pointAt(p).y);

  const ratio = `${route.width} / ${route.height}`;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const u = (n: number) => `calc(var(--wd-u) * ${n})`;

  const spring = (stiffness: number, damping: number, mass = 1, delay = 0): Transition =>
    reduced ? { duration: 0 } : { type: 'spring', stiffness, damping, mass, delay };

  return (
    <div style={{ containerType: 'inline-size' }}>
      <div
        className="relative"
        style={{ aspectRatio: ratio, ['--wd-u' as string]: `calc(100cqw / ${route.width})` } as CSSProperties}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${route.width} ${route.height}`}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <filter id={id('glow')} x="-10%" y="-20%" width="120%" height="140%">
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
            <radialGradient id={id('haloAmber')}>
              <stop offset="0%" stopColor={AMBER} stopOpacity="0.6" />
              <stop offset="45%" stopColor={AMBER} stopOpacity="0.18" />
              <stop offset="100%" stopColor={AMBER} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={id('haloEmerald')}>
              <stop offset="0%" stopColor={EMERALD} stopOpacity="0.65" />
              <stop offset="45%" stopColor={EMERALD} stopOpacity="0.2" />
              <stop offset="100%" stopColor={EMERALD} stopOpacity="0" />
            </radialGradient>
            <pattern id={id('grid')} width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.9" fill={hsl(HUE.line2, 0.55)} />
            </pattern>
          </defs>

          {/* Faint telemetry grid */}
          <rect x="0" y="0" width={route.width} height={route.height} fill={`url(#${id('grid')})`} opacity="0.55" />

          {/* Dormant track */}
          <path d={route.d} fill="none" stroke={LINE2} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Glow layers */}
          <motion.path
            d={route.d}
            fill="none"
            stroke={AMBER}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${id('glow')})`}
            style={{ pathLength: amberLen, opacity: amberGlow }}
          />
          <motion.path
            d={route.d}
            fill="none"
            stroke={EMERALD}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${id('glow')})`}
            style={{ pathLength: emeraldLen, pathOffset: emeraldOffset, opacity: emeraldGlow }}
          />

          {/* Lit strokes */}
          <motion.path
            d={route.d}
            fill="none"
            stroke={AMBER}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: amberLen, opacity: amberOpacity }}
          />
          <motion.path
            d={route.d}
            fill="none"
            stroke={EMERALD}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: emeraldLen, pathOffset: emeraldOffset, opacity: emeraldOpacity }}
          />

          {/* Comet tail */}
          <motion.path
            d={route.d}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: tailLen, pathOffset: tailOffset, stroke: tailColor, opacity: tailOpacity }}
          />
          <motion.path
            d={route.d}
            fill="none"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: tail2Len, pathOffset: tail2Offset, stroke: tailColor, opacity: tail2Opacity }}
          />

          {/* Node markers on the path */}
          {NODES.map((node, i) => {
            const pt = route.pointAt(route.marks[node.key]);
            const confirmed = phase.reached > i;
            const color = node.leg === 'out' ? AMBER : EMERALD;
            return (
              <g key={node.key} transform={`translate(${pt.x} ${pt.y})`}>
                <motion.circle
                  r={node.emphasized ? 7.5 : 5.5}
                  fill={hsl(HUE.canvas)}
                  stroke={confirmed ? color : LINE2}
                  strokeWidth="1.6"
                  animate={{ stroke: confirmed ? color : LINE2 }}
                  transition={spring(260, 24)}
                />
                <motion.circle
                  fill={color}
                  initial={false}
                  animate={{ r: confirmed ? (node.emphasized ? 3.6 : 2.6) : 0 }}
                  transition={spring(620, 20, 0.8)}
                />
              </g>
            );
          })}

          <OriginNode route={route} phase={phase} reduced={reduced} haloId={id('haloEmerald')} />

          <Marker
            x={mx}
            y={my}
            phase={phase}
            reduced={reduced}
            haloAmber={id('haloAmber')}
            haloEmerald={id('haloEmerald')}
          />
        </svg>

        {/* Origin label */}
        <span
          aria-hidden="true"
          className="absolute font-mono uppercase"
          style={{
            left: pct(layout.originLabel.x, route.width),
            top: pct(layout.originLabel.y, route.height),
            transform:
              layout.originLabel.align === 'center' ? 'translate(-50%, 0)' : 'translate(-100%, -50%)',
            fontSize: u(9),
            letterSpacing: '0.22em',
            color: phase.arrived ? EMERALD_BRIGHT : DIM,
            transition: reduced ? undefined : 'color 400ms ease',
          }}
        >
          You
        </span>

        {/* Journey chips */}
        <ol aria-label="Journey of one donation" className="absolute inset-0 m-0 list-none p-0">
          {NODES.map((node, i) => (
            <Chip
              key={node.key}
              node={node}
              index={i}
              placement={layout.chips[node.key]}
              route={route}
              confirmed={phase.reached > i}
              reduced={reduced}
            />
          ))}
        </ol>

        {/* Receipt panel — resolves when the loop closes */}
        <ReceiptPanel layout={layout} arrived={phase.arrived} reduced={reduced} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Chip — terminal-style status line, scaled in viewBox units                 */
/* -------------------------------------------------------------------------- */

function Chip({
  node,
  index,
  placement,
  route,
  confirmed,
  reduced,
}: {
  node: NodeCopy;
  index: number;
  placement: ChipPlacement;
  route: Route;
  confirmed: boolean;
  reduced: boolean;
}) {
  const u = (n: number) => `calc(var(--wd-u) * ${n})`;
  const legColor = node.leg === 'out' ? AMBER : EMERALD;
  const legBright = node.leg === 'out' ? AMBER_SOFT : EMERALD_BRIGHT;
  const emph = Boolean(node.emphasized);
  const spring: Transition = reduced ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 };
  const pop: Transition = reduced ? { duration: 0 } : { type: 'spring', stiffness: 640, damping: 20, mass: 0.7 };

  return (
    <li
      className="absolute"
      style={{
        left: `${(placement.x / route.width) * 100}%`,
        top: `${(placement.y / route.height) * 100}%`,
        width: u(placement.w),
        transform: placement.anchor === 'middle' ? 'translateY(-50%)' : undefined,
      }}
    >
      <motion.div
        initial={false}
        animate={{
          borderColor: confirmed ? hsl(node.leg === 'out' ? HUE.amber : HUE.emerald, emph ? 0.7 : 0.45) : LINE,
          backgroundColor: confirmed ? SURFACE2 : hsl(HUE.surface, 0.72),
          boxShadow: confirmed
            ? emph
              ? `0 0 0 1px ${hsl(HUE.emerald, 0.25)}, 0 18px 60px -22px ${hsl(HUE.emerald, 0.75)}, inset 0 0 40px -22px ${hsl(HUE.emerald, 0.55)}`
              : `0 0 0 1px ${hsl(node.leg === 'out' ? HUE.amber : HUE.emerald, 0.12)}, 0 14px 44px -24px ${hsl(node.leg === 'out' ? HUE.amber : HUE.emerald, 0.55)}`
            : `0 0 0 0 ${hsl(HUE.line, 0)}`,
          y: confirmed ? 0 : 2,
        }}
        transition={spring}
        className="border"
        style={{
          borderRadius: u(emph ? 10 : 8),
          padding: emph ? `${u(11)} ${u(13)} ${u(10)}` : `${u(9)} ${u(11)} ${u(8)}`,
        }}
      >
        <div className="flex items-center justify-between" style={{ gap: u(8) }}>
          <span
            className="flex items-center font-mono uppercase"
            style={{
              gap: u(5),
              fontSize: u(emph ? 10 : 9),
              letterSpacing: '0.2em',
              color: confirmed ? legBright : DIM,
              transition: reduced ? undefined : 'color 350ms ease',
            }}
          >
            <span className="font-mono" style={{ color: confirmed ? legColor : FAINT }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            {node.label}
            {emph && (
              <Lock
                aria-hidden="true"
                style={{ width: u(10), height: u(10), color: confirmed ? EMERALD_BRIGHT : FAINT }}
              />
            )}
          </span>
          <motion.span
            aria-hidden="true"
            className="rounded-full border"
            initial={false}
            animate={{
              scale: confirmed ? [0.6, 1.25, 1] : 1,
              backgroundColor: confirmed ? legColor : hsl(HUE.line, 0),
              borderColor: confirmed ? legColor : LINE2,
              boxShadow: confirmed ? `0 0 ${emph ? 12 : 8}px ${hsl(node.leg === 'out' ? HUE.amber : HUE.emerald, 0.7)}` : `0 0 0 ${hsl(HUE.line, 0)}`,
            }}
            transition={confirmed ? { ...pop, scale: reduced ? { duration: 0 } : { duration: 0.45, times: [0, 0.5, 1], ease: 'easeOut' } } : spring}
            style={{ width: u(emph ? 7 : 6), height: u(emph ? 7 : 6), flexShrink: 0 }}
          />
        </div>

        <p
          className="font-sans"
          style={{
            marginTop: u(emph ? 6 : 5),
            fontSize: u(emph ? 14 : 12.5),
            lineHeight: 1.28,
            fontWeight: emph ? 600 : 500,
            color: confirmed ? TEXT : hsl(HUE.dim, 0.8),
            transition: reduced ? undefined : 'color 350ms ease',
            letterSpacing: emph ? '-0.01em' : undefined,
          }}
        >
          {node.lines.map((line, li) => (
            <span key={li} className="block">
              {line}
            </span>
          ))}
        </p>

        <div
          className="relative overflow-hidden font-mono uppercase"
          style={{ marginTop: u(emph ? 8 : 6), height: u(12), fontSize: u(9), letterSpacing: '0.16em' }}
        >
          <motion.span
            className="absolute inset-0 flex items-center"
            initial={false}
            animate={{ opacity: confirmed ? 0 : 1, y: confirmed ? '-100%' : '0%' }}
            transition={spring}
            style={{ color: FAINT, gap: u(6) }}
          >
            <span className="inline-block rounded-full border" style={{ width: u(5), height: u(5), borderColor: LINE2 }} />
            Pending
            <span style={{ color: hsl(HUE.faint, 0.7) }}>· --:--:--</span>
          </motion.span>
          <motion.span
            className="absolute inset-0 flex items-center"
            initial={false}
            animate={{ opacity: confirmed ? 1 : 0, y: confirmed ? '0%' : '100%' }}
            transition={spring}
            style={{ color: hsl(HUE.text, 0.9), gap: u(6) }}
          >
            <Check aria-hidden="true" style={{ width: u(9), height: u(9), color: legBright }} strokeWidth={3} />
            Confirmed
            <span style={{ color: legBright }}>· {node.time}</span>
          </motion.span>
        </div>
      </motion.div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Marker — orb → card + lock → receipt                                       */
/* -------------------------------------------------------------------------- */

function Marker({
  x,
  y,
  phase,
  reduced,
  haloAmber,
  haloEmerald,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  phase: Phase;
  reduced: boolean;
  haloAmber: string;
  haloEmerald: string;
}) {
  const mode: 'orb' | 'card' | 'receipt' | 'docked' = phase.arrived
    ? 'docked'
    : phase.returned
      ? 'receipt'
      : phase.locked
        ? 'card'
        : 'orb';

  const sp = (stiffness: number, damping: number, mass = 1, delay = 0): Transition =>
    reduced ? { duration: 0 } : { type: 'spring', stiffness, damping, mass, delay };

  const showCard = mode === 'card';
  const showReceipt = mode === 'receipt';
  const isOrb = mode === 'orb';

  // Card geometry: 26 x 17, centered
  const CW = 26;
  const CH = 17;
  // Receipt geometry: 18 x 23, centered
  const RW = 18;
  const RH = 23;

  return (
    <motion.g
      style={{ x, y }}
      initial={false}
      animate={{ opacity: mode === 'docked' ? 0 : 1 }}
      transition={sp(300, 28)}
    >
      {/* Halos */}
      <motion.circle
        r={30}
        fill={`url(#${haloAmber})`}
        initial={false}
        animate={{ opacity: isOrb ? 1 : 0, scale: isOrb ? 1 : 0.6 }}
        transition={sp(220, 24)}
      />
      <motion.circle
        r={34}
        fill={`url(#${haloEmerald})`}
        initial={false}
        animate={{ opacity: isOrb ? 0 : 1, scale: isOrb ? 0.6 : 1 }}
        transition={sp(220, 24)}
      />

      {/* Orb */}
      <motion.circle
        fill={AMBER}
        initial={false}
        animate={{ r: isOrb ? 6.2 : 0 }}
        transition={sp(520, 24, 0.8)}
      />
      <motion.circle
        fill={AMBER_SOFT}
        initial={false}
        animate={{ r: isOrb ? 3.1 : 0 }}
        transition={sp(520, 24, 0.8)}
      />
      <motion.circle
        fill={hsl('45 100% 92%')}
        initial={false}
        animate={{ r: isOrb ? 1.3 : 0 }}
        transition={sp(520, 24, 0.8)}
      />

      {/* Card (locked) */}
      <motion.rect
        rx={3.2}
        fill={EMERALD}
        stroke={hsl('158 70% 72%')}
        strokeWidth={0.9}
        initial={false}
        animate={{
          attrX: showCard ? -CW / 2 : 0,
          attrY: showCard ? -CH / 2 : 0,
          width: showCard ? CW : 0,
          height: showCard ? CH : 0,
          opacity: showCard ? 1 : 0,
        }}
        transition={sp(520, 21, 0.9)}
      />
      {/* Card stripe */}
      <motion.rect
        fill={hsl('160 60% 20%')}
        initial={false}
        animate={{
          attrX: showCard ? -CW / 2 + 3 : 0,
          attrY: showCard ? -1.5 : 0,
          width: showCard ? 11 : 0,
          height: showCard ? 2.4 : 0,
          opacity: showCard ? 0.9 : 0,
        }}
        transition={sp(520, 21, 0.9, 0.04)}
      />
      {/* Lock — springs down onto the card like a deadbolt */}
      <motion.g
        initial={false}
        animate={{ opacity: showCard ? 1 : 0, y: showCard ? 0 : -14, scale: showCard ? 1 : 0.6 }}
        transition={showCard ? sp(1100, 30, 0.8, 0.09) : sp(500, 30)}
      >
        <g transform={`translate(${CW / 2 - 5.5} ${-CH / 2 - 2})`}>
          <path d="M 0 0 v -2.4 a 2.6 2.6 0 0 1 5.2 0 V 0" fill="none" stroke={hsl('45 100% 92%')} strokeWidth={1.3} strokeLinecap="round" />
          <rect x={-1.2} y={0} width={7.6} height={6} rx={1.4} fill={hsl('45 100% 92%')} />
          <rect x={2.1} y={2} width={1.4} height={2.2} rx={0.6} fill={EMERALD} />
        </g>
      </motion.g>

      {/* One-shot lock effects: bloom + ring pulse */}
      <AnimatePresence>
        {showCard && !reduced && (
          <motion.g key="lockfx" initial={false} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <motion.circle
              r={26}
              fill={`url(#${haloEmerald})`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0.35], scale: [0.8, 1.35, 1] }}
              transition={{ duration: 1.1, times: [0, 0.22, 1], ease: ['easeOut', 'easeInOut'], delay: 0.12 }}
            />
            <motion.circle
              r={12}
              fill="none"
              stroke={EMERALD_BRIGHT}
              strokeWidth={1.2}
              initial={{ r: 12, opacity: 0.9 }}
              animate={{ r: 46, opacity: 0 }}
              transition={{
                r: { type: 'spring', stiffness: 55, damping: 18, delay: 0.14 },
                opacity: { duration: 1.2, ease: 'easeOut', delay: 0.14 },
              }}
            />
            <motion.circle
              fill="none"
              stroke={EMERALD}
              strokeWidth={0.8}
              initial={{ r: 10, opacity: 0.6 }}
              animate={{ r: 30, opacity: 0 }}
              transition={{
                r: { type: 'spring', stiffness: 80, damping: 20, delay: 0.3 },
                opacity: { duration: 0.9, ease: 'easeOut', delay: 0.3 },
              }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Receipt (return leg) */}
      <motion.g
        initial={false}
        animate={{ opacity: showReceipt ? 1 : 0, scale: showReceipt ? 1 : 0.5 }}
        transition={showReceipt ? sp(460, 22, 0.9) : sp(500, 30)}
      >
        <path
          d={`M ${-RW / 2} ${-RH / 2 + 1.5} a 1.5 1.5 0 0 1 1.5 -1.5 h ${RW - 3} a 1.5 1.5 0 0 1 1.5 1.5 v ${RH - 3} l -2.2 -1.6 l -2.3 1.6 l -2.3 -1.6 l -2.3 1.6 l -2.3 -1.6 l -2.3 1.6 l -2.3 -1.6 l -2.2 1.6 z`}
          fill={hsl('150 30% 96%')}
          stroke={EMERALD}
          strokeWidth={0.8}
        />
        <rect x={-RW / 2 + 3} y={-RH / 2 + 4.5} width={RW - 6} height={1.4} rx={0.7} fill={hsl('158 40% 60%')} />
        <rect x={-RW / 2 + 3} y={-RH / 2 + 8} width={RW - 9} height={1.4} rx={0.7} fill={hsl('158 40% 60%')} />
        <rect x={-RW / 2 + 3} y={-RH / 2 + 11.5} width={RW - 7} height={1.4} rx={0.7} fill={hsl('158 40% 60%')} />
        <circle cx={RW / 2 - 4.2} cy={RH / 2 - 5.2} r={2.8} fill={EMERALD} />
        <path d={`M ${RW / 2 - 5.6} ${RH / 2 - 5.2} l 1 1.1 l 1.9 -2.1`} fill="none" stroke={hsl('150 30% 96%')} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </motion.g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Origin — where the loop starts and where the receipt lands                 */
/* -------------------------------------------------------------------------- */

function OriginNode({
  route,
  phase,
  reduced,
  haloId,
}: {
  route: Route;
  phase: Phase;
  reduced: boolean;
  haloId: string;
}) {
  const { start } = route;
  const sp = (stiffness: number, damping: number, mass = 1, delay = 0): Transition =>
    reduced ? { duration: 0 } : { type: 'spring', stiffness, damping, mass, delay };

  return (
    <g transform={`translate(${start.x} ${start.y})`}>
      {/* Landing bloom */}
      <motion.circle
        r={44}
        fill={`url(#${haloId})`}
        initial={false}
        animate={{ opacity: phase.arrived ? 1 : 0, scale: phase.arrived ? 1 : 0.5 }}
        transition={sp(120, 20, 1.1)}
      />
      <AnimatePresence>
        {phase.arrived && !reduced && (
          <motion.g key="landfx" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <motion.circle
              fill="none"
              stroke={EMERALD_BRIGHT}
              strokeWidth={1.3}
              initial={{ r: 10, opacity: 0.9 }}
              animate={{ r: 58, opacity: 0 }}
              transition={{
                r: { type: 'spring', stiffness: 40, damping: 16 },
                opacity: { duration: 1.6, ease: 'easeOut' },
              }}
            />
            <motion.circle
              fill="none"
              stroke={EMERALD}
              strokeWidth={0.9}
              initial={{ r: 8, opacity: 0.7 }}
              animate={{ r: 36, opacity: 0 }}
              transition={{
                r: { type: 'spring', stiffness: 60, damping: 18, delay: 0.22 },
                opacity: { duration: 1.2, ease: 'easeOut', delay: 0.22 },
              }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Ring */}
      <motion.circle
        r={9}
        fill={hsl(HUE.canvas)}
        strokeWidth={1.6}
        initial={false}
        animate={{
          stroke: phase.arrived ? EMERALD_BRIGHT : phase.moving ? hsl(HUE.amber, 0.7) : LINE2,
          r: phase.arrived ? [9, 11.5, 9.6] : 9,
        }}
        transition={
          phase.arrived && !reduced
            ? { stroke: { duration: 0.3 }, r: { duration: 0.7, times: [0, 0.35, 1], ease: 'easeOut' } }
            : sp(240, 26)
        }
      />
      <motion.circle
        fill={EMERALD}
        initial={false}
        animate={{ r: phase.arrived ? 9.6 : 0 }}
        transition={sp(520, 22, 0.9, 0.05)}
      />
      <motion.path
        d="M -4.2 0.2 L -1.3 3.1 L 4.4 -3.2"
        fill="none"
        stroke={hsl('150 30% 97%')}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: phase.arrived ? 1 : 0, opacity: phase.arrived ? 1 : 0 }}
        transition={sp(300, 28, 1, 0.18)}
      />
      {/* Idle pulse before departure */}
      {!phase.moving && !reduced && (
        <motion.circle
          fill="none"
          stroke={AMBER}
          strokeWidth={0.8}
          initial={{ r: 9, opacity: 0.5 }}
          animate={{ r: 22, opacity: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Receipt panel — proof resolves when the loop closes                        */
/* -------------------------------------------------------------------------- */

function ReceiptPanel({ layout, arrived, reduced }: { layout: Layout; arrived: boolean; reduced: boolean }) {
  const { route, panel } = layout;
  const u = (n: number) => `calc(var(--wd-u) * ${n})`;
  const sp = (delay = 0): Transition =>
    reduced ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26, mass: 0.9, delay };

  const row = (delay: number) => ({
    initial: false as const,
    animate: { opacity: arrived ? 1 : 0, y: arrived ? 0 : 6 },
    transition: sp(delay),
  });

  return (
    <motion.div
      aria-hidden={!arrived}
      className="absolute border font-mono uppercase"
      initial={false}
      animate={{
        opacity: arrived ? 1 : 0,
        y: arrived ? 0 : 10,
        scale: arrived ? 1 : 0.96,
        boxShadow: arrived
          ? `0 0 0 1px ${hsl(HUE.emerald, 0.28)}, 0 24px 70px -26px ${hsl(HUE.emerald, 0.75)}, inset 0 0 50px -30px ${hsl(HUE.emerald, 0.6)}`
          : `0 0 0 0 ${hsl(HUE.emerald, 0)}`,
      }}
      transition={sp(0.08)}
      style={{
        left: `${(panel.x / route.width) * 100}%`,
        top: `${(panel.y / route.height) * 100}%`,
        width: u(panel.w),
        borderRadius: u(10),
        borderColor: hsl(HUE.emerald, 0.55),
        background: `linear-gradient(180deg, ${hsl('158 30% 12%')} 0%, ${hsl(HUE.surface)} 100%)`,
        padding: `${u(10)} ${u(12)} ${u(10)}`,
        fontSize: u(9),
        letterSpacing: '0.18em',
        transformOrigin: '10% 100%',
        pointerEvents: 'none',
      }}
    >
      <motion.div {...row(0.14)} className="flex items-center justify-between" style={{ gap: u(8) }}>
        <span style={{ color: EMERALD_BRIGHT }}>Receipt returned</span>
        <span className="flex items-center" style={{ gap: u(4), color: TEXT }}>
          <Check aria-hidden="true" strokeWidth={3} style={{ width: u(9), height: u(9), color: EMERALD_BRIGHT }} />
          Confirmed
        </span>
      </motion.div>
      <motion.div
        {...row(0.22)}
        className="flex items-center justify-between border-t"
        style={{ marginTop: u(7), paddingTop: u(7), borderColor: hsl(HUE.emerald, 0.22), color: DIM, gap: u(8) }}
      >
        <span>Trace</span>
        <span style={{ color: TEXT }}>{TRACE_ID}</span>
      </motion.div>
      <motion.div {...row(0.3)} className="flex items-center justify-between" style={{ marginTop: u(5), color: DIM, gap: u(8) }}>
        <span>Loop</span>
        <span style={{ color: TEXT }}>Closed · 16:08:47</span>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Contrast strip, doors                                                      */
/* -------------------------------------------------------------------------- */

const PAIRS: [string, string][] = [
  ['Cash goes anywhere.', 'This goes one place.'],
  ['Cash leaves no proof.', 'This returns a receipt.'],
  ['Trust a promise.', 'Trust the rails.'],
];

function ContrastStrip() {
  return (
    <div className="mt-6 grid grid-cols-1 border-y md:mt-10 md:grid-cols-3" style={{ borderColor: LINE }}>
      {PAIRS.map(([cash, ours], i) => (
        <div
          key={cash}
          className={cn(
            'flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 px-2 py-5 text-center text-[15px] md:px-6 md:py-6 md:text-base',
            i > 0 && 'border-t md:border-l md:border-t-0',
          )}
          style={{ borderColor: LINE }}
        >
          <span style={{ color: hsl(HUE.dim, 0.75) }}>{cash}</span>
          <span aria-hidden="true" className="font-mono text-xs" style={{ color: FAINT }}>
            →
          </span>
          <span className="font-medium" style={{ color: EMERALD_BRIGHT }}>
            {ours}
          </span>
        </div>
      ))}
    </div>
  );
}

function Door({ to, title, subtitle }: { to: string; title: string; subtitle: string }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col rounded-2xl border p-7 outline-none transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 focus-visible:-translate-y-0.5 md:p-8 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{
        borderColor: LINE,
        background: `linear-gradient(180deg, ${hsl(HUE.surface2, 0.55)} 0%, ${hsl(HUE.surface, 0.85)} 100%)`,
        boxShadow: `inset 0 1px 0 ${hsl(HUE.line2, 0.35)}`,
        ['--door-glow' as string]: `0 0 0 1px ${hsl(HUE.emerald, 0.35)}, 0 32px 90px -40px ${hsl(HUE.emerald, 0.7)}, inset 0 1px 0 ${hsl(HUE.line2, 0.35)}`,
      } as CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hsl(HUE.emerald, 0.5);
        e.currentTarget.style.boxShadow = e.currentTarget.style.getPropertyValue('--door-glow');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = LINE;
        e.currentTarget.style.boxShadow = `inset 0 1px 0 ${hsl(HUE.line2, 0.35)}`;
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = hsl(HUE.emerald, 0.7);
        e.currentTarget.style.boxShadow = e.currentTarget.style.getPropertyValue('--door-glow');
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = LINE;
        e.currentTarget.style.boxShadow = `inset 0 1px 0 ${hsl(HUE.line2, 0.35)}`;
      }}
    >
      <span className="flex items-start justify-between gap-4">
        <span className="text-2xl font-semibold tracking-[-0.01em] md:text-[1.75rem]" style={{ color: TEXT }}>
          {title}
        </span>
        <span
          aria-hidden="true"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color] duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transition-none"
          style={{ borderColor: LINE2, backgroundColor: hsl(HUE.surface2, 0.6), color: EMERALD_BRIGHT }}
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </span>
      <span className="mt-3 text-[15px] leading-relaxed md:text-base" style={{ color: DIM }}>
        {subtitle}
      </span>
    </Link>
  );
}
