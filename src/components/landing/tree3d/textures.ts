import * as THREE from 'three';

// ---------- Helper: build normal map from grayscale canvas ----------
function canvasToNormalMap(src: HTMLCanvasElement, strength = 2.0): THREE.CanvasTexture {
  const W = src.width;
  const H = src.height;
  const sctx = src.getContext('2d')!;
  const data = sctx.getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    lum[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d')!;
  const img = octx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const xl = lum[y * W + ((x - 1 + W) % W)];
      const xr = lum[y * W + ((x + 1) % W)];
      const yt = lum[((y - 1 + H) % H) * W + x];
      const yb = lum[((y + 1) % H) * W + x];
      const dx = (xr - xl) * strength;
      const dy = (yb - yt) * strength;
      const nz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + nz * nz) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const nzn = nz / len;
      const i = (y * W + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nzn * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// ---------- Realistic leaf (variant A — broad maple-ish) ----------
function buildLeaf(variant: 'A' | 'B'): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, S, S);
  const cx = S / 2;

  // Irregular natural silhouette using bezier with subtle wobble
  ctx.beginPath();
  ctx.moveTo(cx, 10);
  if (variant === 'A') {
    ctx.bezierCurveTo(cx + 70, 28, cx + 118, 100, cx + 92, 158);
    ctx.bezierCurveTo(cx + 72, 208, cx + 28, 240, cx, 250);
    ctx.bezierCurveTo(cx - 28, 240, cx - 72, 208, cx - 92, 158);
    ctx.bezierCurveTo(cx - 118, 100, cx - 70, 28, cx, 10);
  } else {
    // Slimmer almond
    ctx.bezierCurveTo(cx + 52, 30, cx + 92, 110, cx + 78, 160);
    ctx.bezierCurveTo(cx + 60, 210, cx + 22, 244, cx, 252);
    ctx.bezierCurveTo(cx - 22, 244, cx - 60, 210, cx - 78, 160);
    ctx.bezierCurveTo(cx - 92, 110, cx - 52, 30, cx, 10);
  }
  ctx.closePath();

  // Base mottled green gradient
  const grad = ctx.createLinearGradient(cx - 60, 30, cx + 60, S - 30);
  if (variant === 'A') {
    grad.addColorStop(0, '#A7D98A');
    grad.addColorStop(0.35, '#5FB35A');
    grad.addColorStop(0.7, '#2F8A3E');
    grad.addColorStop(1, '#1B5E20');
  } else {
    grad.addColorStop(0, '#B5DC93');
    grad.addColorStop(0.4, '#6FAA4D');
    grad.addColorStop(0.75, '#3D7A2C');
    grad.addColorStop(1, '#244D17');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  // Mottled noise inside leaf
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = Math.random() * 2.4;
    const a = Math.random();
    if (a < 0.6) ctx.fillStyle = `rgba(20,60,25,${0.04 + Math.random() * 0.12})`;
    else if (a < 0.85) ctx.fillStyle = `rgba(180,210,120,${0.05 + Math.random() * 0.15})`;
    else ctx.fillStyle = `rgba(160,130,40,${0.04 + Math.random() * 0.1})`; // yellow/brown speckle
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Inner shadow for depth
  const shadow = ctx.createRadialGradient(cx + 28, S - 50, 12, cx + 28, S - 50, 200);
  shadow.addColorStop(0, 'rgba(10,40,15,0.5)');
  shadow.addColorStop(1, 'rgba(10,40,15,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, S, S);

  // Soft highlight sheen
  const high = ctx.createLinearGradient(cx - 50, 20, cx + 30, 130);
  high.addColorStop(0, 'rgba(255,255,255,0.28)');
  high.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = high;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  // Central midrib
  ctx.strokeStyle = 'rgba(15,50,20,0.75)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(cx, 18);
  ctx.lineTo(cx, S - 18);
  ctx.stroke();

  // Side veins
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(15,50,20,0.45)';
  for (let i = 1; i < 7; i++) {
    const y = 30 + i * 28;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + 30, y + 10, cx + 70, y + 30);
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx - 30, y + 10, cx - 70, y + 30);
    ctx.stroke();
  }

  // Translucent edge — soften silhouette
  ctx.globalCompositeOperation = 'destination-in';
  const edge = ctx.createRadialGradient(cx, S / 2 + 10, 60, cx, S / 2 + 10, 130);
  edge.addColorStop(0, 'rgba(0,0,0,1)');
  edge.addColorStop(0.85, 'rgba(0,0,0,1)');
  edge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, S, S);
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

