import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MODEL_URL = '/models/tree.glb';
useGLTF.preload(MODEL_URL);

export interface BranchTip {
  tip: THREE.Vector3;
}

// Sample points around the canopy outer shell for coupon-fruit attachment.
// Center & radius are tuned to the mango GLB after auto-scale to 6 units tall.
const CANOPY_CENTER = new THREE.Vector3(0, 4.4, 0);
const CANOPY_RADIUS = 2.3;

export function getBranchTips(): BranchTip[] {
  const tips: BranchTip[] = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (i / (N - 1)) * 1.2; // bias toward upper hemisphere
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const p = new THREE.Vector3(
      Math.cos(theta) * r,
      y * 0.7 + 0.1,
      Math.sin(theta) * r
    )
      .multiplyScalar(CANOPY_RADIUS * 0.95)
      .add(CANOPY_CENTER);
    tips.push({ tip: p });
  }
  return tips;
}

export function Tree(_props: { leafCount?: number }) {
  const { scene } = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group };
  const rootRef = useRef<THREE.Group>(null);
  const leafMatsRef = useRef<THREE.Material[]>([]);
  const uTime = useRef({ value: 0 });

  const prepared = useMemo(() => {
    const root = scene.clone(true);

    // Compute bounding box and auto-scale to ~6 units tall, base at y=0
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 6.2;
    const scale = targetHeight / Math.max(size.y, 0.001);
    root.scale.setScalar(scale);
    // Recompute after scale
    const box2 = new THREE.Box3().setFromObject(root);
    root.position.x -= (box2.min.x + box2.max.x) / 2;
    root.position.z -= (box2.min.z + box2.max.z) / 2;
    root.position.y -= box2.min.y;

    const leafMats: THREE.Material[] = [];

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const upgrade = (mat: THREE.Material): THREE.Material => {
        // Already a Standard/Physical material — keep, just tweak
        const anyMat = mat as THREE.MeshStandardMaterial &
          THREE.MeshPhysicalMaterial & { map?: THREE.Texture; alphaMap?: THREE.Texture };
        let m: THREE.MeshStandardMaterial;
        if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          m = mat as THREE.MeshStandardMaterial;
        } else {
          m = new THREE.MeshStandardMaterial({
            map: anyMat.map ?? null,
            color: (mat as THREE.MeshBasicMaterial).color?.clone?.() ?? new THREE.Color(0xffffff),
            transparent: anyMat.transparent ?? false,
            alphaTest: anyMat.alphaTest ?? 0,
            side: (mat as THREE.MeshBasicMaterial).side ?? THREE.FrontSide,
          });
        }

        const isLeaf = m.transparent || (m.alphaTest && m.alphaTest > 0) || /leaf|leaves|foliage/i.test(mesh.name) || /leaf|leaves/i.test(m.name || '');
        if (isLeaf) {
          m.side = THREE.DoubleSide;
          m.alphaTest = Math.max(m.alphaTest || 0, 0.45);
          m.transparent = false; // alphaTest only — better shadows & sorting
          m.roughness = 0.78;
          m.metalness = 0;
          // Greener tint
          m.color.setRGB(0.92, 1.02, 0.85);
          // Wind sway shader injection
          m.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = uTime.current;
            shader.vertexShader =
              `uniform float uTime;\nattribute vec3 nope;\n` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
                vec3 transformed = vec3(position);
                float h = clamp((position.y) * 0.15 + 0.5, 0.0, 1.0);
                float sway = sin(uTime * 1.1 + position.y * 0.6 + position.x * 0.4) * 0.05
                           + sin(uTime * 0.6 + position.z * 0.5) * 0.03;
                transformed.x += sway * h;
                transformed.z += sway * 0.5 * h;
              `
            );
          };
          leafMats.push(m);
        } else {
          // Trunk / branches
          m.roughness = 0.92;
          m.metalness = 0.02;
          if (m.map) m.map.anisotropy = 8;
        }
        m.needsUpdate = true;
        return m;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(upgrade);
      } else if (mesh.material) {
        mesh.material = upgrade(mesh.material);
      }
    });

    leafMatsRef.current = leafMats;
    return root;
  }, [scene]);

  useFrame((_, dt) => {
    uTime.current.value += dt;
  });

  useEffect(() => {
    return () => {
      // Dispose cloned materials/geometries to avoid leaks on hot-reload
      prepared.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
        }
      });
    };
  }, [prepared]);

  return <primitive ref={rootRef} object={prepared} />;
}
