import { lazy, Suspense, useEffect, useState } from 'react';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { TopDonorsPanel } from '@/components/landing/hero/TopDonorsPanel';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
import { AITreeChat } from '@/components/landing/hero/AITreeChat';
import { Tree3DErrorBoundary } from '@/components/landing/Tree3DErrorBoundary';

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

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

const GradientFallback = () => (
  <div
    aria-hidden
    className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#BFD8E8] via-[#CFE6F5] to-[#E8F1E0]"
  />
);

export function HeroSection() {
  const [chatOpen, setChatOpen] = useState(false);
  // Mount the 3D canvas immediately — only gated by WebGL/bot capability,
  // which can't be evaluated during SSR/first render, so it's set on mount.
  const [can3D, setCan3D] = useState(false);

  useEffect(() => {
    if (canRender3D()) setCan3D(true);
  }, []);

  return (
    <section
      className="relative w-full h-[58svh] md:h-[74vh] overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      {/* Stacked layers — no DOM swap, no CLS. The gradient always paints first;
          the canvas wrapper sits on top and fades in once Tree3DScene is mounted. */}
      <GradientFallback />
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-500"
        style={{ opacity: can3D ? 1 : 0 }}
      >
        {can3D && (
          <Tree3DErrorBoundary>
            <Suspense fallback={null}>
              <Tree3DScene />
            </Suspense>
          </Tree3DErrorBoundary>
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
