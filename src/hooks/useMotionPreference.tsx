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
  const [settings, setSettings] = useState('Waiting for tree');
  useEffect(() => {
    const readSettings = () => {
      const tree = document.querySelector<HTMLElement>('[data-tree-settings]');
      if (!tree) return;
      const values = JSON.parse(tree.dataset.treeSettings || '{}');
      setSettings(`${values.tier}; ${values.leafCount} leaves; ${values.fireflyCount} fireflies; ${tree.dataset.treeActiveBirds} active birds; ripple ${tree.dataset.treeTrunkRipple === 'true' ? 'on' : 'off'}; shadow ${values.shadowMapSize}; DPR ${values.dprCap}; MSAA retained; ${tree.dataset.treeMotion}; step ${tree.dataset.treeQualityStep}`);
    };
    const timer = window.setInterval(readSettings, 500);
    return () => window.clearInterval(timer);
  }, []);
  const [show] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('motiondebug'));
  if (!show) return null;
  return (
    <div className="fixed bottom-2 left-2 z-[100] rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
      <div>Reduce motion reported: {pref === 'gentle' ? 'YES' : 'no'}</div>
      <div>Width: {window.innerWidth}px</div>
      <div>Initial renderer tier: {detectDeviceTier()}</div>
      <div className="max-w-[min(360px,85vw)]">Active tree: {settings}</div>
    </div>
  );
}