let leafA: THREE.CanvasTexture | null = null;
let leafB: THREE.CanvasTexture | null = null;
export function getLeafTexture(): THREE.CanvasTexture {
  if (!leafA) leafA = buildLeaf('A');
  return leafA;
}
export function getLeafTextureB(): THREE.CanvasTexture {
  if (!leafB) leafB = buildLeaf('B');
  return leafB;
}

// ---------- Bark color + normal ----------
let barkColorCache: THREE.CanvasTexture | null = null;
let barkNormalCache: THREE.CanvasTexture | null = null;
function buildBarkCanvas(): HTMLCanvasElement {
  const W = 1024;
  const H = 2048;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  // Base wood gradient
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#2E1A0A');
  grad.addColorStop(0.5, '#6B4A2A');
  grad.addColorStop(1, '#2E1A0A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Vertical wood grain striations
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * W;
    const w = 1 + Math.random() * 5;
    ctx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.28})`;
    ctx.fillRect(x, 0, w, H);
  }
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * W;
    ctx.fillStyle = `rgba(220,180,130,${0.05 + Math.random() * 0.14})`;
    ctx.fillRect(x, 0, 1, H);
  }

  // Deep cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * H;
    ctx.lineWidth = 0.6 + Math.random() * 1.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let x = 0;
    while (x < W) {
      x += 6 + Math.random() * 14;
      ctx.lineTo(x, y + (Math.random() - 0.5) * 8);
    }
    ctx.stroke();
  }

  // Knots
  for (let i = 0; i < 6; i++) {
    const kx = Math.random() * W;
    const ky = Math.random() * H;
    const kr = 18 + Math.random() * 28;
    const kg = ctx.createRadialGradient(kx, ky, 2, kx, ky, kr);
    kg.addColorStop(0, 'rgba(20,10,4,0.85)');
    kg.addColorStop(0.6, 'rgba(40,22,10,0.4)');
    kg.addColorStop(1, 'rgba(40,22,10,0)');
    ctx.fillStyle = kg;
    ctx.beginPath();
    ctx.arc(kx, ky, kr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lichen patches near bottom
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    const y = H * 0.5 + Math.random() * H * 0.5;
    const r = 8 + Math.random() * 24;
    const lg = ctx.createRadialGradient(x, y, 1, x, y, r);
    lg.addColorStop(0, 'rgba(140,160,90,0.35)');
    lg.addColorStop(1, 'rgba(140,160,90,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moss gradient at base
  const moss = ctx.createLinearGradient(0, H * 0.78, 0, H);
  moss.addColorStop(0, 'rgba(50,80,45,0)');
  moss.addColorStop(1, 'rgba(50,80,45,0.55)');
  ctx.fillStyle = moss;
  ctx.fillRect(0, H * 0.78, W, H * 0.22);

  return c;
}
export function getBarkTexture(): THREE.CanvasTexture {
  if (barkColorCache) return barkColorCache;
  const c = buildBarkCanvas();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  barkColorCache = tex;
  // Build matching normal
  barkNormalCache = canvasToNormalMap(c, 2.6);
  barkNormalCache.anisotropy = 8;
  return tex;
}
export function getBarkNormalMap(): THREE.CanvasTexture {
  if (!barkNormalCache) {
    getBarkTexture();
  }
  return barkNormalCache!;
}

// ---------- Ground (grass + dirt + clover) ----------
let groundColorCache: THREE.CanvasTexture | null = null;
let groundNormalCache: THREE.CanvasTexture | null = null;
function buildGroundCanvas(): HTMLCanvasElement {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;

  // Base
  const grad = ctx.createRadialGradient(S / 2, S / 2, 60, S / 2, S / 2, S / 2);
  grad.addColorStop(0, '#7E9B5C');
  grad.addColorStop(0.4, '#6A8A4A');
  grad.addColorStop(0.8, '#54743A');
  grad.addColorStop(1, '#3F5A2C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Dirt patches
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 18 + Math.random() * 50;
    const dg = ctx.createRadialGradient(x, y, 2, x, y, r);
    dg.addColorStop(0, 'rgba(90,60,30,0.45)');
    dg.addColorStop(1, 'rgba(90,60,30,0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny noise / soil specks
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = Math.random() * 1.4;
    ctx.fillStyle = `rgba(30,40,18,${Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass blades
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const a = 0.35 + Math.random() * 0.4;
    ctx.strokeStyle = `rgba(${60 + Math.random() * 50},${110 + Math.random() * 50},${50 + Math.random() * 30},${a})`;
    ctx.lineWidth = 0.7 + Math.random() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 5, y - 4 - Math.random() * 6);
    ctx.stroke();
  }

  // Clover dots
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    ctx.fillStyle = `rgba(80,140,70,${0.4 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fallen leaf hints
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    ctx.fillStyle = `rgba(${140 + Math.random() * 60},${90 + Math.random() * 40},${30 + Math.random() * 20},${0.25 + Math.random() * 0.25})`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4 + Math.random() * 3, 2 + Math.random() * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return c;
}
export function getGroundTexture(): THREE.CanvasTexture {
  if (groundColorCache) return groundColorCache;
  const c = buildGroundCanvas();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  groundColorCache = tex;
  groundNormalCache = canvasToNormalMap(c, 1.4);
  groundNormalCache.anisotropy = 8;
  return tex;
}
export function getGroundNormalMap(): THREE.CanvasTexture {
  if (!groundNormalCache) getGroundTexture();
  return groundNormalCache!;
}

// ---------- Leaf atlas (4 variants in 2x2 grid) ----------
let leafAtlasCache: THREE.CanvasTexture | null = null;

function drawLeafShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  variant: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  if (variant === 0) {
    const r = size * 0.5;
    const lobes = 7;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const ang = -Math.PI / 2 + t * Math.PI * 2;
      const wob = 0.78 + Math.sin(t * Math.PI * lobes) * 0.18;
      const rad = r * wob * (1 - 0.15 * Math.abs(Math.sin(ang)));
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad * 1.25;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  } else if (variant === 1) {
    const r = size * 0.5;
    const points = 5;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const ang = -Math.PI / 2 + t * Math.PI * 2;
      const sharp = Math.pow(Math.abs(Math.cos(ang * points * 0.5)), 0.5);
      const rad = r * (0.55 + 0.45 * sharp);
      ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad * 1.15);
    }
  } else if (variant === 2) {
    ctx.ellipse(0, 0, size * 0.32, size * 0.5, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(0, -size * 0.55);
    ctx.bezierCurveTo(size * 0.3, -size * 0.3, size * 0.25, size * 0.4, 0, size * 0.55);
    ctx.bezierCurveTo(-size * 0.25, size * 0.4, -size * 0.3, -size * 0.3, 0, -size * 0.55);
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, -size * 0.1, size * 0.05, 0, 0, size * 0.55);
  const palette = [
    ['#8fbf5e', '#3f7a2e'],
    ['#a3c96a', '#4a8a36'],
    ['#7fb854', '#356826'],
    ['#9fc965', '#467d2f'],
  ];
  const [c1, c2] = palette[variant];
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(40, 70, 30, 0.35)';
  ctx.lineWidth = Math.max(1, size * 0.008);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(0, size * 0.5);
  for (let i = 1; i <= 4; i++) {
    const y = -size * 0.4 + (i / 5) * size * 0.85;
    const w = size * 0.28 * (1 - Math.abs(i - 2.5) / 3);
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + size * 0.05);
    ctx.moveTo(0, y);
    ctx.lineTo(-w, y + size * 0.05);
  }
  ctx.stroke();

  ctx.globalCompositeOperation = 'lighter';
  const hl = ctx.createRadialGradient(-size * 0.15, -size * 0.2, 0, 0, 0, size * 0.4);
  hl.addColorStop(0, 'rgba(255,255,255,0.18)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();
}

export function getLeafAtlas(): THREE.CanvasTexture {
  if (leafAtlasCache) return leafAtlasCache;
  const SIZE = 1024;
  const CELL = SIZE / 2;
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, SIZE, SIZE);

  for (let v = 0; v < 4; v++) {
    const col = v % 2;
    const row = Math.floor(v / 2);
    const cx = col * CELL + CELL / 2;
    const cy = row * CELL + CELL / 2;
    drawLeafShape(ctx, cx, cy, CELL * 0.92, v);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  leafAtlasCache = tex;
  return tex;
}

