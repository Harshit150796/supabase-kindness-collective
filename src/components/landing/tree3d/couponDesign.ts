import * as THREE from 'three';

export interface CouponData {
  brand: string;
  /** File slug under /public/brand-logos/{logo}.svg (local, monochrome white). */
  logo: string;
  color: string;
  amount: 5 | 10;
  /** Optional dark plate behind the logo when white on the brand field is weak. */
  plate?: string;
}

// Logos are white glyphs, so the card foreground is always white.
export function couponTextColor(_hex: string): '#FFFFFF' {
  return '#FFFFFF';
}

// ---------------------------------------------------------------------------
// Logo cache — each SVG is decoded ONCE, rasterised at 1024px, cropped to its
// real glyph bounds (so aspect ratio is exact and the logo can fill the card),
// then shared by every texture and HTML face.
// ---------------------------------------------------------------------------
const LOGO_RES = 1024;
type LogoEntry = {
  status: 'loading' | 'ready' | 'error';
  canvas?: HTMLCanvasElement;
  dataUrl?: string;
  listeners: Set<() => void>;
};
const logos = new Map<string, LogoEntry>();

function finish(entry: LogoEntry, status: 'ready' | 'error') {
  entry.status = status;
  entry.listeners.forEach((fn) => fn());
  entry.listeners.clear();
}

function loadLogo(slug: string): LogoEntry {
  const existing = logos.get(slug);
  if (existing) return existing;
  const entry: LogoEntry = { status: 'loading', listeners: new Set() };
  logos.set(slug, entry);
  const img = new Image();
  img.decoding = 'async';
  img.src = `/brand-logos/${slug}.svg`;
  img
    .decode()
    .then(() => {
      const full = document.createElement('canvas');
      full.width = LOGO_RES;
      full.height = LOGO_RES;
      const fctx = full.getContext('2d')!;
      fctx.drawImage(img, 0, 0, LOGO_RES, LOGO_RES);
      const { data } = fctx.getImageData(0, 0, LOGO_RES, LOGO_RES);
      let minX = LOGO_RES, minY = LOGO_RES, maxX = -1, maxY = -1;
      for (let y = 0; y < LOGO_RES; y++) {
        for (let x = 0; x < LOGO_RES; x++) {
          if (data[(y * LOGO_RES + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) throw new Error('empty logo');
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      // Re-rasterise the cropped region so the long edge is >= 1024px.
      const k = LOGO_RES / Math.max(w, h);
      const crop = document.createElement('canvas');
      crop.width = Math.round(w * k);
      crop.height = Math.round(h * k);
      const cctx = crop.getContext('2d')!;
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(img, -minX * k, -minY * k, LOGO_RES * k, LOGO_RES * k);
      entry.canvas = crop;
      entry.dataUrl = crop.toDataURL('image/png');
      finish(entry, 'ready');
    })
    .catch(() => finish(entry, 'error'));
  return entry;
}

export function getLogo(slug: string) {
  return loadLogo(slug);
}

export function onLogoSettled(slug: string, fn: () => void): () => void {
  const entry = loadLogo(slug);
  if (entry.status !== 'loading') {
    fn();
    return () => undefined;
  }
  entry.listeners.add(fn);
  return () => entry.listeners.delete(fn);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Logo box as a fraction of the card, shared with the HTML face so both paths match. */
export const LOGO_BOX = { w: 0.74, h: 0.66, cy: 0.47 };

function paintCoupon(ctx: CanvasRenderingContext2D, W: number, H: number, S: number, data: CouponData) {
  const entry = loadLogo(data.logo);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = data.color;
  roundRect(ctx, 8 * S, 8 * S, W - 16 * S, H - 16 * S, 28 * S);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 8 * S;
  roundRect(ctx, 8 * S, 8 * S, W - 16 * S, H - 16 * S, 28 * S);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const inset = data.plate ? 0.78 : 1;
  const boxW = W * LOGO_BOX.w * inset;
  const boxH = H * LOGO_BOX.h * inset;
  const cx = W / 2;
  const cy = H * LOGO_BOX.cy;

  if (data.plate) {
    ctx.fillStyle = data.plate;
    roundRect(ctx, cx - boxW / 2 - 18 * S, cy - boxH / 2 - 14 * S, boxW + 36 * S, boxH + 28 * S, 22 * S);
    ctx.fill();
  }

  if (entry.status === 'ready' && entry.canvas) {
    const lw = entry.canvas.width;
    const lh = entry.canvas.height;
    const k = Math.min(boxW / lw, boxH / lh); // preserve aspect ratio exactly
    const dw = lw * k;
    const dh = lh * k;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(entry.canvas, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    // Wordmark fallback (while decoding, or permanently if the logo failed).
    ctx.fillStyle = '#FFFFFF';
    const size = data.brand.length >= 9 ? 66 : data.brand.length >= 7 ? 76 : 90;
    ctx.font = `900 ${size * S}px system-ui, -apple-system, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.brand.toUpperCase(), cx, cy, boxW);
  }

  // Secondary amount, small in the bottom-right corner.
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${34 * S}px system-ui, -apple-system, Arial`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`$${data.amount}`, W - 34 * S, H - 30 * S);
}

export function drawCouponTexture(data: CouponData): THREE.CanvasTexture {
  const S = 4;
  const W = 512 * S;
  const H = 320 * S;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  paintCoupon(ctx, W, H, S, data);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  if (loadLogo(data.logo).status === 'loading') {
    onLogoSettled(data.logo, () => {
      paintCoupon(ctx, W, H, S, data);
      tex.needsUpdate = true;
    });
  }
  return tex;
}

// Curated set of coupon fruits
export const COUPON_FRUITS: CouponData[] = [
  { brand: 'Walmart', logo: 'walmart', color: '#0071CE', amount: 10 },
  { brand: 'Uber', logo: 'uber', color: '#000000', amount: 5 },
  { brand: 'DoorDash', logo: 'doordash', color: '#FF3008', amount: 10 },
  { brand: 'Target', logo: 'target', color: '#CC0000', amount: 5 },
  { brand: 'Instacart', logo: 'instacart', color: '#43B02A', amount: 10 },
  { brand: 'Lyft', logo: 'lyft', color: '#FF00BF', amount: 5 },
  { brand: 'Starbucks', logo: 'starbucks', color: '#00704A', amount: 5 },
  // White on #FF9900 is ~2:1 contrast — a dark plate (Amazon's own navy) carries the logo.
  { brand: 'Amazon', logo: 'amazon', color: '#FF9900', amount: 10, plate: '#232F3E' },
  { brand: 'Grubhub', logo: 'grubhub', color: '#F63440', amount: 5 },
  { brand: "McDonald's", logo: 'mcdonalds', color: '#DA291C', amount: 10 },
  { brand: 'eBay', logo: 'ebay', color: '#E53238', amount: 5 },
  { brand: 'Aldi', logo: 'aldi', color: '#00529B', amount: 10 },
];

// Preload + decode all twelve once at module initialisation.
if (typeof window !== 'undefined') COUPON_FRUITS.forEach((f) => loadLogo(f.logo));
