import * as THREE from 'three';

// ---- Realistic maple/oak-style leaf texture ----
let leafTextureCache: THREE.CanvasTexture | null = null;
export function getLeafTexture(): THREE.CanvasTexture {
  if (leafTextureCache) return leafTextureCache;
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, S, S);

  const cx = S / 2;

  // Lush leaf silhouette — wider almond with serrated hint
  ctx.beginPath();
  ctx.moveTo(cx, 14);
  // Right side
  ctx.bezierCurveTo(cx + 60, 30, cx + 110, 90, cx + 95, 145);
  ctx.bezierCurveTo(cx + 80, 195, cx + 30, 232, cx, 244);
  // Left side
  ctx.bezierCurveTo(cx - 30, 232, cx - 80, 195, cx - 95, 145);
  ctx.bezierCurveTo(cx - 110, 90, cx - 60, 30, cx, 14);
  ctx.closePath();

  // Multi-stop gradient for depth
  const grad = ctx.createLinearGradient(cx - 60, 30, cx + 60, S - 30);
  grad.addColorStop(0, '#86EFAC');
  grad.addColorStop(0.35, '#34D399');
  grad.addColorStop(0.7, '#10B981');
  grad.addColorStop(1, '#065F46');
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle inner shadow (depth)
  ctx.save();
  ctx.clip();
  const shadow = ctx.createRadialGradient(cx + 30, S - 40, 10, cx + 30, S - 40, 180);
  shadow.addColorStop(0, 'rgba(4, 71, 55, 0.45)');
  shadow.addColorStop(1, 'rgba(4, 71, 55, 0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  // Highlight sheen
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, 14);
  ctx.bezierCurveTo(cx + 60, 30, cx + 110, 90, cx + 95, 145);
  ctx.bezierCurveTo(cx + 80, 195, cx + 30, 232, cx, 244);
  ctx.bezierCurveTo(cx - 30, 232, cx - 80, 195, cx - 95, 145);
  ctx.bezierCurveTo(cx - 110, 90, cx - 60, 30, cx, 14);
  ctx.closePath();
  ctx.clip();
  const high = ctx.createLinearGradient(cx - 50, 20, cx + 20, 120);
  high.addColorStop(0, 'rgba(255,255,255,0.35)');
  high.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = high;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  // Central vein
  ctx.strokeStyle = 'rgba(4,71,55,0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, 22);
  ctx.lineTo(cx, S - 22);
  ctx.stroke();

  // Side veins (curved)
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = 'rgba(4,71,55,0.45)';
  for (let i = 1; i < 6; i++) {
    const y = 40 + i * 30;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + 35, y + 10, cx + 65, y + 28);
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx - 35, y + 10, cx - 65, y + 28);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  leafTextureCache = tex;
  return tex;
}

// ---- Bark texture ----
let barkTexCache: THREE.CanvasTexture | null = null;
export function getBarkTexture(): THREE.CanvasTexture {
  if (barkTexCache) return barkTexCache;
  const W = 512;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#3D2410');
  grad.addColorStop(0.5, '#6B4422');
  grad.addColorStop(1, '#3D2410');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * W;
    const w = 1 + Math.random() * 4;
    ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.25})`;
    ctx.fillRect(x, 0, w, H);
  }
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * W;
    ctx.fillStyle = `rgba(200,160,110,${0.06 + Math.random() * 0.12})`;
    ctx.fillRect(x, 0, 1, H);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * H;
    ctx.lineWidth = 0.5 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let x = 0;
    while (x < W) {
      x += 8 + Math.random() * 16;
      ctx.lineTo(x, y + (Math.random() - 0.5) * 6);
    }
    ctx.stroke();
  }
  const moss = ctx.createLinearGradient(0, H * 0.7, 0, H);
  moss.addColorStop(0, 'rgba(61,90,64,0)');
  moss.addColorStop(1, 'rgba(61,90,64,0.4)');
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

// ---- Ground texture ----
let groundTexCache: THREE.CanvasTexture | null = null;
export function getGroundTexture(): THREE.CanvasTexture {
  if (groundTexCache) return groundTexCache;
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(S / 2, S / 2, 60, S / 2, S / 2, S / 2);
  grad.addColorStop(0, '#C9D9A8');
  grad.addColorStop(0.4, '#A8B58C');
  grad.addColorStop(0.8, '#7A8A60');
  grad.addColorStop(1, '#5A6B45');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = Math.random() * 1.8;
    ctx.fillStyle = `rgba(40,55,25,${Math.random() * 0.22})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Grass tufts
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    ctx.strokeStyle = `rgba(80,120,60,${0.3 + Math.random() * 0.3})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 3 - Math.random() * 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  groundTexCache = tex;
  return tex;
}
