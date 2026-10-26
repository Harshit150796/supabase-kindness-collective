/**
 * The live tree's own sky, ground and moon or sun, drawn without the tree.
 *
 * The hero shows this until the tree's first frame, so the moment before the tree arrives is
 * the same scene it then appears in: same framing, same colours, same horizon. It mirrors
 * Tree3DScene (CameraRig's fit and starting zoom, OrbitControls' lowest camera angle), Sky.tsx
 * (palette and gradient), Ground.tsx (a 12-unit disc) and the scene fog. hero-handoff_test.ts
 * fails if those drift apart.
 */
export type HeroSky = 'night' | 'day';

export const SKY_PALETTES = {
  day: { top: '#7FB5E6', mid: '#CFE6F5', bot: '#E8F1E0' },
  night: { top: '#0A1530', mid: '#1F2C5C', bot: '#3A4A7E' },
} as const;
export const FOG_COLORS = { day: '#DCE6D5', night: '#1A2440' } as const;
const FOG_NEAR = 18;
const FOG_FAR = 45;
const SKY_RADIUS = 60;
const GROUND_RADIUS = 12;
const GROUND_Y = -0.01;
export const ORBS = {
  day: { at: [8, 9, -12], radius: 1.2, color: '#FFF6D8' },
  night: { at: [6, 10, -12], radius: 0.9, color: '#E8EBF5' },
} as const;

/** Height of the canopy's top in world units, read from rendered frames (25.4% down a laptop hero). */
export const TREE_TOP_Y = 6.06;
/** Half the width of the hero's headline and buttons plus a margin: the orb's edge stays this far right of centre. */
export const ORB_CLEARANCE_PX = 260;

/** Must match useIsMobile: phones get the narrower lens and the farther camera. */
export const PHONE_BREAKPOINT = 768;

/**
 * Unlit-by-fog ground colour as the live scene draws it, by how far below the horizon the view
 * ray points (degrees). Measured from rendered frames at laptop and phone framing; the grass is
 * lit mostly by the environment, so night and day differ less than the sky does.
 */
type Stop = readonly [number, readonly [number, number, number]];
const GROUND: Record<'laptop' | 'phone', Record<HeroSky, readonly Stop[]>> = {
  laptop: {
    night: [[10, [110, 146, 83]], [11, [129, 161, 94]], [12, [135, 170, 102]], [13, [141, 175, 107]], [14.5, [147, 176, 109]], [16.5, [155, 185, 119]], [18.5, [155, 184, 118]], [20, [153, 183, 116]], [21.5, [164, 192, 128]]],
    day: [[10, [134, 169, 99]], [11, [154, 182, 112]], [12, [160, 191, 121]], [13, [165, 194, 126]], [14, [171, 198, 131]], [16, [174, 199, 134]], [18, [176, 200, 135]], [20, [180, 204, 140]], [21.5, [184, 206, 145]]],
  },
  phone: {
    night: [[9, [112, 150, 82]], [10, [140, 175, 106]], [11, [159, 188, 122]], [12, [166, 192, 131]], [13.5, [171, 195, 136]], [15, [169, 194, 134]], [17, [158, 187, 122]], [19, [149, 181, 114]], [20, [145, 178, 110]]],
    day: [[9, [128, 164, 94]], [10, [164, 193, 123]], [11, [180, 204, 140]], [12, [183, 205, 146]], [14, [191, 210, 154]], [15, [190, 210, 153]], [17, [183, 206, 143]], [19, [172, 199, 132]], [20, [168, 196, 129]]],
  },
};

type Vec = [number, number, number];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const hex = (value: string): Vec => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as Vec;
const toLinear = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const smooth = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export interface HeroCamera { position: Vec; forward: Vec; up: Vec; tanHalf: number }

/** The camera of the tree's first frame for a hero of this size. */
export function heroCamera(width: number, height: number, phone: boolean): HeroCamera {
  const fov = ((phone ? 32 : 38) * Math.PI) / 180;
  const tanHalf = Math.tan(fov / 2);
  const aspect = width / Math.max(height, 1);
  const fit = Math.max(phone ? 16 : 13, 4.5 / (tanHalf * Math.min(aspect, 1)));
  const distance = fit + 0.7 * 4; // starting zoom progress 0.7
  const lowest = Math.PI / 2 - Math.PI / 2.1; // OrbitControls maxPolarAngle
  const targetY = phone ? 3.6 : 3.4;
  const position: Vec = [0, targetY + distance * Math.sin(lowest), distance * Math.cos(lowest)];
  const forward: Vec = [0, -Math.sin(lowest), -Math.cos(lowest)];
  const up: Vec = [0, Math.cos(lowest), -Math.sin(lowest)];
  return { position, forward, up, tanHalf };
}

