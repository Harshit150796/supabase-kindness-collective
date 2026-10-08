import { type ImgHTMLAttributes } from 'react';
import { photoUrl, responsivePhoto } from '@/lib/responsivePhotos';

export function ResponsivePhoto({ src, sizes, width = 1200, height = 800, loading = 'lazy', ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  return <picture className="contents"><source media="(max-width: 767px)" srcSet={`${photoUrl(src, 400)} 400w, ${photoUrl(src, 800)} 800w`} sizes={sizes ?? 'calc(100vw - 2rem)'} /><img {...responsivePhoto(src, sizes)} width={width} height={height} loading={loading} decoding="async" {...props} /></picture>;
}