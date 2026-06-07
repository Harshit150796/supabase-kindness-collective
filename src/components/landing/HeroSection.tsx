import { lazy, Suspense, useState } from 'react';
import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { TopDonorsPanel } from '@/components/landing/hero/TopDonorsPanel';
import { AITreeLauncher } from '@/components/landing/hero/AITreeLauncher';
import { AITreeChat } from '@/components/landing/hero/AITreeChat';

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

export function HeroSection() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <section className="relative w-full h-[62vh] md:h-[88vh] overflow-hidden">
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="w-full h-full bg-gradient-to-b from-[#BFD8E8] via-[#CFE6F5] to-[#E8F1E0]" />
          }
        >
          <Tree3DScene />
        </Suspense>
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
