import * as THREE from 'three';

export const TRAITS = ['TRANSPARENT', 'TRACEABLE', 'SECURE', 'RELIABLE'] as const;
export type Trait = typeof TRAITS[number];

export interface CouponData {
  brand: string;
  color: string;
  trait: Trait;
  amount: 5 | 10;
}

export function couponTextColor(hex: string): '#000000' | '#FFFFFF' {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return '#FFFFFF';
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#000000' : '#FFFFFF';
}

// Hash a string to deterministic int
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickTrait(brand: string): Trait {
  return TRAITS[hash(brand) % TRAITS.length];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCouponTexture(data: CouponData): THREE.CanvasTexture {
  // 4× resolution upgrade for crisp coupons (was 512×320)
  const S = 4;
  const W = 512 * S;
  const H = 320 * S;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const foreground = couponTextColor(data.color);

  // At its final on-screen size this is an icon, not a document: one dominant
  // brand field and one amount are the only two pieces of information.
  ctx.fillStyle = data.color;
  roundRect(ctx, 8 * S, 8 * S, W - 16 * S, H - 16 * S, 28 * S);
  ctx.fill();

  // A strong light/dark edge survives downsampling without adding another hue.
  ctx.strokeStyle = foreground;
  ctx.globalAlpha = 0.92;
  ctx.lineWidth = 10 * S;
  roundRect(ctx, 8 * S, 8 * S, W - 16 * S, H - 16 * S, 28 * S);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Brand wordmark — deliberately oversized and allowed nearly the full width.
  ctx.fillStyle = foreground;
  const brandSize = data.brand.length >= 9 ? 54 : data.brand.length >= 7 ? 62 : 72;
  ctx.font = `900 ${brandSize * S}px system-ui, -apple-system, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.brand.toUpperCase(), W / 2, 112 * S, 448 * S);

  // Amount
  ctx.fillStyle = foreground;
  ctx.font = `900 ${116 * S}px system-ui, -apple-system, Arial`;
  ctx.fillText(`$${data.amount}`, W / 2, 238 * S);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Curated set of coupon fruits
export const COUPON_FRUITS: CouponData[] = [
  { brand: 'Walmart', color: '#0071CE', trait: pickTrait('Walmart'), amount: 10 },
  { brand: 'Uber', color: '#000000', trait: pickTrait('Uber'), amount: 5 },
  { brand: 'DoorDash', color: '#FF3008', trait: pickTrait('DoorDash'), amount: 10 },
  { brand: 'Target', color: '#CC0000', trait: pickTrait('Target'), amount: 5 },
  { brand: 'Kroger', color: '#0066B2', trait: pickTrait('Kroger'), amount: 10 },
  { brand: 'Chipotle', color: '#A81612', trait: pickTrait('Chipotle'), amount: 5 },
  { brand: 'Starbucks', color: '#00704A', trait: pickTrait('Starbucks'), amount: 5 },
  { brand: 'Amazon', color: '#FF9900', trait: pickTrait('Amazon'), amount: 10 },
  { brand: 'CVS', color: '#CC0000', trait: pickTrait('CVS'), amount: 5 },
  { brand: 'Costco', color: '#E31837', trait: pickTrait('Costco'), amount: 10 },
  { brand: 'Subway', color: '#008C15', trait: pickTrait('Subway'), amount: 5 },
  { brand: 'Aldi', color: '#00529B', trait: pickTrait('Aldi'), amount: 10 },
];
