import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';

const ACT_DURATION = 3500;

const ACTS = [
  {
    name: 'You give',
    body: "You pick a real need someone posted and cover it. Ten dollars or ten thousand — you're funding one specific thing, not a general pot.",
  },
  {
    name: 'It becomes a coupon',
    body: 'Your money converts into a locked coupon. From this moment it can only buy the thing it was meant to buy. It cannot be withdrawn as cash.',
  },
  {
    name: 'They get what they needed',
    body: 'They redeem it at the store. Groceries, medicine, a ride to work — the actual thing, delivered as the thing itself.',
  },
  {
    name: 'You get the proof',
    body: 'A receipt lands back with you showing exactly what your money became. Not a thank-you note — a receipt.',
  },
] as const;

const spring = { type: 'spring' as const, stiffness: 145, damping: 19, mass: 0.9 };
const emphaticSpring = { type: 'spring' as const, stiffness: 310, damping: 16, mass: 0.85 };

export function WhatWeDo() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="what-we-do-title"
      className="relative overflow-clip bg-background py-20 md:py-28 lg:py-32"
      style={{
        backgroundImage:
          'radial-gradient(circle at 12% 26%, hsl(var(--gold) / 0.05), transparent 28%), radial-gradient(circle at 88% 58%, hsl(var(--primary) / 0.05), transparent 30%)',
      }}
    >
      <div className="container mx-auto px-5 sm:px-8">
        <header className="max-w-6xl">
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={spring}
            className="mb-5 text-xs font-semibold uppercase text-primary sm:text-sm"
            style={{ letterSpacing: '0.14em' }}
          >
            How it actually works
          </motion.p>
          <motion.h2
            id="what-we-do-title"
            initial={reducedMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={spring}
            className="font-bold text-foreground"
            style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', lineHeight: 0.94, letterSpacing: '0' }}
          >
            You don’t send money.
            <br />
            You send groceries.
          </motion.h2>
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ ...spring, delay: 0.08 }}
            className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:mt-10 md:text-xl"
          >
            Someone tells you exactly what they need. Your money arrives as that exact thing — and the proof comes
            back to you.
          </motion.p>
        </header>

        <DonationStory reducedMotion={reducedMotion} />

        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={spring}
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

