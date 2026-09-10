import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';

const MODEL_URL = '/models/tree.glb';
useGLTF.preload(MODEL_URL);

export interface BranchTip {
  tip: THREE.Vector3;
}

const CANOPY_CENTER = new THREE.Vector3(0, 4.4, 0);
const CANOPY_RADIUS = 2.3;

/**
 * Single source of truth for the leaf wind displacement. The visible material and
 * the shadow depth material share this snippet (and the same uniforms), so the
 * shadow silhouette tracks the sway exactly.
 */
const WIND_VERTEX_SNIPPET = `
  vec3 transformed = vec3(position);
  float h = clamp((position.y) * 0.15 + 0.5, 0.0, 1.0);
  float amp = 0.05 + uWind * 0.18;
  float sway = sin(uTime * 1.1 + position.y * 0.6 + position.x * 0.4) * amp
             + sin(uTime * 0.6 + position.z * 0.5) * amp * 0.6;
  transformed.x += sway * h;
  transformed.z += sway * 0.5 * h;
`;

export function getBranchTips(): BranchTip[] {
  const tips: BranchTip[] = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (i / (N - 1)) * 1.2;
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

export function Tree(_props: { leafCount?: number; lowPower?: boolean }) {
  const { scene } = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group };
  const gl = useThree((s) => s.gl);
  const rootRef = useRef<THREE.Group>(null);
  const uTime = useRef({ value: 0 });
  const uWind = useRef({ value: 0 });
  const { shakeEvent, windRef } = useInteraction();
  const lowPower = !!_props.lowPower;

  // Renderer capabilities — read once, never assumed.
  const caps = useMemo(() => {
    let msaa = false;
    let maxAniso = 1;
    try {
      const ctx = gl.getContext();
      msaa = !!ctx.getContextAttributes?.()?.antialias;
    } catch {
      msaa = false;
    }
    try {
      maxAniso = gl.capabilities.getMaxAnisotropy() || 1;
    } catch {
      maxAniso = 1;
    }
    return { msaa, aniso: Math.min(maxAniso, lowPower ? 8 : 16) };
  }, [gl, lowPower]);

  const prepared = useMemo(() => {
    const root = scene.clone(true);

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetHeight = 6.2;
    const scale = targetHeight / Math.max(size.y, 0.001);
    root.scale.setScalar(scale);
    const box2 = new THREE.Box3().setFromObject(root);
    root.position.x -= (box2.min.x + box2.max.x) / 2;
    root.position.z -= (box2.min.z + box2.max.z) / 2;
    root.position.y -= box2.min.y;

    const tuneTexture = (tex: THREE.Texture | null | undefined, aniso: number) => {
      if (!tex) return;
      tex.anisotropy = Math.max(tex.anisotropy || 1, aniso);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    };

    const applyWind = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uTime = uTime.current;
      shader.uniforms.uWind = uWind.current;
      shader.vertexShader = `uniform float uTime;\nuniform float uWind;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', WIND_VERTEX_SNIPPET);
    };

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // Disable raycasting on tree meshes — hit zones handle clicks
      mesh.raycast = () => {};

      let leafMap: THREE.Texture | null = null;
      let leafAlphaTest = 0.45;

      const upgrade = (mat: THREE.Material): THREE.Material => {
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
          // alphaToCoverage smooths the cutout edge, but only in an MSAA context.
          const canCoverage = caps.msaa;
          m.alphaToCoverage = canCoverage;
          m.alphaTest = canCoverage ? 0.35 : Math.max(m.alphaTest || 0, 0.45);
          m.transparent = false;
          m.roughness = 0.78;
          m.metalness = 0;
          m.color.setRGB(0.92, 1.02, 0.85);
          tuneTexture(m.map, caps.aniso);
          leafMap = m.map ?? null;
          leafAlphaTest = m.alphaTest;
          m.onBeforeCompile = applyWind;
        } else {
          m.roughness = 0.92;
          m.metalness = 0.02;
          tuneTexture(m.map, caps.aniso);
        }
        m.needsUpdate = true;
        return m;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(upgrade);
      } else if (mesh.material) {
        mesh.material = upgrade(mesh.material);
      }

      // Alpha-cutout + vertex-displaced meshes need their own depth material,
      // otherwise the directional light casts an opaque, non-swaying quad.
      if (leafMap) {
        const depthMat = new THREE.MeshDepthMaterial({
          depthPacking: THREE.RGBADepthPacking,
          map: leafMap,
          alphaMap: leafMap,
          alphaTest: leafAlphaTest,
        });
        depthMat.onBeforeCompile = applyWind;
        mesh.customDepthMaterial = depthMat;
      }
    });

    return root;
  }, [scene, caps]);

  useFrame((_, dt) => {
    uTime.current.value += dt;

    // Wind decays
    windRef.current.value = Math.max(0, windRef.current.value - dt * 1.2);
    uWind.current.value = windRef.current.value;

    // Shake wobble on root
    if (rootRef.current && shakeEvent) {
      const elapsed = performance.now() / 1000 - shakeEvent.time;
      if (elapsed < 1.4) {
        const decay = Math.exp(-elapsed * 2.5);
        const wobble = Math.sin(elapsed * 18) * 0.04 * decay;
        rootRef.current.rotation.z = wobble;
        rootRef.current.rotation.x = wobble * 0.4;
      } else {
        rootRef.current.rotation.z = 0;
        rootRef.current.rotation.x = 0;
      }
    }
  });

  useEffect(() => {
    return () => {
      prepared.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
          mesh.customDepthMaterial?.dispose();
        }
      });
    };
  }, [prepared]);

  return <primitive ref={rootRef} object={prepared} />;
}
