import { useEffect, useState } from 'react';
import { detectDeviceTier } from '@/hooks/useDeviceTier';

export type MotionPreference = 'full' | 'gentle';

const QUERY = '(prefers-reduced-motion: reduce)';

function read(): MotionPreference {
  if (typeof window === 'undefined') return 'full';
  try {
    return window.matchMedia?.(QUERY)?.matches ? 'gentle' : 'full';
  } catch {
    return 'full';
  }
}

/** Animations always play; 'gentle' only means calmer, never frozen. */
export function useMotionPreference(): MotionPreference {
  const [pref, setPref] = useState<MotionPreference>(read);
  useEffect(() => {
    const mql = window.matchMedia?.(QUERY);
    if (!mql) return;
    const onChange = () => setPref(read());
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return pref;
}

/** Visible only with ?motiondebug=1 in the URL. */
export function MotionDebug() {
  const pref = useMotionPreference();
  const [show] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('motiondebug'));
  if (!show) return null;
  return (
    <div className="fixed bottom-2 left-2 z-[100] rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
      <div>Reduce motion reported: {pref === 'gentle' ? 'YES' : 'no'}</div>
      <div>Width: {window.innerWidth}px</div>
      <div>3D tier: {detectDeviceTier()}</div>
    </div>
  );
}
