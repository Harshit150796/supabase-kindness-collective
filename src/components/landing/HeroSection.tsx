import { lazy, Suspense } from 'react';

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

export function HeroSection() {
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
