import * as THREE from 'three';

export interface CouponData {
  brand: string;
  /** File slug under /public/brand-logos/{logo}.svg (local, original-color artwork). */
  logo: string;
  color: string;
  amount: 5 | 10;
  /** Mark class selects an optical ink-area target without changing proportions. */
  mark: 'emblem' | 'wordmark';
  /** Small correction reserved for genuine visual-density differences. */
  scale?: number;
  /** Brand-shape reduction applied uniformly through every fruit phase. */
  sizeFactor: 0.8 | 0.825 | 0.85;
  /** Hand-audited silhouette separator; the original logo pixels stay untouched. */
  edgeTone: 'light' | 'dark';
  edgeRadius: 5 | 6 | 7;
}

// ---------------------------------------------------------------------------
// Logo cache — each SVG is decoded ONCE, rasterised at 1024px, cropped to its
// real glyph bounds (so aspect ratio is exact and the logo can fill the card),
// then shared by every texture and HTML face.
// ---------------------------------------------------------------------------
const LOGO_RES = 1024;
const LOGO_PROBE_RES = 256;
type LogoEntry = {
  status: 'loading' | 'ready' | 'error';
  canvas?: HTMLCanvasElement;
  aspect: number;
  /** Fraction of the tightly cropped bounds occupied by visible artwork. */
  alphaCoverage: number;
  /** Alpha-weighted perceived luminance, used only to choose the outside keyline. */
  luminance: number;
  listeners: Set<() => void>;
  settled: Promise<void>;
  resolveSettled: () => void;
};
const logos = new Map<string, LogoEntry>();
// Rasterising all 18 SVGs back to back blocked the main thread for seconds on
// slower devices, right while the opening and the app's first render run.
// Each logo now rasterises in its own task, one after another.
let rasterQueue: Promise<void> = Promise.resolve();
// Normal priority on purpose: background tasks can starve while the tree renders on slow devices.
const nextTask = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });
function inOwnTask<T>(work: () => T): Promise<T> {
  const run = rasterQueue
    .then(nextTask)
    .then(work);
  rasterQueue = run.then(() => undefined, () => undefined);
  return run;
}

function finish(entry: LogoEntry, status: 'ready' | 'error') {
  entry.status = status;
  entry.resolveSettled();
  entry.listeners.forEach((fn) => fn());
  entry.listeners.clear();
}

function loadLogo(slug: string): LogoEntry {
  const existing = logos.get(slug);
  if (existing) return existing;
  let resolveSettled = () => undefined;
  const settled = new Promise<void>((resolve) => {
    resolveSettled = resolve;
  });
  const entry: LogoEntry = {
    status: 'loading',
    aspect: 2.44,
    alphaCoverage: 0.52,
    luminance: 0.38,
    listeners: new Set(),
    settled,
    resolveSettled,
  };
  logos.set(slug, entry);
  const img = new Image();
  img.decoding = 'async';
  img.src = `/brand-logos/${slug}.svg`;
  img
    .decode()
    .then(() => inOwnTask(() => {
      const sourceAspect = Math.max(0.08, img.naturalWidth / Math.max(1, img.naturalHeight));
      // Measure alpha on a small probe, then perform the final raster at 1024px.
      // This removes millions of first-load pixel iterations without lowering
      // the texture resolution or altering the original vector proportions.
      const probe = document.createElement('canvas');
      probe.width = sourceAspect >= 1 ? LOGO_PROBE_RES : Math.max(1, Math.round(LOGO_PROBE_RES * sourceAspect));
      probe.height = sourceAspect >= 1 ? Math.max(1, Math.round(LOGO_PROBE_RES / sourceAspect)) : LOGO_PROBE_RES;
      const probeCtx = probe.getContext('2d');
      if (!probeCtx) throw new Error('2d canvas unavailable');
      probeCtx.imageSmoothingEnabled = true;
      probeCtx.imageSmoothingQuality = 'high';
      probeCtx.drawImage(img, 0, 0, probe.width, probe.height);
      const { data } = probeCtx.getImageData(0, 0, probe.width, probe.height);
       let minX = probe.width, minY = probe.height, maxX = -1, maxY = -1;
       let alphaSum = 0, luminanceSum = 0;
      for (let y = 0; y < probe.height; y++) {
        for (let x = 0; x < probe.width; x++) {
           const offset = (y * probe.width + x) * 4;
           const alpha = data[offset + 3] / 255;
           if (alpha > 8 / 255) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
             alphaSum += alpha;
             luminanceSum += (
               data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722
             ) / 255 * alpha;
          }
        }
      }
      if (maxX < 0) throw new Error('empty logo');
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      // Crop the visible pixels without changing the logo's native proportions.
      const k = LOGO_RES / Math.max(w, h);
      const crop = document.createElement('canvas');
      crop.width = Math.round(w * k);
      crop.height = Math.round(h * k);
      const cctx = crop.getContext('2d');
      if (!cctx) throw new Error('2d canvas unavailable');
      const full = document.createElement('canvas');
      full.width = sourceAspect >= 1 ? LOGO_RES : Math.max(1, Math.round(LOGO_RES * sourceAspect));
      full.height = sourceAspect >= 1 ? Math.max(1, Math.round(LOGO_RES / sourceAspect)) : LOGO_RES;
      const fctx = full.getContext('2d');
      if (!fctx) throw new Error('2d canvas unavailable');
      fctx.imageSmoothingEnabled = true;
      fctx.imageSmoothingQuality = 'high';
      fctx.drawImage(img, 0, 0, full.width, full.height);
      const scaleX = full.width / probe.width;
      const scaleY = full.height / probe.height;
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(
        full,
        minX * scaleX,
        minY * scaleY,
        w * scaleX,
        h * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      );
      entry.canvas = crop;
      entry.aspect = crop.width / crop.height;
       entry.alphaCoverage = alphaSum / Math.max(1, w * h);
       entry.luminance = luminanceSum / Math.max(1, alphaSum);
      finish(entry, 'ready');
    }))
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

