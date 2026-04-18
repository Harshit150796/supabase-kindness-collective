import { useMemo } from 'react';
import * as THREE from 'three';
import { getBarkTexture, getBarkNormalMap } from './textures';
import { FoliageInstanced } from './FoliageInstanced';

export interface BranchTip {
  tip: THREE.Vector3;
}

// Bigger, more spread tree — branches reach out more for full canopy
const BRANCH_CURVES: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
  // 8 main branches in a radial pattern
  [new THREE.Vector3(0, 2.8, 0), new THREE.Vector3(0.6, 3.4, 0.3), new THREE.Vector3(1.6, 3.9, 0.6), new THREE.Vector3(2.6, 4.2, 0.7)],
  [new THREE.Vector3(0, 2.9, 0), new THREE.Vector3(-0.6, 3.4, 0.4), new THREE.Vector3(-1.7, 3.9, 0.7), new THREE.Vector3(-2.7, 4.3, 0.8)],
  [new THREE.Vector3(0, 3.1, 0), new THREE.Vector3(0.5, 3.6, -0.5), new THREE.Vector3(1.4, 4.0, -1.2), new THREE.Vector3(2.2, 4.4, -1.7)],
  [new THREE.Vector3(0, 3.1, 0), new THREE.Vector3(-0.5, 3.6, -0.4), new THREE.Vector3(-1.4, 4.0, -1.1), new THREE.Vector3(-2.1, 4.4, -1.6)],
  [new THREE.Vector3(0, 3.2, 0), new THREE.Vector3(0.2, 3.9, 0.3), new THREE.Vector3(0.5, 4.6, 0.5), new THREE.Vector3(0.9, 5.2, 0.5)],
  [new THREE.Vector3(0, 3.2, 0), new THREE.Vector3(-0.2, 3.9, 0.2), new THREE.Vector3(-0.6, 4.6, 0.4), new THREE.Vector3(-1.0, 5.3, 0.4)],
  [new THREE.Vector3(0, 3.3, 0), new THREE.Vector3(0.8, 3.8, -0.2), new THREE.Vector3(1.8, 4.2, -0.3), new THREE.Vector3(2.5, 4.7, -0.4)],
  [new THREE.Vector3(0, 3.3, 0), new THREE.Vector3(-0.8, 3.8, -0.2), new THREE.Vector3(-1.9, 4.2, -0.3), new THREE.Vector3(-2.6, 4.7, -0.4)],
];

export function getBranchTips(): BranchTip[] {
  const tips: BranchTip[] = [];
  BRANCH_CURVES.forEach((c) => {
    const curve = new THREE.CubicBezierCurve3(c[0], c[1], c[2], c[3]);
    tips.push({ tip: curve.getPoint(0.95).clone() });
    tips.push({ tip: curve.getPoint(0.65).clone().add(new THREE.Vector3(0, -0.05, 0.15)) });
  });
  return tips;
}

