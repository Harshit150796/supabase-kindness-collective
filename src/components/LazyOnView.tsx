import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Minimum height reserved before children render — prevents layout shift. */
  minHeight?: number | string;
  /** rootMargin for the IntersectionObserver. */
  rootMargin?: string;
  /** Optional className passed to the wrapper. */
  className?: string;
}

/**
 * Renders children only after the placeholder enters (or nears) the viewport.
 * Used to defer below-the-fold landing sections so their JS chunks aren't
 * fetched or hydrated until the user scrolls toward them.
 */
export function LazyOnView({ children, minHeight = 400, rootMargin = '300px', className }: Props) {
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

  return (
    <div ref={ref} className={className} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