/** Where the canopy's top lands in a hero of this size, in px from the hero's top. */
export function canopyTopPx(width: number, height: number, phone: boolean): number {
  const { position: c, forward: f, up: u, tanHalf } = heroCamera(width, height, phone);
  const rel: Vec = [-c[0], TREE_TOP_Y - c[1], -c[2]];
  return height / 2 - (dot(rel, u) / dot(rel, f)) * (height / 2 / tanHalf);
}

/**
 * The moon's (or sun's) x in the scene. On laptop framing it moves right just far enough that its
 * edge clears the hero's buttons (founder request), staying inside the frame; phones keep it as it was,
 * since their buttons sit below it.
 */
export function orbX(sky: HeroSky, width: number, height: number, phone: boolean): number {
  const orb = ORBS[sky];
  if (phone || !width || !height) return orb.at[0];
  const { position: c, forward: f, tanHalf } = heroCamera(width, height, phone);
  const depth = dot([orb.at[0] - c[0], orb.at[1] - c[1], orb.at[2] - c[2]], f);
  const pxPerUnit = height / 2 / tanHalf / depth;
  const clear = ORB_CLEARANCE_PX / pxPerUnit + orb.radius;
  const inFrame = (width / 2 - 12) / pxPerUnit - orb.radius;
  return Math.max(orb.at[0], Math.min(clear, inFrame));
}

/** Where the trunk meets the grass (the scene's origin), in px from the hero's top. */
export function trunkBasePx(width: number, height: number, phone: boolean): number {
  const { position: c, forward: f, up: u, tanHalf } = heroCamera(width, height, phone);
  const rel: Vec = [-c[0], -c[1], -c[2]];
  return height / 2 - (dot(rel, u) / dot(rel, f)) * (height / 2 / tanHalf);
}

/** Where the moon (or sun) sits in a hero of this size: centre and radius in px from the hero's top-left. */
export function orbScreen(sky: HeroSky, width: number, height: number, phone: boolean): { x: number; y: number; r: number } {
  const { position: c, forward: f, up: u, tanHalf } = heroCamera(width, height, phone);
  const orb = ORBS[sky];
  const rel: Vec = [orbX(sky, width, height, phone) - c[0], orb.at[1] - c[1], orb.at[2] - c[2]];
  const z = dot(rel, f);
  const focal = height / 2 / tanHalf;
  return { x: width / 2 + (rel[0] / z) * focal, y: height / 2 - (dot(rel, u) / z) * focal, r: (orb.radius / z) * focal };
}

function groundBase(stops: readonly Stop[], angle: number): Vec {
  if (angle <= stops[0][0]) return [...stops[0][1]] as Vec;
  for (let i = 1; i < stops.length; i++) {
    const [a1, c1] = stops[i];
    if (angle <= a1) {
      const [a0, c0] = stops[i - 1];
      const k = (angle - a0) / (a1 - a0);
      return [0, 1, 2].map((j) => c0[j] + (c1[j] - c0[j]) * k) as Vec;
    }
  }
  return [...stops[stops.length - 1][1]] as Vec;
}

/**
 * Paints the scene into `canvas` at its CSS size. The sky and grass are smooth fields, computed on
 * a coarse grid and scaled up; the horizon is the exact outline of the ground disc, so it stays crisp.
 */
