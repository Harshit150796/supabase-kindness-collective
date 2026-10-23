import { useSyncExternalStore } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionPaused, setMotionPaused, subscribeMotionChoice } from '@/lib/motionChoice';

/**
 * Pauses and resumes the site's moving content (WCAG 2.2.2). "hero" is the small round button on the
 * homepage scene; "link" is the footer's text version.
 */
export function MotionPauseButton({ variant = 'hero', className }: { variant?: 'hero' | 'link'; className?: string }) {
  const paused = useSyncExternalStore(subscribeMotionChoice, motionPaused, () => false);
  const label = paused ? 'Play animations' : 'Pause animations';
  const toggle = () => setMotionPaused(!paused);
  if (variant === 'link') {
    return (
      <button type="button" onClick={toggle} aria-pressed={paused} className={cn('inline-flex min-h-11 items-center gap-1.5 text-left hover:text-primary-foreground', className)}>
        {paused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      aria-label={label}
      title={label}
      data-motion-toggle
      className={cn(
        'pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-[rgba(247,250,247,0.78)] text-[#10281A] shadow-[0_6px_18px_-10px_rgba(4,18,8,0.55)] backdrop-blur-md transition-[background-color,transform] hover:bg-[rgba(247,250,247,0.95)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      {paused ? <Play className="h-4 w-4 translate-x-px" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