function DonationStory({ reducedMotion }: { reducedMotion: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.25 });
  const [activeAct, setActiveAct] = useState(reducedMotion ? 3 : 0);
  const [paused, setPaused] = useState(false);
  const [resolved, setResolved] = useState(reducedMotion);
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const [year, setYear] = useState(reducedMotion ? 2036 : 2026);
  const remainingRef = useRef(ACT_DURATION);
  const pointerStartRef = useRef<number | null>(null);

  const selectAct = useCallback((index: number) => {
    setActiveAct(index);
    setResolved(false);
    setYear(2026);
    setProgress(0);
    remainingRef.current = ACT_DURATION;
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setActiveAct(3);
      setResolved(true);
      setYear(2036);
      setProgress(1);
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (!inView || paused || reducedMotion || resolved) return;
    const startedAt = performance.now();
    const startingRemaining = remainingRef.current;
    let completed = false;

    const updateProgress = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      setProgress(Math.min(1, (ACT_DURATION - startingRemaining + elapsed) / ACT_DURATION));
    }, 50);

    const timer = window.setTimeout(() => {
      completed = true;
      setProgress(1);
      remainingRef.current = ACT_DURATION;
      if (activeAct < ACTS.length - 1) {
        setActiveAct((current) => current + 1);
        setProgress(0);
      } else {
        setResolved(true);
      }
    }, startingRemaining);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(updateProgress);
      if (!completed) {
        remainingRef.current = Math.max(0, startingRemaining - (performance.now() - startedAt));
      }
    };
  }, [activeAct, inView, paused, reducedMotion, resolved]);

  useEffect(() => {
    if (!resolved || reducedMotion || activeAct !== 3) return;
    setYear(2026);
    let nextYear = 2026;
    const timer = window.setInterval(() => {
      nextYear += 1;
      setYear(Math.min(nextYear, 2036));
      if (nextYear >= 2036) window.clearInterval(timer);
    }, 620);
    return () => window.clearInterval(timer);
  }, [activeAct, reducedMotion, resolved]);

  const moveAct = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(ACTS.length - 1, activeAct + direction));
    if (next !== activeAct) selectAct(next);
  };

  if (reducedMotion) {
    return (
      <div ref={stageRef} className="mt-16 md:mt-24">
        <StageFrame>
          <ProofVisual year={2036} reduced />
        </StageFrame>
        <ol className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-2" aria-label="How a donation works">
          {ACTS.map((act, index) => (
            <li key={act.name} className="border-t border-border pt-5">
              <p className="text-sm font-semibold text-primary">0{index + 1}</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">{act.name}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{act.body}</p>
            </li>
          ))}
        </ol>
        <Climax visible />
      </div>
    );
  }

  const act = ACTS[activeAct];

  return (
    <div ref={stageRef} className="mt-16 md:mt-24">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse') pointerStartRef.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const start = pointerStartRef.current;
          pointerStartRef.current = null;
          if (start === null || event.pointerType === 'mouse') return;
          const distance = event.clientX - start;
          if (Math.abs(distance) >= 42) moveAct(distance < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          pointerStartRef.current = null;
        }}
        className="touch-pan-y"
      >
        <StageFrame>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeAct}
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={spring}
              className="absolute inset-0"
            >
              {activeAct === 0 && <GiveVisual />}
              {activeAct === 1 && <CouponVisual />}
              {activeAct === 2 && <GroceriesVisual />}
              {activeAct === 3 && <ProofVisual year={year} reduced={false} />}
            </motion.div>
          </AnimatePresence>
        </StageFrame>

        <div className="mx-auto mt-7 min-h-40 max-w-3xl text-center sm:min-h-36 md:mt-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={act.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">{act.name}</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
                {act.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <ol
          aria-label="Choose a step"
          className="mx-auto mt-7 grid max-w-3xl grid-cols-4 gap-1.5 sm:gap-3"
        >
          {ACTS.map((item, index) => {
            const selected = index === activeAct;
            return (
              <li key={item.name} className="min-w-0">
                <button
                  type="button"
                  aria-current={selected ? 'step' : undefined}
                  aria-label={`Step ${index + 1}: ${item.name}`}
                  onClick={() => selectAct(index)}
                  className="relative flex min-h-11 w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card px-1.5 pb-1 pt-0.5 text-center text-[10px] font-semibold leading-tight text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-3 sm:text-xs md:text-sm"
                >
                  <span className={selected ? 'text-foreground' : undefined}>{item.name}</span>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
                    <motion.span
                      className="block h-full origin-left bg-primary"
                      animate={{ scaleX: selected ? progress : index < activeAct ? 1 : 0 }}
                      transition={{ type: 'spring', stiffness: 90, damping: 24, mass: 0.6 }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <Climax visible={resolved} />
    </div>
  );
}

function StageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-[0_28px_80px_-54px_hsl(var(--primary)/0.35)] sm:aspect-[16/9]">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 38% 48%, hsl(var(--gold) / 0.05), transparent 32%), radial-gradient(circle at 68% 50%, hsl(var(--primary) / 0.05), transparent 34%)',
        }}
      />
      {children}
    </div>
  );
}

