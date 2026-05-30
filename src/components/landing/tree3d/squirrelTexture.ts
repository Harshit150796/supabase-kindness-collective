import * as THREE from 'three';

export function makeSquirrelTexture() {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 96, 96);
  ctx.fillStyle = '#8B5A2B';
  ctx.beginPath();
  ctx.ellipse(48, 58, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, 32, 14, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(38, 22, 4, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(58, 22, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#A0703A';
  ctx.beginPath();
  ctx.ellipse(74, 50, 10, 22, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D9B58A';
  ctx.beginPath();
  ctx.ellipse(48, 62, 9, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(43, 30, 2, 0, Math.PI * 2);
  ctx.arc(53, 30, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b2412';
  ctx.beginPath();
  ctx.arc(48, 36, 1.5, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeRabbitTexture() {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 96, 96);
  // Body
  ctx.fillStyle = '#C9C2B5';
  ctx.beginPath();
  ctx.ellipse(48, 62, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(48, 40, 13, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Long ears
  ctx.beginPath();
  ctx.ellipse(40, 20, 4, 14, -0.15, 0, Math.PI * 2);
  ctx.ellipse(56, 20, 4, 14, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Inner ears
  ctx.fillStyle = '#F2D6D6';
  ctx.beginPath();
  ctx.ellipse(40, 22, 1.8, 9, -0.15, 0, Math.PI * 2);
  ctx.ellipse(56, 22, 1.8, 9, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Belly / tail
  ctx.fillStyle = '#F5F1E8';
  ctx.beginPath();
  ctx.ellipse(48, 68, 10, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(28, 62, 5, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(43, 39, 1.8, 0, Math.PI * 2);
  ctx.arc(53, 39, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Nose
  ctx.fillStyle = '#E08A8A';
  ctx.beginPath();
  ctx.arc(48, 45, 1.4, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _squirrel: THREE.Texture | null = null;
let _rabbit: THREE.Texture | null = null;
export function getSharedSquirrelTexture() {
  if (!_squirrel) _squirrel = makeSquirrelTexture();
  return _squirrel;
}
export function getSharedRabbitTexture() {
  if (!_rabbit) _rabbit = makeRabbitTexture();
  return _rabbit;
}
