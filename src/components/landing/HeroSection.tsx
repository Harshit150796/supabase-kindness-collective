import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
import { HeroBackdrop } from '@/components/landing/hero/HeroBackdrop';
import { HeroStarTree } from '@/components/landing/hero/HeroStarTree';
const AITreeChat = lazy(() => import('@/components/landing/hero/AITreeChat').then(m => ({ default: m.AITreeChat })));
import { Tree3DErrorBoundary } from '@/components/landing/Tree3DErrorBoundary';
import { announceTreeReady } from '@/lib/treeReady';
import { MotionPauseButton } from '@/components/MotionPauseButton';
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
    // Release the probe at once: an unreleased context holds GPU memory next to the tree's own.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

/** The homepage opening has already checked WebGL (index.html); elsewhere it is still unknown. */
const knownWebGL = () => (typeof window !== 'undefined' && document.documentElement.classList.contains('cd-intro') ? window.__cdWebGL : undefined);

type TreeMode = 'checking' | 'live' | 'fallback';

export function HeroSection() {
  const [chatOpen, setChatOpen] = useState(false);
  const [mode, setMode] = useState<TreeMode>(() => {
    const known = knownWebGL();
    return known === undefined ? 'checking' : known ? 'live' : 'fallback';
  });
  // Content first (founder decision, Nov 10, 2026, from the Duck.Design audit): the tree's own sky and
  // ground (HeroBackdrop), the headline and the buttons show as soon as the opening lifts; the tree fades
  // in over them once it has drawn. Visitors no longer wait for the 3D model to see the page.
  const [scene, setScene] = useState(false);
  const [treeFaded, setTreeFaded] = useState(false);
  const [shown, setShown] = useState(false);
  const fallback = useCallback(() => { setMode('fallback'); announceTreeReady(); }, []);
  useEffect(() => {
    if (mode === 'fallback') announceTreeReady();
    if (mode !== 'checking') return;
    // Arriving from another page: check after the first paint, as before.
    let secondFrame = 0;
    const check = () => { if (canRender3D()) setMode('live'); else fallback(); };
    const firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(check); });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [mode, fallback]);
  // The headline and buttons come as the opening lifts (or at once, arriving from another page).
  useEffect(() => {
    if (shown) return;
    const show = () => setShown(true);
    const root = document.documentElement;
    if (root.classList.contains('cd-intro') && !root.classList.contains('cd-iris')) {
      window.addEventListener('cd:intro-iris', show, { once: true });
      window.addEventListener('cd:intro-end', show, { once: true });
      return () => { window.removeEventListener('cd:intro-iris', show); window.removeEventListener('cd:intro-end', show); };
    }
    const frame = requestAnimationFrame(show);
    return () => cancelAnimationFrame(frame);
  }, [shown]);
  // Once the tree has faded in over it (0.7s), the painted backdrop underneath is no longer needed.
  useEffect(() => {
    if (!scene) return;
    const timer = window.setTimeout(() => setTreeFaded(true), 1200);
    return () => window.clearTimeout(timer);
  }, [scene]);
  const visible = shown || mode === 'fallback';

  return (
    <section
      data-sky-backdrop
      data-scene={mode !== 'checking' || scene || undefined}
      data-tree-shown={scene || undefined}
      className="hero-stage relative w-full h-[58svh] min-h-[330px] md:h-[74vh] [@media(max-height:500px)]:h-[calc(100svh-64px)] [@media(max-height:500px)]:min-h-[300px] [@media(max-height:500px)]:max-h-[480px] overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      <div className="hero-tree absolute inset-0 w-full h-full">
        {/* The tree's own sky and ground: in place of the tree where it can't run, and under it until it has faded in. */}
        {(mode === 'fallback' || (mode === 'live' && !treeFaded)) && <HeroBackdrop />}
        {mode === 'live' && (
          <Tree3DErrorBoundary onError={fallback}>
            <Suspense fallback={null}><Tree3DScene onReady={() => { setScene(true); setShown(true); }} /></Suspense>
          </Tree3DErrorBoundary>
        )}
      </div>


      {/* Overlay layer — pointer-events isolated so 3D scene stays interactive */}
      <div data-hero-overlay className="absolute inset-0 pointer-events-none transition-opacity duration-700" style={{ opacity: visible ? 1 : 0 }}>
        <HeroStarTree play={visible} />
        <HeroHeadline play={visible} />
        <AITreeLauncher onClick={() => setChatOpen(true)} hidden={chatOpen} />
        <MotionPauseButton className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-[max(12px,env(safe-area-inset-left))] z-30 md:bottom-4 md:left-4" />
        {chatOpen && <Suspense fallback={null}><AITreeChat open={chatOpen} onClose={() => setChatOpen(false)} /></Suspense>}
      </div>
    </section>
  );
}
