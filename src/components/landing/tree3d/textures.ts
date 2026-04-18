import * as THREE from 'three';

// ---- Leaf alpha + color texture ----
let leafTextureCache: THREE.CanvasTexture | null = null;
export function getLeafTexture(): THREE.CanvasTexture {
  if (leafTextureCache) return leafTextureCache;
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, S, S);

  // Almond leaf shape with gradient
  const cx = S / 2;
  const cy = S / 2;
  const grad = ctx.createLinearGradient(cx, 20, cx, S - 20);
  grad.addColorStop(0, '#34D399');
  grad.addColorStop(0.5, '#10B981');
  grad.addColorStop(1, '#047857');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx, 18);
  ctx.bezierCurveTo(cx + 90, 60, cx + 70, S - 40, cx, S - 18);
  ctx.bezierCurveTo(cx - 70, S - 40, cx - 90, 60, cx, 18);
  ctx.closePath();
  ctx.fill();

  // Central vein
  ctx.strokeStyle = 'rgba(4,71,55,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, 24);
  ctx.lineTo(cx, S - 24);
  ctx.stroke();

  // Side veins
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(4,71,55,0.35)';
  for (let i = 1; i < 6; i++) {
    const y = 40 + i * 28;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + 30, y + 6, cx + 55, y + 22);
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx - 30, y + 6, cx - 55, y + 22);
    ctx.stroke();
  }

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx - 12, 70, 22, 40, -0.4, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  leafTextureCache = tex;
  return tex;
}

// ---- Bark color + normal-ish texture ----
let barkTexCache: THREE.CanvasTexture | null = null;
export function getBarkTexture(): THREE.CanvasTexture {
  if (barkTexCache) return barkTexCache;
  const W = 512;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  // Base
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#3D2410');
  grad.addColorStop(0.5, '#5C3A1E');
  grad.addColorStop(1, '#3D2410');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Vertical streaks
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const w = 1 + Math.random() * 3;
    ctx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.18})`;
    ctx.fillRect(x, 0, w, H);
  }
  // Highlights
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    ctx.fillStyle = `rgba(180,140,90,${0.05 + Math.random() * 0.1})`;
    ctx.fillRect(x, 0, 1, H);
  }
  // Horizontal cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * H;
    ctx.lineWidth = 0.5 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let x = 0;
    while (x < W) {
      x += 8 + Math.random() * 16;
      ctx.lineTo(x, y + (Math.random() - 0.5) * 6);
    }
    ctx.stroke();
  }
  // Moss tint at bottom
  const moss = ctx.createLinearGradient(0, H * 0.7, 0, H);
  moss.addColorStop(0, 'rgba(61,90,64,0)');
  moss.addColorStop(1, 'rgba(61,90,64,0.35)');
  ctx.fillStyle = moss;
  ctx.fillRect(0, H * 0.7, W, H * 0.3);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  barkTexCache = tex;
  return tex;
}

// ---- Ground radial gradient ----
let groundTexCache: THREE.CanvasTexture | null = null;
export function getGroundTexture(): THREE.CanvasTexture {
  if (groundTexCache) return groundTexCache;
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(S / 2, S / 2, 60, S / 2, S / 2, S / 2);
  grad.addColorStop(0, '#F5E9C7');
  grad.addColorStop(0.4, '#D9C99A');
  grad.addColorStop(0.8, '#A8B58C');
  grad.addColorStop(1, '#6B7A5A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Speckle
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = Math.random() * 1.6;
    ctx.fillStyle = `rgba(60,50,30,${Math.random() * 0.18})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  groundTexCache = tex;
  return tex;
}
