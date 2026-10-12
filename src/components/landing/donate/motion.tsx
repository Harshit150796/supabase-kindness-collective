import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usd } from './retailers';
import { SOFT_SPRING, SPRING } from './tokens';

/** A dollar amount that rolls to its new value instead of jumping. */
export function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => usd.format(Math.round(v)));
  useEffect(() => {
    const controls = animate(mv, value, SOFT_SPRING);
    return () => controls.stop();
  }, [mv, value]);
  return (
    <span className={className}>
      <span className="sr-only">{usd.format(value)}</span>
      <motion.span aria-hidden="true">{text}</motion.span>
    </span>
  );
}

/**
 * Animates its own height as the content inside changes, so step changes never jolt the page.
 * The 8px bleed keeps focus rings and selection rings inside the clipped area.
 */
export function AnimatedHeight({ children, className }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  useLayoutEffect(() => {
    const node = inner.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <motion.div className={cn('-m-2', className)} style={{ overflow: 'hidden' }} initial={false} animate={{ height }} transition={SPRING}>
      <div ref={inner} className="p-2">{children}</div>
    </motion.div>
  );
}
