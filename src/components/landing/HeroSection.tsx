import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
import { HeroBackdrop } from '@/components/landing/hero/HeroBackdrop';
const AITreeChat = lazy(() => import('@/components/landing/hero/AITreeChat').then(m => ({ default: m.AITreeChat })));
import { Tree3DErrorBoundary } from '@/components/landing/Tree3DErrorBoundary';
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
  // The headline and buttons arrive together with the tree, so the hero is never a part-built scene.
  const [scene, setScene] = useState(false);
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
  // If the tree is slow once nothing covers the hero, the buttons still come within three seconds.
  useEffect(() => {
    if (shown) return;
    let timer = 0;
    const wait = () => { timer = window.setTimeout(() => setShown(true), 3000); };
    const root = document.documentElement;
    if (root.classList.contains('cd-intro')) window.addEventListener('cd:intro-end', wait, { once: true });
    else wait();
    return () => { window.removeEventListener('cd:intro-end', wait); window.clearTimeout(timer); };
  }, [shown]);
  const visible = shown || mode === 'fallback';

  return (
    <section
      data-sky-backdrop
      data-scene={scene || mode === 'fallback' || undefined}
      className="hero-stage relative w-full h-[58svh] min-h-[330px] md:h-[74vh] [@media(max-height:500px)]:h-[calc(100svh-64px)] [@media(max-height:500px)]:min-h-[300px] [@media(max-height:500px)]:max-h-[480px] overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      <div className="hero-tree absolute inset-0 w-full h-full">
        {/* Only where the tree can't run: its own sky and ground, painted once. */}
        {mode === 'fallback' && <HeroBackdrop />}
        {mode === 'live' && (
          <Tree3DErrorBoundary onError={fallback}>
            <Suspense fallback={null}><Tree3DScene onReady={() => { setScene(true); setShown(true); }} /></Suspense>
          </Tree3DErrorBoundary>
        )}
      </div>


      {/* Overlay layer — pointer-events isolated so 3D scene stays interactive */}
      <div data-hero-overlay className="absolute inset-0 pointer-events-none transition-opacity duration-700" style={{ opacity: visible ? 1 : 0 }}>
        <HeroHeadline />
        <AITreeLauncher onClick={() => setChatOpen(true)} hidden={chatOpen} />
        {chatOpen && <Suspense fallback={null}><AITreeChat open={chatOpen} onClose={() => setChatOpen(false)} /></Suspense>}
      </div>
    </section>
  );
}