function Trunk() {
  const tex = useMemo(() => getBarkTexture(), []);
  const nrm = useMemo(() => getBarkNormalMap(), []);

  const trunkGeom = useMemo(() => {
    const pts = [
      new THREE.Vector3(0.05, 0, 0.02),
      new THREE.Vector3(-0.04, 0.8, 0.05),
      new THREE.Vector3(0.06, 1.6, -0.04),
      new THREE.Vector3(-0.02, 2.4, 0.06),
      new THREE.Vector3(0.02, 3.1, 0.0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const radialSegments = 22;
    const tubularSegments = 64;
    const geo = new THREE.TubeGeometry(curve, tubularSegments, 0.5, radialSegments, false);
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
      const targetR = 0.5 * (1 - t * 0.6) + Math.sin(t * 8) * 0.014;
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
      <meshStandardMaterial map={tex} normalMap={nrm} normalScale={new THREE.Vector2(1.2, 1.2)} roughness={0.95} metalness={0.02} />
    </mesh>
  );
}

function Roots() {
  const tex = useMemo(() => getBarkTexture(), []);
  const nrm = useMemo(() => getBarkNormalMap(), []);
  const roots = useMemo(() => {
    const arr: { geom: THREE.TubeGeometry }[] = [];
    const N = 7;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2 + 0.3;
      const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const start = new THREE.Vector3(0, 0.2, 0);
      const ctrl1 = dir.clone().multiplyScalar(0.5).setY(0.05);
      const ctrl2 = dir.clone().multiplyScalar(1.0).setY(-0.05);
      const end = dir.clone().multiplyScalar(1.5).setY(-0.1);
      const curve = new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
      arr.push({ geom: new THREE.TubeGeometry(curve, 16, 0.16, 8, false) });
    }
    return arr;
  }, []);

  return (
    <group>
      {roots.map((r, i) => (
        <mesh key={i} geometry={r.geom} castShadow receiveShadow>
          <meshStandardMaterial map={tex} normalMap={nrm} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Branches() {
  const tex = useMemo(() => getBarkTexture(), []);
  const nrm = useMemo(() => getBarkNormalMap(), []);

  // Tertiary twigs branching from each main branch
  const twigGeoms = useMemo(() => {
    const arr: THREE.TubeGeometry[] = [];
    BRANCH_CURVES.forEach((c) => {
      const curve = new THREE.CubicBezierCurve3(c[0], c[1], c[2], c[3]);
      // 3 twigs per branch at t=0.55, 0.75, 0.9
      [0.55, 0.72, 0.88].forEach((t) => {
        const base = curve.getPoint(t);
        const tan = curve.getTangent(t).normalize();
        // Perpendicular offset
        const perp = new THREE.Vector3(-tan.z, 0.3, tan.x).normalize();
        const dir = perp.clone().multiplyScalar(0.6 + Math.random() * 0.4);
        const ctrl1 = base.clone().add(dir.clone().multiplyScalar(0.3));
        const ctrl2 = base.clone().add(dir.clone().multiplyScalar(0.7)).add(new THREE.Vector3(0, 0.15, 0));
        const end = base.clone().add(dir).add(new THREE.Vector3(0, 0.25, 0));
        const tc = new THREE.CubicBezierCurve3(base, ctrl1, ctrl2, end);
        arr.push(new THREE.TubeGeometry(tc, 10, 0.04, 6, false));
      });
    });
    return arr;
  }, []);
  const branchGeoms = useMemo(() => {
    return BRANCH_CURVES.map((c) => {
      const curve = new THREE.CubicBezierCurve3(c[0], c[1], c[2], c[3]);
      const baseR = 0.16;
      const tipR = 0.04;
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
      return geo;
    });
  }, []);
  return (
    <group>
      {branchGeoms.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial map={tex} normalMap={nrm} roughness={0.92} />
        </mesh>
      ))}
      {twigGeoms.map((g, i) => (
        <mesh key={`tw-${i}`} geometry={g} castShadow>
          <meshStandardMaterial map={tex} normalMap={nrm} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export function Tree({ leafCount = 5000 }: { leafCount?: number }) {
  const tips = useMemo(() => getBranchTips(), []);

  // Lots of cluster centers for a full, dense canopy
  const clusterCenters = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    // Cluster around each tip + along each branch
    BRANCH_CURVES.forEach((c) => {
      const curve = new THREE.CubicBezierCurve3(c[0], c[1], c[2], c[3]);
      for (let t = 0.55; t <= 1.0; t += 0.12) {
        const p = curve.getPoint(t);
        arr.push(p.clone().add(new THREE.Vector3(0, 0.25, 0)));
      }
    });
    // Crown bulk on top
    arr.push(new THREE.Vector3(0, 4.6, 0));
    arr.push(new THREE.Vector3(0.4, 4.4, 0.3));
    arr.push(new THREE.Vector3(-0.4, 4.4, -0.3));
    arr.push(new THREE.Vector3(0.6, 4.0, -0.5));
    arr.push(new THREE.Vector3(-0.6, 4.0, 0.5));
    arr.push(new THREE.Vector3(0, 5.0, 0));
    return arr;
  }, []);

  return (
    <group>
      <Roots />
      <Trunk />
      <Branches />
      <FoliageInstanced clusters={clusterCenters} totalCount={leafCount} clusterRadius={1.4} />
    </group>
  );
}
