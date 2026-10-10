import { useEffect, useRef } from 'react';
import desktopPoster from '@/assets/tree-poster-desktop.webp';
import mobilePoster from '@/assets/tree-poster-mobile.webp';

export default function TreePoster({ ready, onLoaded }: { ready: boolean; onLoaded?: () => void }) {
  const img = useRef<HTMLImageElement>(null);
  const loaded = useRef(onLoaded);
  loaded.current = onLoaded;
  useEffect(() => {
    const el = img.current;
    if (!el) return;
    const done = () => { el.decode().catch(() => undefined).then(() => loaded.current?.()); };
    if (el.complete && el.naturalWidth) done();
    else el.addEventListener('load', done, { once: true });
    return () => el.removeEventListener('load', done);
  }, []);
  return <picture data-tree-poster className={`absolute inset-0 transition-opacity duration-500 ${ready ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
    <source media="(max-width: 767px)" srcSet={mobilePoster} />
    <img ref={img} src={desktopPoster} width={2880} height={828} alt="The CouponDonation tree, growing familiar retailer logos" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
  </picture>;
}
