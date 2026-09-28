import { animate, motion, useInView } from 'motion/react';
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
      initial={{ opacity: 0, y: preference === 'full' ? 12 : 0 }}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: preference === 'full' ? 0.65 : 0.28, delay, ease: [0.22, 1, 0.36, 1] }}
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
        initial={{ opacity: 0, y: preference === 'full' ? '105%' : 0 }}
        animate={visible ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: preference === 'full' ? 0.8 : 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
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
      initial={{ opacity: 0, clipPath: full ? 'inset(8% 0 8% 0)' : 'inset(0 0 0 0)' }}
      animate={visible ? { opacity: 1, clipPath: 'inset(0 0 0 0)' } : undefined}
      transition={{ duration: full ? 0.9 : 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div initial={{ scale: full ? 1.06 : 1 }} animate={visible ? { scale: 1 } : undefined} transition={{ duration: 1.1, delay }}>
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
      duration: preference === 'full' ? 1.3 : 0.55,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [preference, value, visible]);
  return <span ref={ref} className={className}>{display.toLocaleString()}</span>;
}