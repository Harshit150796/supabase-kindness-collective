import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFBX } from '@react-three/drei';
import { FoliageInstanced } from './FoliageInstanced';

export interface CanopyVolume {
  center: THREE.Vector3;
  radius: number;
}

export function getCanopyVolume(): CanopyVolume {
  return { center: new THREE.Vector3(0, 4.5, 0), radius: 2.4 };
}

// Backward-compat: coupon system still calls getBranchTips()
export interface BranchTip {
  tip: THREE.Vector3;
}
export function getBranchTips(): BranchTip[] {
  // Hand-tuned spots around the canopy outer shell where coupons hang nicely
  const tips: BranchTip[] = [];
  const { center, radius } = getCanopyVolume();
  const positions: [number, number, number][] = [
    [0.85, -0.1, 0.6],
    [-0.9, 0.05, 0.5],
    [0.7, 0.2, -0.7],
    [-0.7, 0.15, -0.7],
    [0.3, 0.55, 0.4],
    [-0.4, 0.5, -0.3],
    [0.95, 0.3, -0.1],
    [-0.95, 0.25, 0.1],
    [0.2, -0.15, 0.9],
    [-0.2, -0.1, -0.9],
    [0.55, -0.25, -0.55],
    [-0.55, -0.2, 0.55],
    [0.0, 0.6, 0.7],
    [0.0, 0.55, -0.7],
    [0.75, 0.45, 0.3],
    [-0.75, 0.4, -0.3],
  ];
  positions.forEach(([x, y, z]) => {
    tips.push({
      tip: new THREE.Vector3(
        center.x + x * radius,
        center.y + y * radius,
        center.z + z * radius
      ),
    });
  });
  return tips;
}

function FBXTrunk() {
  const fbx = useFBX('/models/tree.fbx');
  const ref = useRef<THREE.Group>(null);

  const prepared = useMemo(() => {
    const cloned = fbx.clone(true);

    // Compute bounding box for auto-scale
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetHeight = 6.5;
    const scale = size.y > 0 ? targetHeight / size.y : 1;
    cloned.scale.setScalar(scale);

    // Recompute box after scale
    const box2 = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box2.getCenter(center);
    cloned.position.x -= center.x;
    cloned.position.z -= center.z;
    cloned.position.y -= box2.min.y;

    // Filter foliage meshes, fix materials
    const toRemove: THREE.Object3D[] = [];
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = (mesh.name || '').toLowerCase();
        const matName = (
          (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.name || ''
        ).toLowerCase();

        const looksLikeFoliage =
          /leaf|leaves|foliage|canopy|crown/.test(name) ||
          /leaf|leaves|foliage/.test(matName);

        if (looksLikeFoliage) {
          toRemove.push(mesh);
          return;
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Replace material with a clean MeshStandardMaterial (bark-like)
        const orig = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const origMap = (orig as THREE.MeshStandardMaterial)?.map ?? null;
        const origColor =
          (orig as THREE.MeshStandardMaterial)?.color?.clone() ??
          new THREE.Color('#6B4A2B');

        mesh.material = new THREE.MeshStandardMaterial({
          map: origMap,
          color: origMap ? new THREE.Color('#ffffff') : origColor,
          roughness: 0.92,
          metalness: 0.02,
        });
      }
    });
    toRemove.forEach((m) => m.parent?.remove(m));

    return cloned;
  }, [fbx]);

  useEffect(() => {
    if (ref.current) {
      // ensure shadows enabled after mount
      ref.current.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).castShadow = true;
          (c as THREE.Mesh).receiveShadow = true;
        }
      });
    }
  }, [prepared]);

  return <primitive ref={ref} object={prepared} />;
}

export function Tree({ leafCount = 3000 }: { leafCount?: number }) {
  const canopy = useMemo(() => getCanopyVolume(), []);
  return (
    <group>
      <FBXTrunk />
      <FoliageInstanced
        canopy={canopy}
        instanceCount={leafCount}
      />
    </group>
  );
}
