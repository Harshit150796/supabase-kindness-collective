import { lazy, Suspense, useEffect, useState } from 'react';
import desktopPoster from '@/assets/tree-poster-desktop.webp';
import mobilePoster from '@/assets/tree-poster-mobile.webp';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
const AITreeChat = lazy(() => import('@/components/landing/hero/AITreeChat').then(m => ({ default: m.AITreeChat })));
import { Tree3DErrorBoundary } from '@/components/landing/Tree3DErrorBoundary';
import { allowLiveTree } from '@/lib/treeQuality';
import { announceTreeReady } from '@/lib/treeReady';
const Tree3DScene = lazy(() => import('@/components/landing/Tree3DScene'));

const BOT_UA_RE = /(bot|crawler|spider|crawling|Googlebot|bingbot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|Discordbot|HeadlessChrome|Lighthouse|PageSpeed)/i;

function canRender3D(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const qaOverride = new URLSearchParams(window.location.search).get('treeqa') === '1';
    if (!qaOverride && BOT_UA_RE.test(navigator.userAgent || '')) return false;
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

export function HeroSection() {
  const [chatOpen, setChatOpen] = useState(false);
  const [treeReady, setTreeReady] = useState(false);
  // Poster-first for everyone. Only an explicit data-saving choice keeps it static.
  const [can3D, setCan3D] = useState(false);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    let secondFrame = 0;
    const mount = () => {
      const allowed = allowLiveTree(connection?.saveData) && canRender3D();
      setCan3D(allowed);
      if (!allowed) announceTreeReady();
    };
    const firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(mount); });
    connection?.addEventListener?.('change', mount);
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); connection?.removeEventListener?.('change', mount); };
  }, []);

  return (
    <section
      className="hero-stage relative w-full h-[58svh] min-h-[330px] md:h-[74vh] [@media(max-height:500px)]:h-[calc(100svh-64px)] [@media(max-height:500px)]:min-h-[300px] [@media(max-height:500px)]:max-h-[480px] overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      {/* Stacked layers — no DOM swap, no CLS. The gradient always paints first;
          the canvas wrapper sits on top immediately once WebGL capability is known. */}
      <picture
        data-tree-poster
        className={`absolute inset-0 transition-opacity duration-500 ${treeReady ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <source media="(max-width: 767px)" srcSet={mobilePoster} />
        <img
          src={desktopPoster}
          width={2880} height={828}
          alt="The CouponDonation tree, growing familiar retailer logos"
          className="h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="absolute inset-0 w-full h-full">
        {can3D && (
          <Tree3DErrorBoundary>
            <Suspense fallback={null}><Tree3DScene onReady={() => setTreeReady(true)} /></Suspense>
          </Tree3DErrorBoundary>
        )}
      </div>


      {/* Overlay layer — pointer-events isolated so 3D scene stays interactive */}
      <div className="absolute inset-0 pointer-events-none">
        <HeroHeadline />
        <AITreeLauncher onClick={() => setChatOpen(true)} hidden={chatOpen} />
        {chatOpen && <Suspense fallback={null}><AITreeChat open={chatOpen} onClose={() => setChatOpen(false)} /></Suspense>}
      </div>
    </section>
  );
}
