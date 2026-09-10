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
      className="relative w-full h-[58svh] md:h-[74vh] overflow-hidden"
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
