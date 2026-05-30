import * as THREE from 'three';

export function makeBirdTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.quadraticCurveTo(8, 10, 4, 28);
  ctx.quadraticCurveTo(18, 26, 32, 34);
  ctx.quadraticCurveTo(46, 26, 60, 28);
  ctx.quadraticCurveTo(56, 10, 32, 32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(32, 33, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _shared: THREE.Texture | null = null;
export function getSharedBirdTexture() {
  if (!_shared) _shared = makeBirdTexture();
  return _shared;
}
