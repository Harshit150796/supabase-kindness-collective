import { lazy, Suspense, useEffect, useState } from 'react';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { TopDonorsPanel } from '@/components/landing/hero/TopDonorsPanel';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
import { AITreeChat } from '@/components/landing/hero/AITreeChat';

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

const GradientFallback = () => (
  <div className="w-full h-full bg-gradient-to-b from-[#BFD8E8] via-[#CFE6F5] to-[#E8F1E0]" />
);

export function HeroSection() {
  const [chatOpen, setChatOpen] = useState(false);
  // Defer the 3D canvas until the browser is idle so the rest of the page
  // (fonts, hero overlays, lazy chunks) can finish without competing with
  // Three.js + GLB parsing on the main thread.
  const [treeReady, setTreeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(() => !cancelled && setTreeReady(true), { timeout: 1800 });
      } else {
        setTimeout(() => !cancelled && setTreeReady(true), 1500);
      }
    };
    if (document.readyState === 'complete') {
      start();
    } else {
      window.addEventListener('load', start, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
    };
  }, []);

  return (
    <section className="relative w-full h-[62svh] md:h-[88vh] overflow-hidden">
      <div className="absolute inset-0">
        {treeReady ? (
          <Suspense fallback={<GradientFallback />}>
            <div className="w-full h-full animate-in fade-in duration-700">
              <Tree3DScene />
            </div>
          </Suspense>
        ) : (
          <GradientFallback />
        )}
      </div>

      {/* Overlay layer — pointer-events isolated so 3D scene stays interactive */}
      <div className="absolute inset-0 pointer-events-none">
        <HeroHeadline />
        <TopDonorsPanel />
        <AITreeLauncher onClick={() => setChatOpen(true)} hidden={chatOpen} />
        <AITreeChat open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </section>
  );
}
