import { animate, motion, useInView, useScroll, useTransform } from 'motion/react';
import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/lib/utils';
import { figureDisplay, revealMode } from '@/lib/landingPresentation';

type RevealProps = { children: ReactNode; className?: string; delay?: number };

/**
 * Pre-trigger 20% below the viewport so motion plays as content arrives.
 * Content that mounts already on screen (late data, lazy chunks) still plays a
 * shorter fade-and-rise instead of snapping in. Only content already scrolled
 * completely past finishes instantly.
 */
export function useEarlyReveal<T extends HTMLElement>(ref: React.RefObject<T>) {
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);
  const [late, setLate] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let done = false;
    let frame = 0;
    const check = () => {
      frame = 0;
      if (done) return;
      const rect = node.getBoundingClientRect();
      const height = window.innerHeight;
      if (rect.width === 0 && rect.height === 0) return; // hidden (display:none) variants
      const mode = revealMode(rect.top, rect.bottom, height, 0);
      if (mode === 'wait') return;
      done = true;
      node.dataset.revealMode = mode;
      if (mode === 'instant') setInstant(true);
      else if (mode === 'late') setLate(true);
      setVisible(true);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    const observer = new IntersectionObserver(() => check(), { rootMargin: `0px 0px ${Math.round(window.innerHeight * 0.2)}px 0px`, threshold: 0 });
    observer.observe(node);
    window.addEventListener('scroll', onScroll, { passive: true });
    frame = requestAnimationFrame(check);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, [ref]);
  return { visible, instant, late };
}

function assignRef<T>(target: React.ForwardedRef<T>, value: T | null) {
  if (typeof target === 'function') target(value);
  else if (target) target.current = value;
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal({ children, className, delay = 0 }, forwarded) {
  const ref = useRef<HTMLDivElement>(null);
  const { visible, instant, late } = useEarlyReveal(ref);
  const setRef = useCallback((node: HTMLDivElement | null) => { ref.current = node; assignRef(forwarded, node); }, [forwarded]);
  return <motion.div ref={setRef} data-reveal className={className}
    initial={{ opacity: 0, y: 24 }}
    animate={visible ? { opacity: 1, y: 0 } : undefined}
    transition={{ duration: instant ? 0 : late ? 0.45 : 0.6, delay: instant || late ? 0 : Math.min(delay, 0.08), ease: [0.16, 1, 0.3, 1] }}>
    {children}
  </motion.div>;
});

export const LineReveal = forwardRef<HTMLDivElement, RevealProps>(function LineReveal(props, ref) {
  return <Reveal ref={ref} {...props} />;
});

export function ImageReveal({ children, className, delay = 0 }: RevealProps) {
  return <Reveal className={cn('overflow-hidden', className)} delay={delay}>{children}</Reveal>;
}

export const CountUp = forwardRef<HTMLSpanElement, { value: number; className?: string; formatter?: (value: number) => string }>(function CountUp({ value, className, formatter }, forwarded) {
  const ref = useRef<HTMLSpanElement>(null);
  const setRef = useCallback((node: HTMLSpanElement | null) => { ref.current = node; assignRef(forwarded, node); }, [forwarded]);
  const visible = useInView(ref, { once: true, amount: 0.5 });
  const preference = useMotionPreference();
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (value < 10) { setDisplay(value); return; }
    if (!visible) return;
    const controls = animate(value > 0 ? 1 : 0, value, {
      duration: preference === 'full' ? 1.6 : 0.7,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [preference, value, visible]);
  const shown = figureDisplay(value, display, false, visible);
  return <span ref={setRef} className={className}>{formatter ? formatter(shown) : shown.toLocaleString()}</span>;
});

export function Parallax({ children, className, distance = 70 }: RevealProps & { distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const preference = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], preference === 'full' ? [-distance, distance] : [0, 0]);
  return <div ref={ref} className={cn('overflow-hidden', className)}><motion.div style={{ y }} className="h-full w-full">{children}</motion.div></div>;
}

export function WordReveal({ children, className }: { children: string; className?: string }) {
  return <Reveal className={className}><p>{children}</p></Reveal>;
}

export function MotionBar({ value, className }: { value: number; className?: string }) {
  const preference = useMotionPreference();
  return <motion.div className={className} initial={preference === 'gentle' ? { scaleX: Math.max(0, Math.min(value, 100)) / 100 } : { scaleX: 0, opacity: 1 }} whileInView={{ scaleX: Math.max(0, Math.min(value, 100)) / 100, opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: preference === 'full' ? 0.8 : 0, ease: [0.16, 1, 0.3, 1] }} style={{ transformOrigin: 'left' }} />;
}