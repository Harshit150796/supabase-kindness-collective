import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';

const GOLD = 'hsl(var(--gold))';
const PRIMARY = 'hsl(var(--primary))';
const BACKGROUND = 'hsl(var(--background))';
const CARD = 'hsl(var(--card))';
const FOREGROUND = 'hsl(var(--foreground))';
const MUTED = 'hsl(var(--muted-foreground))';

const VERSE = [
  'Someone asks for one real thing.',
  'You cover it.',
  'The money hardens — it can only become that one thing now.',
  "It's spent exactly where it was promised.",
  'And the proof finds its way home to you.',
];

const REVEAL_AT = [0.11, 0.27, 0.43, 0.66, 0.84];
const LOCK_AT = 0.43;
const TURN_AT = 0.76;

type Point = { x: number; y: number };
type Curve = { c1: Point; c2: Point; to: Point };
type Branch = {
  d: string;
  width: number;
  height: number;
  start: Point;
  lock: Point;
  end: Point;
  pointAt: (progress: number) => Point;
};

type VersePlacement = { x: number; y: number; width: number; align?: 'left' | 'right' };

type BranchLayout = {
  branch: Branch;
  verse: VersePlacement[];
  leafAngle: number;
};

function makeBranch(width: number, height: number, start: Point, curves: Curve[], lockCurve: number): Branch {
  const points: Point[] = [start];
  const lengths: number[] = [0];
  let previous = start;
  let total = 0;
  let lock = start;
  let d = `M ${start.x} ${start.y}`;

  curves.forEach((curve, curveIndex) => {
    for (let step = 1; step <= 80; step += 1) {
      const t = step / 80;
      const inverse = 1 - t;
      const point = {
        x:
          inverse ** 3 * previous.x +
          3 * inverse ** 2 * t * curve.c1.x +
          3 * inverse * t ** 2 * curve.c2.x +
          t ** 3 * curve.to.x,
        y:
          inverse ** 3 * previous.y +
          3 * inverse ** 2 * t * curve.c1.y +
          3 * inverse * t ** 2 * curve.c2.y +
          t ** 3 * curve.to.y,
      };
      const last = points[points.length - 1];
      if (last) total += Math.hypot(point.x - last.x, point.y - last.y);
      points.push(point);
      lengths.push(total);
    }
    d += ` C ${curve.c1.x} ${curve.c1.y} ${curve.c2.x} ${curve.c2.y} ${curve.to.x} ${curve.to.y}`;
    previous = curve.to;
    if (curveIndex === lockCurve) lock = curve.to;
  });

  const pointAt = (progress: number) => {
    const target = Math.max(0, Math.min(1, progress)) * total;
    let low = 0;
    let high = lengths.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      const value = lengths[middle] ?? 0;
      if (value < target) low = middle + 1;
      else high = middle;
    }
    if (low === 0) return points[0] ?? start;
    const a = points[low - 1] ?? start;
    const b = points[low] ?? a;
    const from = lengths[low - 1] ?? 0;
    const to = lengths[low] ?? from;
    const ratio = to === from ? 0 : (target - from) / (to - from);
    return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
  };

  return { d, width, height, start, lock, end: previous, pointAt };
}

const DESKTOP_BRANCH = makeBranch(
  1200,
  760,
  { x: 64, y: 590 },
  [
    { c1: { x: 150, y: 570 }, c2: { x: 170, y: 355 }, to: { x: 300, y: 330 } },
    { c1: { x: 415, y: 308 }, c2: { x: 440, y: 480 }, to: { x: 575, y: 455 } },
    { c1: { x: 720, y: 430 }, c2: { x: 700, y: 190 }, to: { x: 845, y: 180 } },
    { c1: { x: 965, y: 170 }, c2: { x: 995, y: 330 }, to: { x: 1135, y: 285 } },
  ],
  1,
);

const MOBILE_BRANCH = makeBranch(
  360,
  1120,
  { x: 50, y: 70 },
  [
    { c1: { x: 24, y: 170 }, c2: { x: 95, y: 230 }, to: { x: 56, y: 315 } },
    { c1: { x: 20, y: 410 }, c2: { x: 108, y: 475 }, to: { x: 62, y: 555 } },
    { c1: { x: 18, y: 650 }, c2: { x: 105, y: 730 }, to: { x: 58, y: 810 } },
    { c1: { x: 14, y: 900 }, c2: { x: 112, y: 975 }, to: { x: 64, y: 1050 } },
  ],
  1,
);

