import { animate, motion, useInView, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/lib/utils';

type RevealProps = { children: ReactNode; className?: string; delay?: number };

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.1 });
  const preference = useMotionPreference();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={preference === 'gentle' ? false : { opacity: 0.85, y: 16 }}
      animate={visible || preference === 'gentle' ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: preference === 'full' ? 0.35 : 0, delay: Math.min(delay, 0.08), ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LineReveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.1 });
  const preference = useMotionPreference();
  return (
    <div ref={ref} className={cn(preference === 'full' && 'overflow-hidden', className)}>
      <motion.div
        initial={preference === 'gentle' ? false : { opacity: 0.85, y: 16 }}
        animate={visible || preference === 'gentle' ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: preference === 'full' ? 0.35 : 0, delay: Math.min(delay, 0.08), ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ImageReveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const preference = useMotionPreference();
  const full = preference === 'full';
  useEffect(() => {
    const timer = window.setTimeout(() => setFallbackVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);
  const visible = preference !== 'full' || inView || fallbackVisible;
  return (
    <motion.div
      ref={ref}
      className={cn('overflow-hidden', className)}
      initial={false}
      animate={visible ? { opacity: 1, clipPath: 'inset(0 0 0 0)' } : undefined}
      transition={{ duration: full ? 0.35 : 0, delay: Math.min(delay, 0.08), ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div className="h-full w-full" initial={{ scale: full ? 1.03 : 1 }} animate={visible ? { scale: 1 } : undefined} transition={{ duration: full ? 0.35 : 0, delay: Math.min(delay, 0.08), ease: [0.16, 1, 0.3, 1] }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.5 });
  const preference = useMotionPreference();
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (preference === 'gentle') { setDisplay(value); return; }
    if (!visible) return;
    const controls = animate(0, value, {
      duration: preference === 'full' ? 1.6 : 0.7,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [preference, value, visible]);
  return <span ref={ref} className={className}>{display.toLocaleString()}</span>;
}

export function Parallax({ children, className, distance = 70 }: RevealProps & { distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const preference = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], preference === 'full' ? [-distance, distance] : [0, 0]);
  return <div ref={ref} className={cn('overflow-hidden', className)}><motion.div style={{ y }} className="h-full w-full">{children}</motion.div></div>;
}

export function WordReveal({ children, className }: { children: string; className?: string }) {
  const preference = useMotionPreference();
  return <p className={className}>{children.split(/\s+/).map((word, index) => <motion.span key={`${word}-${index}`} className="inline-block" initial={preference === 'gentle' ? false : { opacity: 0.85, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: preference === 'full' ? 0.35 : 0, delay: Math.min(index * 0.04, 0.08), ease: [0.16, 1, 0.3, 1] }}>{word}{index < children.split(/\s+/).length - 1 ? '\u00a0' : ''}</motion.span>)}</p>;
}

export function MotionBar({ value, className }: { value: number; className?: string }) {
  const preference = useMotionPreference();
  return <motion.div className={className} initial={preference === 'gentle' ? false : { scaleX: 0, opacity: 1 }} whileInView={{ scaleX: Math.max(0, Math.min(value, 100)) / 100, opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: preference === 'full' ? 0.4 : 0, ease: [0.16, 1, 0.3, 1] }} style={{ transformOrigin: 'left' }} />;
}