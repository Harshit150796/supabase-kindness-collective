/** Hardware starts with the same artwork. Only measured frame costs may step down. */
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
export const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software rasterizer|basic render/i;
export function rendererTier(renderer: string): DeviceTier {
  return SOFTWARE_RENDERER.test(renderer) ? 'low' : 'high';
}
const HIGH: TierSettings = {
  tier: 'high', dprCap: 2, shadows: true, shadowMapSize: 4096, antialias: true,
  leafCount: 7000, plantCap: 40, fireflies: true, fireflyCount: 40,
  trunkRipple: true, ambientBirds: 8,
};
export const TIER_SETTINGS: Record<DeviceTier, TierSettings> = {
  high: HIGH,
  medium: { ...HIGH, tier: 'medium', shadowMapSize: 1024, dprCap: 1.5, plantCap: 32, fireflyCount: 24, ambientBirds: 4 },
  low: { ...HIGH, tier: 'low', shadowMapSize: 1024, dprCap: 1.5, plantCap: 6, fireflyCount: 8, ambientBirds: 1, trunkRipple: false },
};
/** MSAA is context-owned: keep it and alpha-to-coverage rather than remounting/changing leaf edges.
 * leafCount describes the authored GLB canopy, not a procedural density switch:
 * even last-resort ambient reductions never change its geometry or materials.
 */
export function qualitySettings(initial: DeviceTier, step: number): TierSettings {
  if (initial !== 'high') return TIER_SETTINGS[initial];
  if (step >= 6) return TIER_SETTINGS.low;
  if (step >= 5) return TIER_SETTINGS.medium;
  return { ...HIGH, shadowMapSize: step === 0 ? 4096 : step === 1 ? 2048 : 1024,
    dprCap: step < 3 ? 2 : step === 3 ? 1.75 : 1.5 };
}
export function shouldReduceQuality(fps: number, visible: boolean, sampleMs: number): boolean {
  return visible && sampleMs >= 2500 && Number.isFinite(fps) && fps < 45;
}
