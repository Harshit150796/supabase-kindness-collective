import * as THREE from 'three';

export interface CouponData {
  brand: string;
  /** File slug under /public/brand-logos/{logo}.svg (local, monochrome white). */
  logo: string;
  color: string;
  amount: 5 | 10;
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
  aspect: number;
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
  const entry: LogoEntry = { status: 'loading', aspect: 1.6, listeners: new Set() };
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
      const fctx = full.getContext('2d');
      if (!fctx) throw new Error('2d canvas unavailable');
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
      const cctx = crop.getContext('2d');
      if (!cctx) throw new Error('2d canvas unavailable');
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(img, -minX * k, -minY * k, LOGO_RES * k, LOGO_RES * k);
      entry.canvas = crop;
      entry.dataUrl = crop.toDataURL('image/png');
      entry.aspect = crop.width / crop.height;
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

const TEXTURE_LONG_EDGE = 1024;
const TEXTURE_PAD = 56;

function paintLogo(canvas: HTMLCanvasElement, data: CouponData) {
  const entry = loadLogo(data.logo);
  if (entry.status === 'ready' && entry.canvas) {
    const scale = TEXTURE_LONG_EDGE / Math.max(entry.canvas.width, entry.canvas.height);
    const logoW = Math.max(1, Math.round(entry.canvas.width * scale));
    const logoH = Math.max(1, Math.round(entry.canvas.height * scale));
    canvas.width = logoW + TEXTURE_PAD * 2;
    canvas.height = logoH + TEXTURE_PAD * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(entry.canvas, TEXTURE_PAD, TEXTURE_PAD, logoW, logoH);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = data.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.shadowColor = 'rgba(255,255,255,0.92)';
    ctx.shadowBlur = 18;
    ctx.drawImage(entry.canvas, TEXTURE_PAD, TEXTURE_PAD, logoW, logoH);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    // Never show a blank fruit while decoding or if a local SVG fails.
    canvas.width = TEXTURE_LONG_EDGE;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = data.color;
    ctx.font = `900 ${data.brand.length >= 9 ? 126 : 156}px system-ui, -apple-system, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.brand.toUpperCase(), canvas.width / 2, canvas.height / 2, canvas.width - 80);
  }
}

export function drawCouponTexture(data: CouponData): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  paintLogo(canvas, data);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  if (loadLogo(data.logo).status === 'loading') {
    onLogoSettled(data.logo, () => {
      paintLogo(canvas, data);
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
  { brand: 'Amazon', logo: 'amazon', color: '#FF9900', amount: 10 },
  { brand: 'Grubhub', logo: 'grubhub', color: '#F63440', amount: 5 },
  { brand: "McDonald's", logo: 'mcdonalds', color: '#DA291C', amount: 10 },
  { brand: 'eBay', logo: 'ebay', color: '#E53238', amount: 5 },
  { brand: 'Aldi', logo: 'aldi', color: '#00529B', amount: 10 },
];

// Preload + decode all twelve once at module initialisation.
if (typeof window !== 'undefined') COUPON_FRUITS.forEach((f) => loadLogo(f.logo));
