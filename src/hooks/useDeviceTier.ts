import { useMemo, useState, useCallback } from 'react';
import { qualitySettings, rendererTier, TIER_SETTINGS, type DeviceTier } from '@/lib/treeQuality';
export { TIER_SETTINGS } from '@/lib/treeQuality';
export type { DeviceTier, TierSettings } from '@/lib/treeQuality';

function getGpuString(): string {
  try {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    const s = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    // Detection uses a throwaway context, never the live scene's context.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return typeof s === 'string' ? s : '';
  } catch {
    return '';
  }
}

/** Screen, pixel density, memory and CPU are not GPU benchmarks. */
export function detectDeviceTier(): DeviceTier {
  return rendererTier(getGpuString());
}

export function settingsForTier(tier: DeviceTier) {
  return TIER_SETTINGS[tier];
}

/** Sequential runtime savings without recreating the Canvas or changing artwork. */
export function useDeviceTier(forced?: DeviceTier) {
  const initial = useMemo(() => forced ?? detectDeviceTier(), [forced]);
  const [step, setStep] = useState(0);
  const requestDowngrade = useCallback(() => {
    if (initial !== 'high') return;
    setStep((previous) => Math.min(previous + 1, 6));
  }, [initial]);
  const settings = useMemo(() => qualitySettings(initial, step), [initial, step]);
  return { initialTier: initial, tier: settings.tier, settings, step, requestDowngrade };
}
