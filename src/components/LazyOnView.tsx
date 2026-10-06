import { Suspense, useLayoutEffect, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Minimum height reserved before children render — prevents layout shift. */
  minHeight?: number | string;
  intrinsicSize?: { mobile: number; tablet: number; desktop: number };
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
  intrinsicSize,
  rootMargin = '300px',
  className,
  contentVisibilityAuto = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

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
  const intrinsic = intrinsicSize ? 'var(--lazy-reserved-height)' : typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  if (intrinsicSize) {
    style['--lazy-mobile'] = `${intrinsicSize.mobile}px`;
    style['--lazy-tablet'] = `${intrinsicSize.tablet}px`;
    style['--lazy-desktop'] = `${intrinsicSize.desktop}px`;
  }
  if (!mounted) style.minHeight = intrinsic;
  if (contentVisibilityAuto) {
    style.contentVisibility = 'auto';
    style.containIntrinsicSize = `auto ${intrinsic}`;
  }

  return (
    <div ref={ref} className={[intrinsicSize ? "lazy-responsive-region" : "", className].filter(Boolean).join(" ")} style={style}>
      {show ? <Suspense fallback={<div aria-hidden="true" style={{ height: intrinsic }} />}><MountSignal onMount={() => setMounted(true)}>{children}</MountSignal></Suspense> : null}
    </div>
  );
}

/** Fires only after the lazily loaded children actually commit to the DOM. */
function MountSignal({ children, onMount }: { children: ReactNode; onMount: () => void }) {
  useLayoutEffect(() => { onMount(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{children}</>;
}