const DESKTOP_LAYOUT: BranchLayout = {
  branch: DESKTOP_BRANCH,
  leafAngle: -18,
  verse: [
    { x: 92, y: 430, width: 245 },
    { x: 300, y: 220, width: 220 },
    { x: 500, y: 505, width: 390 },
    { x: 760, y: 74, width: 330 },
    { x: 846, y: 348, width: 315 },
  ],
};

const MOBILE_LAYOUT: BranchLayout = {
  branch: MOBILE_BRANCH,
  leafAngle: -24,
  verse: [
    { x: 98, y: 105, width: 225 },
    { x: 103, y: 330, width: 210 },
    { x: 103, y: 535, width: 235 },
    { x: 105, y: 785, width: 225 },
    { x: 104, y: 1015, width: 230 },
  ],
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

function useStage(progress: MotionValue<number>) {
  const getStage = (value: number) => REVEAL_AT.filter((threshold) => value >= threshold).length;
  const [stage, setStage] = useState(() => getStage(progress.get()));
  useMotionValueEvent(progress, 'change', (value) => {
    const next = getStage(value);
    setStage((current) => (current === next ? current : next));
  });
  return stage;
}

export function WhatWeDo() {
  const reducedMotion = useReducedMotion() ?? false;
  const mobile = useMediaQuery('(max-width: 767px)');

  return (
    <section
      aria-labelledby="what-we-do-title"
      className="relative overflow-clip bg-background py-20 md:py-28 lg:py-32"
      style={{
        backgroundImage:
          'radial-gradient(circle at 8% 28%, hsl(var(--gold) / 0.05), transparent 28%), radial-gradient(circle at 92% 58%, hsl(var(--primary) / 0.05), transparent 30%)',
      }}
    >
      <div className="container mx-auto px-5 sm:px-8">
        <header className="max-w-6xl">
          <motion.h2
            id="what-we-do-title"
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 105, damping: 22 }}
            className="font-bold text-foreground"
            style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', lineHeight: 0.94, letterSpacing: '0' }}
          >
            You don’t send money.
            <br />
            You send groceries.
          </motion.h2>
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 105, damping: 22, delay: 0.08 }}
            className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:mt-10 md:text-xl"
          >
            Someone tells you exactly what they need. Your money arrives as that exact thing — and the receipt comes
            back to you.
          </motion.p>
        </header>
      </div>

      <Journey layout={mobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT} mobile={mobile} reduced={reducedMotion} />

      <div className="container mx-auto px-5 sm:px-8">
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 95, damping: 21 }}
          className="mx-auto max-w-5xl py-28 text-center text-3xl font-semibold leading-tight text-foreground md:py-44 md:text-5xl lg:py-52 lg:text-6xl"
        >
          We don’t track the person. We track the money.
        </motion.p>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <Door to="/donate" title="I want to help someone" subtitle="Pick a real need and cover it." />
          <Door to="/apply" title="I need help" subtitle="Tell us what you need. U.S. residents, free to apply." />
        </div>

        <div className="pb-4 pt-24 text-center md:pt-32">
          <p className="text-lg font-medium text-foreground md:text-xl">Real people are asking right now. Here’s who.</p>
          <motion.div
            aria-hidden="true"
            className="mx-auto mt-5 w-fit text-primary"
            animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ type: 'spring', stiffness: 50, damping: 12, repeat: Infinity, repeatDelay: 1.2 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Journey({ layout, mobile, reduced }: { layout: BranchLayout; mobile: boolean; reduced: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(reduced ? 1 : 0);
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ['start start', 'end end'] });
  const scrollSpring = useSpring(scrollYProgress, { stiffness: 75, damping: 24, mass: 0.85 });

  useEffect(() => {
    if (mobile || reduced) return;
    progress.set(scrollSpring.get());
    return scrollSpring.on('change', (value) => progress.set(value));
  }, [mobile, progress, reduced, scrollSpring]);

  useEffect(() => {
    if (!reduced) return;
    progress.set(1);
  }, [progress, reduced]);

  useEffect(() => {
    if (!mobile || reduced) return;
    const element = drawingRef.current;
    if (!element) return;
    let stopped = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const play = async () => {
          await animate(progress, LOCK_AT, { type: 'spring', stiffness: 38, damping: 15, mass: 1.2 });
          if (stopped) return;
          await animate(progress, TURN_AT, { type: 'spring', stiffness: 34, damping: 15, mass: 1.25 });
          if (stopped) return;
          await animate(progress, 1, { type: 'spring', stiffness: 28, damping: 15, mass: 1.3 });
        };
        void play();
      },
      { threshold: 0.16 },
    );
    observer.observe(element);
    return () => {
      stopped = true;
      observer.disconnect();
    };
  }, [mobile, progress, reduced]);

  return (
    <div ref={sceneRef} className="relative mt-16 md:mt-20" style={!mobile && !reduced ? { height: '270vh' } : undefined}>
      <div className={!mobile && !reduced ? 'sticky top-0 flex h-[100svh] items-center' : undefined}>
        <div ref={drawingRef} className="container mx-auto w-full px-3 sm:px-8">
          <BranchScene layout={layout} progress={progress} reduced={reduced} />
        </div>
      </div>
    </div>
  );
}

