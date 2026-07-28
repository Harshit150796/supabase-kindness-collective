import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  children: ReactNode;
  /** Minimum height reserved before children render — prevents layout shift. */
  minHeight?: number | string;
  /**
   * Height reserved on phones. Sections stack vertically on mobile and are
   * usually far taller than on desktop, so reusing the desktop number makes the
   * page jump when the real content swaps in. Falls back to `minHeight`.
   */
  mobileMinHeight?: number | string;
  /** rootMargin for the IntersectionObserver. */
  rootMargin?: string;
  /** Optional className passed to the wrapper. */
  className?: string;
  /**
   * Opt into CSS `content-visibility: auto` with `contain-intrinsic-size` so
   * the browser skips layout/paint while the section is off-screen — large
   * win on mobile for long landing pages.
   */
  contentVisibilityAuto?: boolean;
}

/**
 * Renders children only after the placeholder enters (or nears) the viewport.
 * Used to defer below-the-fold landing sections so their JS chunks aren't
 * fetched or hydrated until the user scrolls toward them.
 */
export function LazyOnView({
  children,
  minHeight = 400,
  mobileMinHeight,
  rootMargin = '300px',
  className,
  contentVisibilityAuto = false,
}: Props) {
  const isMobile = useIsMobile();
  const reserved = isMobile && mobileMinHeight !== undefined ? mobileMinHeight : minHeight;

  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [show, rootMargin]);

  const style: CSSProperties & Record<string, string | number> = {};
  if (!show) style.minHeight = reserved;
  if (contentVisibilityAuto) {
    style.contentVisibility = 'auto';
    const intrinsic = typeof reserved === 'number' ? `${reserved}px` : reserved;
    // `auto` lets the browser remember the real rendered size after the
    // first paint, so the reserved estimate only matters once.
    style.containIntrinsicSize = `auto ${intrinsic}`;
  }


  return (
    <div ref={ref} className={className} style={style}>
      {show ? children : null}
    </div>
  );
}