function GiveVisual() {
  return (
    <div className="flex h-full items-center justify-center" aria-hidden="true">
      <motion.div className="relative flex flex-col items-center" initial="hidden" animate="shown">
        <motion.div
          variants={{ hidden: { opacity: 0, y: 42, scale: 0.7 }, shown: { opacity: 1, y: -28, scale: 1 } }}
          transition={{ ...emphaticSpring, delay: 0.55 }}
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-card text-2xl font-bold text-gold shadow-[0_12px_42px_-16px_hsl(var(--gold)/0.65)] sm:h-24 sm:w-24 sm:text-3xl"
        >
          $10
        </motion.div>
        <motion.div
          variants={{ hidden: { scale: 1 }, shown: { scale: [1, 0.94, 1] } }}
          transition={{ ...emphaticSpring, delay: 0.18 }}
          className="relative flex h-12 min-w-32 items-center justify-center rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_14px_36px_-18px_hsl(var(--primary)/0.55)] sm:h-14 sm:min-w-40 sm:text-base"
        >
          Donate
          <motion.span
            className="absolute inset-0 rounded-md border-2 border-primary"
            initial={{ opacity: 0.45, scale: 0.85 }}
            animate={{ opacity: 0, scale: 1.65 }}
            transition={{ type: 'spring', stiffness: 45, damping: 12, delay: 0.22 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function CouponVisual() {
  return (
    <div className="flex h-full items-center justify-center px-5" aria-hidden="true">
      <motion.svg
        viewBox="0 0 640 360"
        className="h-full w-full max-w-3xl"
        initial={{ opacity: 0, scale: 0.42, borderRadius: '999px' }}
        animate={{ opacity: 1, scale: 1, borderRadius: '24px' }}
        transition={{ ...emphaticSpring, stiffness: 190, damping: 18 }}
      >
        <motion.circle
          cx="320"
          cy="180"
          r="108"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          initial={{ opacity: 0.5, scale: 0.45 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ type: 'spring', stiffness: 48, damping: 13, delay: 0.75 }}
          style={{ transformOrigin: '320px 180px' }}
        />
        <motion.rect
          x="95"
          y="82"
          width="450"
          height="196"
          rx="24"
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth="5"
          initial={{ pathLength: 0, stroke: 'hsl(var(--gold))' }}
          animate={{ pathLength: 1, stroke: 'hsl(var(--primary))' }}
          transition={{ ...spring, delay: 0.1 }}
        />
        <circle cx="545" cy="114" r="12" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="3" />
        <circle cx="545" cy="246" r="12" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="3" />
        <path d="M 486 101 V 259" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="10 9" />
        <text x="137" y="132" fill="hsl(var(--primary))" fontSize="18" fontWeight="700" letterSpacing="2">GROCERY</text>
        <text x="137" y="195" fill="hsl(var(--foreground))" fontSize="49" fontWeight="750">$10 COUPON</text>
        <text x="138" y="231" fill="hsl(var(--muted-foreground))" fontSize="15">Locked for approved essentials</text>
        <Barcode x={386} y={145} active={false} />
        <motion.g
          initial={{ opacity: 0, y: -34, scale: 0.55 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...emphaticSpring, delay: 0.62, stiffness: 430, damping: 15 }}
        >
          <path d="M 500 149 v -14 a 18 18 0 0 1 36 0 v 14" fill="none" stroke="hsl(var(--primary))" strokeWidth="7" strokeLinecap="round" />
          <rect x="492" y="147" width="52" height="43" rx="9" fill="hsl(var(--primary))" />
          <circle cx="518" cy="166" r="5" fill="hsl(var(--primary-foreground))" />
        </motion.g>
      </motion.svg>
    </div>
  );
}

function Barcode({ x, y, active }: { x: number; y: number; active: boolean }) {
  const bars = [4, 2, 6, 3, 5, 2, 4, 6, 2, 5, 3, 6];
  let offset = 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      {bars.map((width, index) => {
        const current = offset;
        offset += width + 4;
        return (
          <motion.rect
            key={`${width}-${index}`}
            x={current}
            y="0"
            width={width}
            height="70"
            rx="1"
            fill="hsl(var(--primary))"
            initial={{ opacity: active ? 0.2 : 0.72 }}
            animate={{ opacity: active ? 1 : 0.72 }}
            transition={{ ...spring, delay: active ? 0.04 * index + 0.28 : 0 }}
          />
        );
      })}
    </g>
  );
}

function GroceriesVisual() {
  return (
    <div className="flex h-full items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 640 400" className="h-full w-full max-w-3xl overflow-visible">
        <motion.g
          initial={{ opacity: 1, x: 0, y: -48, rotate: 0, scale: 0.78 }}
          animate={{ opacity: 0, x: -75, y: 215, rotate: -12, scale: 0.7 }}
          transition={{ ...spring, delay: 0.72 }}
          style={{ transformOrigin: '320px 180px' }}
        >
          <rect x="190" y="92" width="260" height="126" rx="18" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="4" />
          <path d="M 393 106 V 204" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="8 7" />
          <text x="220" y="135" fill="hsl(var(--primary))" fontSize="15" fontWeight="700">GROCERY</text>
          <text x="220" y="183" fill="hsl(var(--foreground))" fontSize="34" fontWeight="750">$10</text>
          <Barcode x={310} y={130} active />
          <motion.rect
            x="304"
            y="124"
            width="94"
            height="72"
            fill="hsl(var(--primary) / 0.1)"
            initial={{ x: 304 }}
            animate={{ x: 394 }}
            transition={{ type: 'spring', stiffness: 75, damping: 18, delay: 0.16 }}
          />
        </motion.g>

        <motion.g initial={{ opacity: 0, y: 105, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...spring, delay: 0.75 }}>
          <path d="M 205 186 H 435 L 412 354 Q 410 370 394 370 H 246 Q 230 370 228 354 Z" fill="hsl(var(--gold) / 0.22)" stroke="hsl(var(--gold))" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 252 190 C 252 125 388 125 388 190" fill="none" stroke="hsl(var(--gold))" strokeWidth="9" strokeLinecap="round" />
          <path d="M 228 250 H 412" stroke="hsl(var(--gold) / 0.45)" strokeWidth="3" />
          <path d="M 320 270 C 299 240 260 253 266 288 C 271 318 302 337 320 347 C 338 337 369 318 374 288 C 380 253 341 240 320 270 Z" fill="hsl(var(--primary) / 0.13)" stroke="hsl(var(--primary))" strokeWidth="3" />
        </motion.g>

        <motion.g initial={{ opacity: 0, y: 85, rotate: -8, scale: 0.6 }} animate={{ opacity: 1, y: 0, rotate: -4, scale: 1 }} transition={{ ...emphaticSpring, delay: 1.02 }} style={{ transformOrigin: '268px 176px' }}>
          <path d="M 217 174 Q 222 112 273 97 Q 312 100 323 139 Q 306 176 257 198 Z" fill="hsl(var(--gold) / 0.3)" stroke="hsl(var(--gold))" strokeWidth="4" />
          <path d="M 231 151 Q 270 125 307 143 M 239 167 Q 274 143 306 158" fill="none" stroke="hsl(var(--gold))" strokeWidth="3" strokeLinecap="round" />
        </motion.g>

        <motion.g initial={{ opacity: 0, y: 100, scale: 0.58 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...emphaticSpring, delay: 1.22 }} style={{ transformOrigin: '350px 172px' }}>
          <path d="M 324 102 H 374 L 386 126 V 221 H 312 V 126 Z" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 324 102 L 344 126 H 386 M 344 126 V 221" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />
          <path d="M 351 151 C 336 165 337 187 351 195 C 365 187 366 165 351 151 Z" fill="hsl(var(--primary) / 0.16)" stroke="hsl(var(--primary))" strokeWidth="2" />
        </motion.g>

        <motion.g initial={{ opacity: 0, y: 95, scale: 0.45 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...emphaticSpring, delay: 1.43 }} style={{ transformOrigin: '420px 190px' }}>
          <path d="M 420 147 C 451 147 468 174 456 204 C 446 230 394 230 384 204 C 372 174 389 147 420 147 Z" fill="hsl(var(--primary))" />
          <path d="M 419 149 C 414 130 424 119 438 114" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round" />
          <path d="M 431 125 C 443 111 460 114 467 127 C 452 135 440 135 431 125 Z" fill="hsl(var(--primary) / 0.55)" />
        </motion.g>
      </svg>
    </div>
  );
}

function ProofVisual({ year, reduced }: { year: number; reduced: boolean }) {
  return (
    <div className="flex h-full items-center justify-center px-4" aria-hidden="true">
      <motion.div
        initial={reduced ? false : { opacity: 0, x: 110, rotate: 2, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
        transition={spring}
        className="relative w-full max-w-xl rounded-lg border border-border bg-card p-5 shadow-[0_24px_70px_-42px_hsl(var(--verify)/0.55)] sm:p-8"
      >
        <div className="flex items-start gap-3 sm:gap-5">
          <motion.div
            initial={reduced ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...emphaticSpring, delay: 0.22 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-verify text-verify-foreground sm:h-14 sm:w-14"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7">
              <path d="m6 12 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground sm:text-sm" style={{ letterSpacing: '0.08em' }}>Receipt received</p>
            <p className="mt-2 text-xl font-semibold leading-tight text-foreground sm:text-3xl">Your $10 became groceries</p>
            <div className="mt-4 flex min-h-8 items-center gap-2 text-sm text-muted-foreground sm:mt-6 sm:text-base">
              <span>Receipt record</span>
              <span aria-hidden="true">·</span>
              <span className="relative inline-flex h-7 min-w-12 items-center overflow-hidden font-semibold text-foreground">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={year}
                    initial={reduced ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 115, damping: 18, mass: 0.8 }}
                    className="absolute"
                  >
                    {year}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>
        </div>
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 1.65, rotate: -11 }}
          animate={{ opacity: 1, scale: 1, rotate: -5 }}
          transition={{ ...emphaticSpring, delay: 0.68, stiffness: 420, damping: 15 }}
          className="absolute -bottom-3 right-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-verify bg-card text-[10px] font-bold text-verify shadow-[0_8px_26px_-12px_hsl(var(--verify)/0.65)] sm:-bottom-6 sm:right-8 sm:h-24 sm:w-24 sm:text-sm"
          style={{ letterSpacing: '0.08em' }}
        >
          VERIFIED
        </motion.div>
      </motion.div>
    </div>
  );
}

function Climax({ visible }: { visible: boolean }) {
  return (
    <motion.div
      aria-live="polite"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24 }}
      transition={spring}
      className={`mx-auto max-w-5xl py-24 text-center md:py-36 ${visible ? '' : 'pointer-events-none'}`}
    >
      <p className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-6xl">
        Give $10 today. Check where it went in 2036.
      </p>
      <p className="mt-5 text-base text-muted-foreground sm:text-lg md:text-xl">
        Every donation keeps its receipt. <span className="font-semibold text-verify">Permanently verifiable.</span>
      </p>
    </motion.div>
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