function BranchScene({ layout, progress, reduced }: { layout: BranchLayout; progress: MotionValue<number>; reduced: boolean }) {
  const { branch } = layout;
  const stage = useStage(progress);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `branch-gradient-${rawId}`;
  const glowId = `branch-glow-${rawId}`;

  const outbound = useTransform(progress, (value) => Math.min(1, value / TURN_AT));
  const goldLength = useTransform(outbound, (value) => Math.min(value, LOCK_AT / TURN_AT));
  const greenLength = useTransform(outbound, (value) => Math.max(0, value - LOCK_AT / TURN_AT));
  const greenOffset = LOCK_AT / TURN_AT;
  const coinProgress = useTransform(progress, (value) => Math.min(1, value / TURN_AT));
  const receiptProgress = useTransform(progress, (value) => {
    if (value <= TURN_AT) return 1;
    return 1 - (value - TURN_AT) / (1 - TURN_AT);
  });
  const coinX = useTransform(coinProgress, (value) => branch.pointAt(value).x);
  const coinY = useTransform(coinProgress, (value) => branch.pointAt(value).y);
  const receiptX = useTransform(receiptProgress, (value) => branch.pointAt(value).x);
  const receiptY = useTransform(receiptProgress, (value) => branch.pointAt(value).y);
  const complete = stage === VERSE.length;
  const locked = progress.get() >= LOCK_AT;
  const [isLocked, setIsLocked] = useState(reduced || locked);
  const [isReturning, setIsReturning] = useState(reduced || progress.get() >= TURN_AT);

  useMotionValueEvent(progress, 'change', (value) => {
    setIsLocked(value >= LOCK_AT);
    setIsReturning(value >= TURN_AT);
  });

  const unit = (value: number) => `calc(var(--branch-unit) * ${value})`;
  const percent = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div className="mx-auto max-w-7xl" style={{ containerType: 'inline-size' }}>
      <div
        className="relative"
        style={{
          aspectRatio: `${branch.width} / ${branch.height}`,
          ['--branch-unit' as string]: `calc(100cqw / ${branch.width})`,
        } as CSSProperties}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${branch.width} ${branch.height}`}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2={branch.width > branch.height ? '1' : '0'}
              y2={branch.width > branch.height ? '0' : '1'}
            >
              <stop offset={`${branch.width > branch.height ? 47.7 : 49.5}%`} stopColor={GOLD} />
              <stop offset={`${branch.width > branch.height ? 47.7 : 49.5}%`} stopColor={PRIMARY} />
            </linearGradient>
            <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          <path d={branch.d} fill="none" stroke="hsl(var(--border))" strokeWidth="2" strokeLinecap="round" />
          <motion.path
            d={branch.d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: outbound }}
          />

          <Leaf point={branch.lock} angle={layout.leafAngle} visible={isLocked} reduced={reduced} />
          <Traveler
            coinX={coinX}
            coinY={coinY}
            receiptX={receiptX}
            receiptY={receiptY}
            locked={isLocked}
            returning={isReturning}
            complete={complete}
            reduced={reduced}
            glowId={glowId}
          />
        </svg>

        <ol aria-label="The journey of a donation" className="absolute inset-0 m-0 list-none p-0">
          {VERSE.map((line, index) => {
            const placement = layout.verse[index];
            if (!placement) return null;
            const visible = stage > index;
            return (
              <li
                key={line}
                className="absolute"
                style={{
                  left: percent(placement.x, branch.width),
                  top: percent(placement.y, branch.height),
                  width: unit(placement.width),
                  textAlign: placement.align,
                }}
              >
                <motion.p
                  initial={false}
                  animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : unit(14) }}
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: index === 2 ? 125 : 90, damping: 19, mass: 0.9 }}
                  className={index === 2 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}
                  style={{
                    fontSize: unit(index === 2 ? 28 : 23),
                    lineHeight: index === 2 ? 1.24 : 1.35,
                    letterSpacing: '0',
                  }}
                >
                  {line}
                </motion.p>
              </li>
            );
          })}
        </ol>
      </div>

      <motion.p
        initial={false}
        animate={{ opacity: complete ? 1 : 0, y: complete ? 0 : 18 }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 85, damping: 20, mass: 1 }}
        className="mt-12 text-center text-2xl font-semibold text-foreground md:mt-20 md:text-4xl"
      >
        Nothing goes missing on the way.
      </motion.p>
    </div>
  );
}

function Leaf({ point, angle, visible, reduced }: { point: Point; angle: number; visible: boolean; reduced: boolean }) {
  return (
    <g transform={`translate(${point.x} ${point.y}) rotate(${angle})`}>
      <motion.path
        d="M 0 0 C 15 -31 49 -37 70 -21 C 53 8 24 19 0 0 Z"
        fill="hsl(var(--primary) / 0.12)"
        stroke={PRIMARY}
        strokeWidth="2"
        strokeLinejoin="round"
        initial={false}
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0, rotate: visible ? 0 : -36 }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 105, damping: 14, mass: 0.9 }}
        style={{ transformOrigin: '0px 0px' }}
      />
      <motion.path
        d="M 3 -1 C 24 -9 43 -16 62 -22"
        fill="none"
        stroke={PRIMARY}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: visible ? 1 : 0, pathLength: visible ? 1 : 0 }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 75, damping: 18, delay: 0.15 }}
      />
    </g>
  );
}

function Traveler({
  coinX,
  coinY,
  receiptX,
  receiptY,
  locked,
  returning,
  complete,
  reduced,
  glowId,
}: {
  coinX: MotionValue<number>;
  coinY: MotionValue<number>;
  receiptX: MotionValue<number>;
  receiptY: MotionValue<number>;
  locked: boolean;
  returning: boolean;
  complete: boolean;
  reduced: boolean;
  glowId: string;
}) {
  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 520, damping: 22, mass: 0.8 };

  return (
    <>
      <motion.g style={{ x: coinX, y: coinY }} animate={{ opacity: returning || complete ? 0 : 1 }} transition={spring}>
        <motion.circle r="22" fill="hsl(var(--gold) / 0.18)" filter={`url(#${glowId})`} animate={{ opacity: locked ? 0 : 1 }} />
        <motion.circle
          fill={locked ? PRIMARY : GOLD}
          stroke={BACKGROUND}
          strokeWidth="2"
          initial={false}
          animate={{ r: locked ? 0 : 10 }}
          transition={spring}
        />
        <motion.rect
          fill={PRIMARY}
          stroke={BACKGROUND}
          strokeWidth="2"
          rx="3"
          initial={false}
          animate={{ x: locked ? -15 : 0, y: locked ? -10 : 0, width: locked ? 30 : 0, height: locked ? 20 : 0 }}
          transition={spring}
        />
        <motion.g
          initial={false}
          animate={{ opacity: locked ? 1 : 0, y: locked ? 0 : -14, scale: locked ? 1 : 0.65 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 800, damping: 17, mass: 0.7 }}
        >
          <path d="M -4 -1 v -3 a 4 4 0 0 1 8 0 v 3" fill="none" stroke={BACKGROUND} strokeWidth="2" strokeLinecap="round" />
          <rect x="-6" y="-1" width="12" height="9" rx="2" fill={BACKGROUND} />
          <circle cx="0" cy="3" r="1.4" fill={PRIMARY} />
        </motion.g>
        <motion.circle
          r="12"
          fill="none"
          stroke={PRIMARY}
          strokeWidth="2"
          initial={false}
          animate={{ r: locked ? 48 : 12, opacity: locked ? 0 : 0 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 52, damping: 14 }}
        />
      </motion.g>

      <motion.g
        style={{ x: receiptX, y: receiptY }}
        initial={false}
        animate={{ opacity: returning ? 1 : 0, scale: complete ? 1.08 : 1 }}
        transition={complete && !reduced ? { type: 'spring', stiffness: 420, damping: 15, mass: 1.1 } : spring}
      >
        <path
          d="M -10 -14 H 10 V 11 L 6 8 L 2 11 L -2 8 L -6 11 L -10 8 Z"
          fill={CARD}
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M -5 -7 H 5 M -5 -2 H 2 M -5 3 H 5" stroke={PRIMARY} strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
    </>
  );
}

function Door({ to, title, subtitle }: { to: string; title: string; subtitle: string }) {
  return (
    <Link
      to={to}
      className="group flex min-h-40 items-start justify-between gap-6 rounded-lg border border-border bg-card p-7 outline-none transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_55px_-30px_hsl(var(--primary)/0.45)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none md:p-9"
    >
      <span>
        <span className="block text-2xl font-semibold text-foreground md:text-3xl">{title}</span>
        <span className="mt-3 block text-base leading-relaxed text-muted-foreground">{subtitle}</span>
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="mt-1 h-6 w-6 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none"
      />
    </Link>
  );
}
