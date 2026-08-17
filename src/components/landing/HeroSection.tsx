import { useState } from 'react';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { TopDonorsPanel } from '@/components/landing/hero/TopDonorsPanel';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
import { AITreeChat } from '@/components/landing/hero/AITreeChat';
import { Tree3DErrorBoundary } from '@/components/landing/Tree3DErrorBoundary';
import { Tree3DScene } from '@/components/landing/Tree3DScene';

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

export function HeroSection() {
  const [chatOpen, setChatOpen] = useState(false);
  // Mount the 3D canvas on the first client render — only gated by WebGL/bot capability.
  const [can3D] = useState(() => canRender3D());

  return (
    <section
      className="relative w-full -mt-16 sm:-mt-[72px] h-[calc(58svh+64px)] md:h-[calc(74vh+72px)] overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      {/* Stacked layers — no DOM swap, no CLS. The gradient always paints first;
          the canvas wrapper sits on top immediately once WebGL capability is known. */}
      <GradientFallback />
      <div className="absolute inset-0 w-full h-full">
        {can3D && (
          <Tree3DErrorBoundary>
            <Tree3DScene />
          </Tree3DErrorBoundary>
        )}
      </div>


      {/* Overlay layer — offset below the transparent masthead, pointer-events
          isolated so the 3D scene stays interactive */}
      <div className="absolute inset-x-0 bottom-0 top-16 sm:top-[72px] pointer-events-none">

        <HeroHeadline />
        <TopDonorsPanel />
        <AITreeLauncher onClick={() => setChatOpen(true)} hidden={chatOpen} />
        <AITreeChat open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </section>
  );
}
