import { useMemo, useRef, useState, useCallback } from 'react';

export type DeviceTier = 'low' | 'medium' | 'high';

export interface TierSettings {
  tier: DeviceTier;
  dprCap: number;
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  leafCount: number;
  plantCap: number;
  fireflies: boolean;
  fireflyCount: number;
  trunkRipple: boolean;
  ambientBirds: number;
}

const LOW_GPU_RE =
  /(swiftshader|software|llvmpipe|basic render|powervr|mali-[t4]|mali-g3|adreno \(tm\) [1-5]\d\d\b|adreno [1-5]\d\d\b|intel.*(hd|gma) graphics [23]?\d{0,3}\b)/i;

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
    return typeof s === 'string' ? s : '';
  } catch {
    return '';
  }
}

/**
 * Synchronous, one-shot device tier detection. Every browser API touched here is
 * optional, so each read is guarded and the fallback is always 'medium'.
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'medium';

  const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
    | (Navigator & { deviceMemory?: number; hardwareConcurrency?: number })
    | undefined;

  const cores = typeof nav?.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 0;
  const memory = typeof nav?.deviceMemory === 'number' ? nav.deviceMemory : 0;
  const dpr = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
  const width = window.innerWidth || 1024;
  const gpu = getGpuString();

  let score = 0; // negative → low, positive → high

  if (LOW_GPU_RE.test(gpu)) score -= 3;
  if (cores) score += cores >= 8 ? 2 : cores >= 6 ? 1 : cores <= 4 ? -2 : 0;
  if (memory) score += memory >= 8 ? 2 : memory >= 4 ? 1 : -2;
  if (width < 768) score -= 1;
  if (width >= 1280) score += 1;
  // Very high DPR on a small screen means a lot of pixels for a mobile GPU.
  if (dpr >= 3 && width < 768) score -= 1;

  if (score <= -2) return 'low';
  if (score >= 2) return 'high';
  return 'medium';
}

const LOW: TierSettings = {
  tier: 'low',
  dprCap: 1.5,
  shadows: false,
  shadowMapSize: 1024,
  antialias: false,
  leafCount: 2500,
  plantCap: 6,
  fireflies: false,
  fireflyCount: 0,
  trunkRipple: false,
  ambientBirds: 1,
};

const MEDIUM: TierSettings = {
  tier: 'medium',
  dprCap: 2,
  shadows: true,
  shadowMapSize: 1024,
  antialias: true,
  leafCount: 4000,
  plantCap: 32,
  fireflies: true,
  fireflyCount: 24,
  trunkRipple: true,
  ambientBirds: 4,
};

const HIGH: TierSettings = {
  tier: 'high',
  dprCap: 2,
  shadows: true,
  shadowMapSize: 4096,
  antialias: true,
  leafCount: 7000,
  plantCap: 40,
  fireflies: true,
  fireflyCount: 40,
  trunkRipple: true,
  ambientBirds: 8,
};

export const TIER_SETTINGS: Record<DeviceTier, TierSettings> = {
  low: LOW,
  medium: MEDIUM,
  high: HIGH,
};

export function settingsForTier(tier: DeviceTier): TierSettings {
  return TIER_SETTINGS[tier];
}

function stepDown(tier: DeviceTier): DeviceTier {
  return tier === 'high' ? 'medium' : 'low';
}

/**
 * Returns the tier settings resolved once on first render (never re-detected,
 * so the Canvas is never re-initialised) plus a one-shot downgrade callback
 * driven by the in-scene frame-rate sampler.
 */
export function useDeviceTier(forced?: DeviceTier) {
  const initial = useMemo(() => forced ?? detectDeviceTier(), [forced]);
  const [tier, setTier] = useState<DeviceTier>(initial);
  const downgradedRef = useRef(false);

  const requestDowngrade = useCallback(() => {
    if (downgradedRef.current) return;
    downgradedRef.current = true;
    setTier((prev) => (prev === 'low' ? prev : stepDown(prev)));
  }, []);

  const settings = useMemo(() => settingsForTier(tier), [tier]);

  return { initialTier: initial, tier, settings, requestDowngrade };
}
