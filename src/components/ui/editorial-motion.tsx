import { animate, motion, useInView, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/lib/utils';

type RevealProps = { children: ReactNode; className?: string; delay?: number };

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.2 });
  const preference = useMotionPreference();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: preference === 'full' ? 40 : 16 }}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: preference === 'full' ? 0.8 : 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LineReveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.35 });
  const preference = useMotionPreference();
  return (
    <div ref={ref} className={cn(preference === 'full' && 'overflow-hidden', className)}>
      <motion.div
        initial={{ opacity: 0, y: preference === 'full' ? '110%' : 16 }}
        animate={visible ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: preference === 'full' ? 0.9 : 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ImageReveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.2 });
  const preference = useMotionPreference();
  const full = preference === 'full';
  return (
    <motion.div
      ref={ref}
      className={cn('overflow-hidden', className)}
      initial={{ opacity: 0, y: full ? 0 : 16, clipPath: full ? 'inset(0 0 100% 0)' : 'inset(0 0 0 0)' }}
      animate={visible ? { opacity: 1, clipPath: 'inset(0 0 0 0)' } : undefined}
      transition={{ duration: full ? 1.2 : 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div initial={{ scale: full ? 1.12 : 1 }} animate={visible ? { scale: 1 } : undefined} transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}>
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
  return <p className={className}>{children.split(/\s+/).map((word, index) => <motion.span key={`${word}-${index}`} className="inline-block" initial={{ opacity: 0.15, y: preference === 'full' ? 8 : 0 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: preference === 'full' ? 0.55 : 0.42, delay: index * (preference === 'full' ? 0.055 : 0.035), ease: [0.16, 1, 0.3, 1] }}>{word}{index < children.split(/\s+/).length - 1 ? '\u00a0' : ''}</motion.span>)}</p>;
}

export function MotionBar({ value, className }: { value: number; className?: string }) {
  const preference = useMotionPreference();
  return <motion.div className={className} initial={{ scaleX: 0, opacity: 0 }} whileInView={{ scaleX: Math.max(0, Math.min(value, 100)) / 100, opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: preference === 'full' ? 1.1 : 0.55, ease: [0.16, 1, 0.3, 1] }} style={{ transformOrigin: 'left' }} />;
}