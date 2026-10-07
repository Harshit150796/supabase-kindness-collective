import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type MotionPreference = 'full' | 'gentle';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Founder decision: every device gets full motion, whatever the OS setting. */
export function useMotionPreference(): MotionPreference {
  return 'full';
}

function osReducedMotion(): boolean {
  try { return window.matchMedia?.(QUERY)?.matches ?? false; } catch { return false; }
}

/** Visible only with ?motiondebug=1 in the URL. */
export function MotionDebug() {
  const pref = useMotionPreference();
  const [show] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('motiondebug'));
  const [initialTier, setInitialTier] = useState('Waiting for tree');
  const [settings, setSettings] = useState('Waiting for tree');
  useEffect(() => {
    if (!show) return;
    const readSettings = () => {
      const tree = document.querySelector<HTMLElement>('[data-tree-settings]');
      if (!tree) return;
      const values = JSON.parse(tree.dataset.treeSettings || '{}');
      setInitialTier(tree.dataset.treeInitialTier || 'unknown');
      setSettings(`${values.tier}; ${values.leafCount} leaves; ${values.fireflyCount} fireflies; ${tree.dataset.treeActiveBirds} active birds; ripple ${tree.dataset.treeTrunkRipple === 'true' ? 'on' : 'off'}; shadow ${values.shadowMapSize}; DPR ${values.dprCap}; MSAA retained; ${tree.dataset.treeMotion}; step ${tree.dataset.treeQualityStep}`);
    };
    const timer = window.setInterval(readSettings, 500);
    return () => window.clearInterval(timer);
  }, [show]);
  if (!show) return null;
  return createPortal(
    <div className="fixed bottom-2 left-2 z-[100] rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
      <div>Phone Reduce Motion setting: {osReducedMotion() ? 'on' : 'off'} · site motion: {pref}</div>
      <div>Width: {window.innerWidth}px</div>
      <div>Initial renderer tier: {initialTier}</div>
      <div className="max-w-[min(360px,85vw)]">Active tree: {settings}</div>
    </div>, document.body
  );
}
