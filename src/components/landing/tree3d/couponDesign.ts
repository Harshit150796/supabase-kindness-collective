import * as THREE from 'three';

export const TRAITS = ['TRANSPARENT', 'TRACEABLE', 'SECURE', 'RELIABLE'] as const;
export type Trait = typeof TRAITS[number];

export interface CouponData {
  brand: string;
  color: string;
  trait: Trait;
  amount: 5 | 10;
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
  const W = 512;
  const H = 320;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background card
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 8, 8, W - 16, H - 16, 28);
  ctx.fill();

  // Gold border
  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 6;
  roundRect(ctx, 8, 8, W - 16, H - 16, 28);
  ctx.stroke();

  // Top brand stripe
  ctx.fillStyle = data.color;
  roundRect(ctx, 8, 8, W - 16, 90, 28);
  ctx.fill();
  // square off bottom of stripe
  ctx.fillRect(8, 70, W - 16, 28);

  // Brand name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px system-ui, -apple-system, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.brand.toUpperCase(), W / 2, 53);

  // Trait pill
  const pillW = 280;
  const pillH = 56;
  const pillX = (W - pillW) / 2;
  const pillY = 130;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
  roundRect(ctx, pillX, pillY, pillW, pillH, 28);
  ctx.fill();
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  roundRect(ctx, pillX, pillY, pillW, pillH, 28);
  ctx.stroke();
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 26px system-ui, -apple-system, Arial';
  ctx.fillText(data.trait, W / 2, pillY + pillH / 2 + 1);

  // Amount
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 78px system-ui, -apple-system, Arial';
  ctx.fillText(`$${data.amount}`, W / 2, 240);

  // "COUPON" sub-label
  ctx.fillStyle = '#6B7280';
  ctx.font = '600 18px system-ui, -apple-system, Arial';
  ctx.fillText('GROCERY COUPON', W / 2, 290);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
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