export function drawHeroBackdrop(canvas: HTMLCanvasElement, sky: HeroSky, phone: boolean) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const cam = heroCamera(width, height, phone);
  const { position: c, forward: f, up: u, tanHalf } = cam;
  const palette = SKY_PALETTES[sky];
  const top = hex(palette.top).map(toLinear) as Vec;
  const mid = hex(palette.mid).map(toLinear) as Vec;
  const bot = hex(palette.bot).map(toLinear) as Vec;
  const fog = hex(FOG_COLORS[sky]);
  const stops = GROUND[phone ? 'phone' : 'laptop'][sky];

  // Coarse grid: about 160 cells across the longer side.
  const cell = Math.max(2, Math.ceil(Math.max(width, height) / 160));
  const gw = Math.ceil(width / cell);
  const gh = Math.ceil(height / cell);
  const skyField = new ImageData(gw, gh);
  const grassField = new ImageData(gw, gh);
  const cc = dot(c, c) - SKY_RADIUS * SKY_RADIUS;
  for (let j = 0; j < gh; j++) {
    const ny = (height / 2 - (j + 0.5) * (height / gh)) / (height / 2) * tanHalf;
    for (let i = 0; i < gw; i++) {
      const nx = ((i + 0.5) * (width / gw) - width / 2) / (height / 2) * tanHalf;
      const raw: Vec = [nx, f[1] + ny * u[1], f[2] + ny * u[2]];
      const len = Math.hypot(raw[0], raw[1], raw[2]);
      const d: Vec = [raw[0] / len, raw[1] / len, raw[2] / len];
      const o = (j * gw + i) * 4;
      // Sky: Sky.tsx's gradient on its 60-unit dome, written without colour conversion as the shader does.
      const b = dot(c, d);
      const t = -b + Math.sqrt(b * b - cc);
      const h = (c[1] + t * d[1]) / SKY_RADIUS;
      const k = h > 0 ? smooth(0, 0.7, h) : smooth(0, -0.4, h);
      const to = h > 0 ? top : bot;
      for (let ch = 0; ch < 3; ch++) skyField.data[o + ch] = Math.round((mid[ch] + (to[ch] - mid[ch]) * k) * 255);
      skyField.data[o + 3] = 255;
      // Grass: measured ground colour for this viewing angle, then the scene's fog by depth.
      if (d[1] < 0) {
        const s = (GROUND_Y - c[1]) / d[1];
        const depth = s * dot(d, f);
        const base = groundBase(stops, (Math.asin(-d[1]) * 180) / Math.PI);
        const mist = smooth(FOG_NEAR, FOG_FAR, depth);
        for (let ch = 0; ch < 3; ch++) grassField.data[o + ch] = Math.round(base[ch] + (fog[ch] - base[ch]) * mist);
      } else {
        for (let ch = 0; ch < 3; ch++) grassField.data[o + ch] = fog[ch];
      }
      grassField.data[o + 3] = 255;
    }
  }

  const field = document.createElement('canvas');
  field.width = gw;
  field.height = gh;
  const fctx = field.getContext('2d');
  if (!fctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  fctx.putImageData(skyField, 0, 0);
  ctx.drawImage(field, 0, 0, width, height);

  // Moon or sun: an unlit sphere, fogged by its distance like everything else in the scene.
  const orb = ORBS[sky];
  const rel: Vec = [orbX(sky, width, height, phone) - c[0], orb.at[1] - c[1], orb.at[2] - c[2]];
  const oz = dot(rel, f);
  const focal = height / 2 / tanHalf;
  const ox = width / 2 + (rel[0] / oz) * focal;
  const oy = height / 2 - (dot(rel, u) / oz) * focal;
  const tint = smooth(FOG_NEAR, FOG_FAR, oz - orb.radius);
  const oc = hex(orb.color).map((v, ch) => Math.round(v + (fog[ch] - v) * tint));
  ctx.fillStyle = `rgb(${oc[0]},${oc[1]},${oc[2]})`;
  ctx.beginPath();
  ctx.arc(ox, oy, (orb.radius / oz) * focal, 0, Math.PI * 2);
  ctx.fill();

  // Ground: the exact projected outline of the grass disc.
  ctx.save();
  ctx.beginPath();
  for (let n = 0; n <= 256; n++) {
    const a = (n / 256) * Math.PI * 2;
    const p: Vec = [GROUND_RADIUS * Math.cos(a) - c[0], GROUND_Y - c[1], GROUND_RADIUS * Math.sin(a) - c[2]];
    const z = dot(p, f);
    const x = width / 2 + (p[0] / z) * focal;
    const y = height / 2 - (dot(p, u) / z) * focal;
    if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();
  fctx.putImageData(grassField, 0, 0);
  ctx.drawImage(field, 0, 0, width, height);
  ctx.restore();
}
