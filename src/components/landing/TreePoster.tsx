import desktopPoster from '@/assets/tree-poster-desktop.webp';
import mobilePoster from '@/assets/tree-poster-mobile.webp';

export default function TreePoster({ ready }: { ready: boolean }) {
  return <picture data-tree-poster className={`absolute inset-0 transition-opacity duration-500 ${ready ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
    <source media="(max-width: 767px)" srcSet={mobilePoster} />
    <img src={desktopPoster} width={2880} height={828} alt="The CouponDonation tree, growing familiar retailer logos" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
  </picture>;
}