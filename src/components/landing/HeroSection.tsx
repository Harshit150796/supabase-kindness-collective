import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { TopDonorsPanel } from '@/components/landing/hero/TopDonorsPanel';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
import { AITreeChat } from '@/components/landing/hero/AITreeChat';
import { Tree3DErrorBoundary } from '@/components/landing/Tree3DErrorBoundary';

// The whole 3D stack (three, fiber, drei, three-stdlib) lives in its own chunk,
// streamed in behind the gradient instead of blocking the main entry bundle.
const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

const BOT_UA_RE = /(bot|crawler|spider|crawling|Googlebot|bingbot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|Discordbot|HeadlessChrome|Lighthouse|PageSpeed)/i;

function canRender3D(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    if (BOT_UA_RE.test(navigator.userAgent || '')) return false;
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    return !!gl;
  } catch {
    return false;
  }
}

const GradientFallback = () => (
  <div
    aria-hidden
    className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#BFD8E8] via-[#CFE6F5] to-[#E8F1E0]"
  />
);

/**
 * Fades the 3D canvas up once its first frame has painted, so the scene
 * resolves into view over the gradient instead of snapping in.
 * Reduced-motion users get it immediately at full opacity.
 */
function CanvasFade({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (visible) return;
    let raf1 = 0;
    let raf2 = 0;
    // Two frames: the first mounts the WebGL canvas, the second is its first paint.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [visible]);

  return (
    <div
      ref={ref}
      className="absolute inset-0 w-full h-full motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

export function HeroSection() {
  const [chatOpen, setChatOpen] = useState(false);
  // Mount the 3D canvas on the first client render — only gated by WebGL/bot capability.
  const [can3D] = useState(() => canRender3D());

  return (
    <section
      className="relative w-full h-[58svh] md:h-[74vh] overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      {/* Stacked layers — no DOM swap, no CLS. The gradient always paints first and
          stays underneath permanently, so there is never a transparent gap. */}
      <GradientFallback />
      {can3D && (
        <Suspense fallback={<GradientFallback />}>
          <Tree3DErrorBoundary>
            <CanvasFade>
              <Tree3DScene />
            </CanvasFade>
          </Tree3DErrorBoundary>
        </Suspense>
      )}

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
