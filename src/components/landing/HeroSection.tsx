import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

function useShouldRender3D() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isSmall = window.innerWidth < 768;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lowMem =
      typeof (navigator as any).deviceMemory === 'number' && (navigator as any).deviceMemory <= 4;
    const lowCpu =
      typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    // Skip WebGL entirely on small screens, reduced motion, or weak devices.
    if (isSmall || reduced || (lowMem && lowCpu)) {
      setReady(false);
      return;
    }
    // Defer mount until the browser is idle so it doesn't block first paint.
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(cb, { timeout: 800 })
        : window.setTimeout(cb, 300);
    idle(() => setReady(true));
  }, []);
  return ready;
}

function HeroFallback({ onActivate3D }: { onActivate3D?: () => void }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#BFD8E8] via-[#FFF2D8] to-[#D8E0CC]">
      {/* Soft sun */}
      <div className="pointer-events-none absolute top-10 right-10 h-24 w-24 rounded-full bg-[#FFE6B0] blur-2xl opacity-80" />

      {/* CSS-only stylised tree silhouette */}
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[min(520px,90%)] h-auto"
        viewBox="0 0 200 220"
        aria-hidden="true"
      >
        {/* Ground */}
        <ellipse cx="100" cy="210" rx="120" ry="14" fill="#9BB67E" opacity="0.55" />
        {/* Trunk */}
        <path
          d="M95 210 C 94 170, 96 140, 100 110 C 104 140, 106 170, 105 210 Z"
          fill="#6B4423"
        />
        {/* Canopy */}
        <circle cx="100" cy="80" r="55" fill="#3F8A3E" />
        <circle cx="70" cy="95" r="38" fill="#5FA046" />
        <circle cx="130" cy="92" r="40" fill="#558B2F" />
        <circle cx="100" cy="55" r="32" fill="#7CB342" />
        {/* Fruits (coupons) */}
        <circle cx="78" cy="85" r="5" fill="#D4A017" />
        <circle cx="120" cy="78" r="5" fill="#D4A017" />
        <circle cx="100" cy="105" r="5" fill="#D4A017" />
      </svg>

      {/* Foreground text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F3D2A] drop-shadow-sm">
          Every donation grows new life.
        </h1>
        <p className="mt-3 max-w-md text-sm sm:text-base text-[#1F3D2A]/80">
          Turn your generosity into grocery coupons for verified families in need.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            to="/donate"
            className="rounded-full bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#059669] active:scale-[0.98] transition"
          >
            Donate now
          </Link>
          <Link
            to="/stories"
            className="rounded-full bg-white/80 backdrop-blur px-6 py-2.5 text-sm font-semibold text-[#1F3D2A] shadow-sm hover:bg-white transition"
          >
            See stories
          </Link>
        </div>
        {onActivate3D && (
          <button
            type="button"
            onClick={onActivate3D}
            className="mt-4 text-xs text-[#1F3D2A]/70 underline underline-offset-4"
          >
            Play the interactive tree
          </button>
        )}
      </div>
    </div>
  );
}

export function HeroSection() {
  const auto3D = useShouldRender3D();
  const [forced3D, setForced3D] = useState(false);
  const show3D = auto3D || forced3D;

  return (
    <section className="relative w-full h-[60vh] md:h-[88vh] overflow-hidden">
      <div className="absolute inset-0">
        {show3D ? (
          <Suspense fallback={<HeroFallback />}>
            <Tree3DScene />
          </Suspense>
        ) : (
          <HeroFallback onActivate3D={() => setForced3D(true)} />
        )}
      </div>
    </section>
  );
}
