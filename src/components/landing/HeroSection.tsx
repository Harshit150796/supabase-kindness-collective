import { lazy, Suspense, useEffect } from 'react';
import { warmTreeTextures } from '@/components/landing/tree3d/textures';

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

export function HeroSection() {
  // Start building the heavy procedural textures during the gradient fallback,
  // so by the time the WebGL canvas mounts (especially after the mobile
  // idle-defer) the bark/ground/leaf canvases are already cached. Avoids a
  // ~500ms main-thread freeze on mid-range Android.
  useEffect(() => {
    warmTreeTextures();
  }, []);

  return (
    <section className="relative w-full h-[60vh] md:h-[88vh] overflow-hidden">
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="w-full h-full bg-gradient-to-b from-[#BFD8E8] via-[#FFF2D8] to-[#D8E0CC]" />
          }
        >
          <Tree3DScene />
        </Suspense>
      </div>
    </section>
  );
}
