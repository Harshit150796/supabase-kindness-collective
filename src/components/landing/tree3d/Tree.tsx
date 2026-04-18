import { useMemo } from 'react';
import * as THREE from 'three';
import { getBarkTexture } from './textures';
import { FoliageInstanced } from './FoliageInstanced';

export interface BranchTip {
  tip: THREE.Vector3;
}

// Hand-tuned branch curves (bezier) emerging from the trunk.
// Each entry: [start, ctrl1, ctrl2, end] in world coords.
const BRANCH_CURVES: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
  // Main 6 large branches
  [new THREE.Vector3(0, 2.7, 0), new THREE.Vector3(0.4, 3.2, 0.2), new THREE.Vector3(1.2, 3.6, 0.4), new THREE.Vector3(2.0, 3.9, 0.5)],
  [new THREE.Vector3(0, 2.8, 0), new THREE.Vector3(-0.4, 3.3, 0.3), new THREE.Vector3(-1.3, 3.7, 0.6), new THREE.Vector3(-2.1, 4.0, 0.7)],
  [new THREE.Vector3(0, 3.0, 0), new THREE.Vector3(0.3, 3.5, -0.4), new THREE.Vector3(1.0, 3.9, -1.0), new THREE.Vector3(1.7, 4.2, -1.4)],
  [new THREE.Vector3(0, 3.0, 0), new THREE.Vector3(-0.3, 3.5, -0.3), new THREE.Vector3(-1.0, 3.9, -0.9), new THREE.Vector3(-1.6, 4.2, -1.3)],
  [new THREE.Vector3(0, 3.1, 0), new THREE.Vector3(0.1, 3.7, 0.2), new THREE.Vector3(0.4, 4.3, 0.4), new THREE.Vector3(0.7, 4.8, 0.5)],
  [new THREE.Vector3(0, 3.1, 0), new THREE.Vector3(-0.1, 3.7, 0.1), new THREE.Vector3(-0.5, 4.3, 0.3), new THREE.Vector3(-0.8, 4.9, 0.4)],
  // Secondary upper branches
  [new THREE.Vector3(0, 3.2, 0), new THREE.Vector3(0.6, 3.6, -0.2), new THREE.Vector3(1.4, 4.0, -0.3), new THREE.Vector3(2.0, 4.4, -0.4)],
  [new THREE.Vector3(0, 3.2, 0), new THREE.Vector3(-0.6, 3.6, -0.2), new THREE.Vector3(-1.5, 4.0, -0.3), new THREE.Vector3(-2.1, 4.4, -0.4)],
];

export function getBranchTips(): BranchTip[] {
  // Coupon hanging points: 8 main tips + add 8 sub-tips along branches for 16 total
  const tips: BranchTip[] = [];
  BRANCH_CURVES.forEach((c) => {
    const curve = new THREE.CubicBezierCurve3(c[0], c[1], c[2], c[3]);
    tips.push({ tip: curve.getPoint(1.0).clone() });
    tips.push({ tip: curve.getPoint(0.7).clone().add(new THREE.Vector3(0, -0.05, 0.2)) });
  });
  return tips;
}

function Trunk() {
  const tex = useMemo(() => getBarkTexture(), []);

  const trunkGeom = useMemo(() => {
    // Catmull-Rom curve with slight S-lean
    const pts = [
      new THREE.Vector3(0.05, 0, 0.02),
      new THREE.Vector3(-0.04, 0.7, 0.05),
      new THREE.Vector3(0.06, 1.5, -0.04),
      new THREE.Vector3(-0.02, 2.3, 0.06),
      new THREE.Vector3(0.02, 3.0, 0.0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    // Variable radius via custom tube
    class VariableTube extends THREE.TubeGeometry {}
    const radialSegments = 20;
    const tubularSegments = 64;
    const geo = new THREE.TubeGeometry(curve, tubularSegments, 0.42, radialSegments, false);
    // Taper radius along length manually
    const pos = geo.attributes.position;
    const N = (tubularSegments + 1) * (radialSegments + 1);
    for (let i = 0; i < N; i++) {
      const t = Math.floor(i / (radialSegments + 1)) / tubularSegments;
      const center = curve.getPoint(t);
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dx = x - center.x;
      const dy = y - center.y;
      const dz = z - center.z;
      const targetR = 0.42 * (1 - t * 0.65) + Math.sin(t * 8) * 0.012;
      const curR = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const k = targetR / curR;
      pos.setXYZ(i, center.x + dx * k, center.y + dy * k, center.z + dz * k);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={trunkGeom} castShadow receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.95} metalness={0.02} />
    </mesh>
  );
}

function Roots() {
  const tex = useMemo(() => getBarkTexture(), []);
  const roots = useMemo(() => {
    const arr: { curve: THREE.CubicBezierCurve3; r: number }[] = [];
    const N = 6;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2 + 0.3;
      const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const start = new THREE.Vector3(0, 0.15, 0);
      const ctrl1 = dir.clone().multiplyScalar(0.4).setY(0.05);
      const ctrl2 = dir.clone().multiplyScalar(0.85).setY(-0.05);
      const end = dir.clone().multiplyScalar(1.2).setY(-0.08);
      arr.push({ curve: new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end), r: 0.14 });
    }
    return arr;
  }, []);

  return (
    <group>
      {roots.map((r, i) => (
        <mesh
          key={i}
          geometry={new THREE.TubeGeometry(r.curve, 16, r.r, 8, false)}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial map={tex} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Branches() {
  const tex = useMemo(() => getBarkTexture(), []);
  return (
    <group>
      {BRANCH_CURVES.map((c, i) => {
        const curve = new THREE.CubicBezierCurve3(c[0], c[1], c[2], c[3]);
        const len = curve.getLength();
        const baseR = 0.14;
        const tipR = 0.035;
        // Build tube and then taper radius
        const tubular = 28;
        const radial = 10;
        const geo = new THREE.TubeGeometry(curve, tubular, baseR, radial, false);
        const pos = geo.attributes.position;
        const total = (tubular + 1) * (radial + 1);
        for (let k = 0; k < total; k++) {
          const t = Math.floor(k / (radial + 1)) / tubular;
          const center = curve.getPoint(t);
          const x = pos.getX(k);
          const y = pos.getY(k);
          const z = pos.getZ(k);
          const dx = x - center.x;
          const dy = y - center.y;
          const dz = z - center.z;
          const target = baseR * (1 - t) + tipR * t;
          const cur = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          const s = target / cur;
          pos.setXYZ(k, center.x + dx * s, center.y + dy * s, center.z + dz * s);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        return (
          <mesh key={i} geometry={geo} castShadow receiveShadow>
            <meshStandardMaterial map={tex} roughness={0.92} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Tree({ leafCount = 3500 }: { leafCount?: number }) {
  const tips = useMemo(() => getBranchTips(), []);

  // Foliage cluster centers = tips + crown
  const clusterCenters = useMemo(() => {
    const arr = tips.map((t) => t.tip.clone().add(new THREE.Vector3(0, 0.15, 0)));
    arr.push(new THREE.Vector3(0, 4.2, 0)); // crown top
    arr.push(new THREE.Vector3(0.3, 3.9, 0.2));
    arr.push(new THREE.Vector3(-0.3, 3.9, -0.2));
    return arr;
  }, [tips]);

  return (
    <group>
      <Roots />
      <Trunk />
      <Branches />
      <FoliageInstanced clusters={clusterCenters} totalCount={leafCount} clusterRadius={1.05} />
    </group>
  );
}
