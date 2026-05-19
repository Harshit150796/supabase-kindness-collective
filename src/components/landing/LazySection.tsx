import { ReactNode, Suspense, useEffect, useRef, useState } from 'react';

interface Props {
  /** Min height reserved while not yet visible — prevents CLS. */
  minHeight?: number | string;
  /** Pixels of rootMargin so the chunk starts loading before it scrolls in. */
  rootMargin?: string;
  children: ReactNode;
}

/**
 * Mounts its children only once they (or their placeholder) scroll near the viewport.
 * Combined with React.lazy + Suspense this defers both the JS chunk and the render cost
 * of heavy below-the-fold landing sections.
 */
export function LazySection({ minHeight = 400, rootMargin = '300px 0px', children }: Props) {
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
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: show ? undefined : minHeight }}>
      {show ? <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense> : null}
    </div>
  );
}