function paintLogo(canvas: HTMLCanvasElement, data: CouponData) {
  const entry = loadLogo(data.logo);
  if (entry.status === 'ready' && entry.canvas) {
    const scale = TEXTURE_LONG_EDGE / Math.max(entry.canvas.width, entry.canvas.height);
    const logoW = Math.max(1, Math.round(entry.canvas.width * scale));
    const logoH = Math.max(1, Math.round(entry.canvas.height * scale));
    // A restrained alpha-derived keyline separates the untouched real artwork
    // from leaves. It follows the silhouette and never creates a plate/board.
    const edge = 11;
    canvas.width = logoW + edge * 2;
    canvas.height = logoH + edge * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Build an opaque silhouette from several precise offsets, tint it, then
    // restore the untouched original artwork above it.
    const outline = document.createElement('canvas');
    outline.width = canvas.width;
    outline.height = canvas.height;
    const outlineCtx = outline.getContext('2d');
    if (outlineCtx) {
      const radius = data.edgeRadius;
      const steps = 32;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        outlineCtx.drawImage(
          entry.canvas,
          edge + Math.cos(angle) * radius,
          edge + Math.sin(angle) * radius,
          logoW,
          logoH,
        );
      }
      outlineCtx.globalCompositeOperation = 'source-in';
      outlineCtx.fillStyle = data.edgeTone === 'dark'
        ? 'rgba(16,36,24,0.9)'
        : 'rgba(255,255,255,0.97)';
      outlineCtx.fillRect(0, 0, outline.width, outline.height);
      ctx.drawImage(outline, 0, 0);
    }
    ctx.drawImage(entry.canvas, edge, edge, logoW, logoH);

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
  { brand: 'Walmart', logo: 'walmart', color: '#007DC3', amount: 10, mark: 'emblem', scale: 0.96, sizeFactor: 0.825, edgeTone: 'dark', edgeRadius: 6 },
  { brand: 'Uber', logo: 'uber', color: '#000000', amount: 5, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 7 },
  { brand: 'DoorDash', logo: 'doordash', color: '#FF3008', amount: 10, mark: 'emblem', sizeFactor: 0.8, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Target', logo: 'target', color: '#E50024', amount: 5, mark: 'emblem', scale: 0.94, sizeFactor: 0.825, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Instacart', logo: 'instacart', color: '#0AAD0A', amount: 10, mark: 'emblem', scale: 1.08, sizeFactor: 0.825, edgeTone: 'dark', edgeRadius: 7 },
  { brand: 'Lyft', logo: 'lyft', color: '#EA0B8C', amount: 5, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Starbucks', logo: 'starbucks', color: '#006241', amount: 5, mark: 'emblem', scale: 0.94, sizeFactor: 0.825, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Amazon', logo: 'amazon', color: '#000000', amount: 10, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 7 },
  { brand: 'Grubhub', logo: 'grubhub', color: '#FF5500', amount: 5, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 6 },
  { brand: "McDonald's", logo: 'mcdonalds', color: '#FFCC00', amount: 10, mark: 'emblem', scale: 0.94, sizeFactor: 0.825, edgeTone: 'dark', edgeRadius: 6 },
  { brand: 'Aldi', logo: 'aldi', color: '#00529B', amount: 10, mark: 'emblem', scale: 0.96, sizeFactor: 0.825, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Kroger', logo: 'kroger', color: '#0468B3', amount: 10, mark: 'emblem', sizeFactor: 0.8, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Whole Foods', logo: 'whole-foods', color: '#006F46', amount: 5, mark: 'emblem', sizeFactor: 0.8, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Publix', logo: 'publix', color: '#649441', amount: 10, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Uber Eats', logo: 'uber-eats', color: '#06C167', amount: 10, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 7 },
  { brand: 'Seamless', logo: 'seamless', color: '#C90117', amount: 10, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 6 },
  { brand: "Domino's", logo: 'dominos', color: '#006491', amount: 5, mark: 'emblem', sizeFactor: 0.8, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Taco Bell', logo: 'taco-bell', color: '#38096C', amount: 10, mark: 'emblem', sizeFactor: 0.8, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Subway', logo: 'subway', color: '#008938', amount: 5, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Chipotle', logo: 'chipotle', color: '#A81612', amount: 10, mark: 'emblem', scale: 0.94, sizeFactor: 0.825, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'CVS', logo: 'cvs', color: '#CC0000', amount: 5, mark: 'wordmark', scale: 1.12, sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 7 },
  { brand: 'Walgreens', logo: 'walgreens', color: '#E62324', amount: 10, mark: 'emblem', sizeFactor: 0.8, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Costco', logo: 'costco', color: '#E31837', amount: 5, mark: 'wordmark', sizeFactor: 0.85, edgeTone: 'light', edgeRadius: 6 },
  { brand: 'Home Depot', logo: 'home-depot', color: '#F96302', amount: 10, mark: 'emblem', scale: 0.92, sizeFactor: 0.825, edgeTone: 'light', edgeRadius: 5 },
];

export interface CouponLogoDiagnostics {
  ready: string[];
  failed: string[];
  invalid: string[];
}

/**
 * Resolves only after every local mark has either decoded to final measured
 * proportions or received its brand-specific fallback proportions. The tree
 * can render immediately, while fruit meshes wait for this one shared gate.
 */
export async function preloadCouponLogos(fruits: readonly CouponData[] = COUPON_FRUITS): Promise<CouponLogoDiagnostics> {
  const entries = fruits.map((fruit) => ({ fruit, entry: loadLogo(fruit.logo) }));
  await Promise.all(entries.map(({ entry }) => entry.settled));

  const ready: string[] = [];
  const failed: string[] = [];
  const invalid: string[] = [];
  entries.forEach(({ fruit, entry }) => {
    if (entry.status === 'error') {
      // A genuine asset failure still gets stable, brand-appropriate geometry.
      entry.aspect = fruit.mark === 'emblem' ? 1 : 2.44;
      entry.alphaCoverage = fruit.mark === 'emblem' ? 0.62 : 0.52;
      failed.push(fruit.logo);
      return;
    }
    ready.push(fruit.logo);
    if (
      !Number.isFinite(entry.aspect) || entry.aspect <= 0 ||
      !Number.isFinite(entry.alphaCoverage) || entry.alphaCoverage <= 0 ||
      !entry.canvas || entry.canvas.width <= 0 || entry.canvas.height <= 0
    ) invalid.push(fruit.logo);
  });
  return { ready, failed, invalid };
}
