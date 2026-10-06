import { animate, motion, useInView, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/lib/utils';
import { figureDisplay } from '@/lib/landingPresentation';

type RevealProps = { children: ReactNode; className?: string; delay?: number };

/** Pre-trigger below the viewport; a fling past the trigger finishes immediately. */
export function useEarlyReveal<T extends HTMLElement>(ref: React.RefObject<T>) {
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let triggered = false;
    let done = false;
    let frame = 0;
    let lastY = window.scrollY;
    const check = () => {
      frame = 0;
      if (done) return;
      const rect = node.getBoundingClientRect();
      const height = window.innerHeight;
      const fling = Math.abs(window.scrollY - lastY) > height * 0.35;
      lastY = window.scrollY;
      if (rect.top <= height * 1.2) {
        // Late mounting and flings must not leave visible content waiting on a fade.
        if (rect.top <= height * 0.8 || (fling && rect.top < height)) {
          setInstant(true); done = true;
        }
        if (!triggered) { triggered = true; setVisible(true); }
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    const observer = new IntersectionObserver(check, { rootMargin: `0px 0px ${Math.round(window.innerHeight * 0.2)}px 0px`, threshold: 0 });
    observer.observe(node);
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, [ref]);
  return { visible, instant };
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { visible, instant } = useEarlyReveal(ref);
  const preference = useMotionPreference();
  const gentle = preference === 'gentle';
  return <motion.div ref={ref} data-reveal className={className}
    initial={gentle ? { opacity: 0.7 } : { opacity: 0, y: 24 }}
    animate={visible || gentle ? { opacity: 1, y: 0 } : undefined}
    transition={{ duration: instant ? 0 : gentle ? 0.18 : 0.6, delay: gentle || instant ? 0 : Math.min(delay, 0.08), ease: [0.16, 1, 0.3, 1] }}>
    {children}
  </motion.div>;
}

export function LineReveal({ children, className, delay = 0 }: RevealProps) {
  return <Reveal className={className} delay={delay}>{children}</Reveal>;
}

export function ImageReveal({ children, className, delay = 0 }: RevealProps) {
  return <Reveal className={cn('overflow-hidden', className)} delay={delay}>{children}</Reveal>;
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
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
  return <span ref={ref} className={className}>{figureDisplay(value, display, false, visible).toLocaleString()}</span>;
}

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
  return <motion.div className={className} initial={preference === 'gentle' ? { scaleX: Math.max(0, Math.min(value, 100)) / 100 } : { scaleX: 0, opacity: 1 }} whileInView={{ scaleX: Math.max(0, Math.min(value, 100)) / 100, opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: preference === 'full' ? 0.4 : 0, ease: [0.16, 1, 0.3, 1] }} style={{ transformOrigin: 'left' }} />;
}