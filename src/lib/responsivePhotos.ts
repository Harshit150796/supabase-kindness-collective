/** Only known managed image hosts accept transform parameters. */
export function photoUrl(source: string, width: number): string {
  if (source.includes('/storage/v1/object/public/') || source.includes('/storage/v1/render/image/public/')) {
    const url = new URL(source);
    url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    url.searchParams.set('width', String(width)); url.searchParams.set('quality', '70'); url.searchParams.set('resize', 'cover');
    return url.toString();
  }
  try {
    const url = new URL(source);
    if (['images.unsplash.com', 'images.pexels.com'].includes(url.hostname)) {
      url.searchParams.set('w', String(width)); url.searchParams.set('q', '70'); url.searchParams.set('auto', 'format');
      return url.toString();
    }
  } catch { /* Local images require pre-generated variants. */ }
  if (source.startsWith('/featured/')) return `/image-variants/${source.split('/').pop()?.replace(/\.[^.]+$/, '')}-${width <= 400 ? 400 : width <= 800 ? 800 : 1200}.webp`;
  return source;
}

export function responsivePhoto(source: string, sizes = '(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) 46vw, 32vw') {
  const widths = [400, 800, 1200];
  return { src: photoUrl(source, 800), srcSet: widths.map(width => `${photoUrl(source, width)} ${width}w`).join(', '), sizes };
}