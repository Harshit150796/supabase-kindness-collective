import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getLeafAtlas } from './textures';
import type { CanopyVolume } from './Tree';

interface Props {
  canopy: CanopyVolume;
  instanceCount: number;
  mobile?: boolean;
}

/**
 * Build geometry: 3 crossed planes merged into one (X-shape cluster).
 * Each plane gets its own UV quadrant offset stored in a custom attribute
 * so we can sample 4 atlas cells per *instance* (assigned via aAtlasIdx).
 */
function buildClusterGeometry(): THREE.BufferGeometry {
  const w = 1.0;
  const h = 1.2;
  const planes: THREE.BufferGeometry[] = [];
  const angles = [0, Math.PI / 3, (Math.PI * 2) / 3];
  for (const ang of angles) {
    const g = new THREE.PlaneGeometry(w, h, 1, 2);
    g.rotateY(ang);
    // slight tilt for variety
    g.rotateX((Math.random() - 0.5) * 0.3);
    planes.push(g);
  }
  const merged = mergeGeometries(planes, false)!;
  return merged;
}

export function FoliageInstanced({ canopy, instanceCount, mobile = false }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const uniformsRef = useRef<{ uTime: { value: number } }>({ uTime: { value: 0 } });

  const atlas = useMemo(() => getLeafAtlas(), []);
  const geometry = useMemo(() => buildClusterGeometry(), []);

  const { matrices, phases, atlasIdx, tints } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const ph: number[] = [];
    const ai: number[] = [];
    const tn: THREE.Color[] = [];

    const dummy = new THREE.Object3D();
    const baseGreens = [
      new THREE.Color('#4a7c3a'),
      new THREE.Color('#5b9142'),
      new THREE.Color('#6ba84f'),
      new THREE.Color('#3f6b34'),
      new THREE.Color('#7cb342'),
      new THREE.Color('#558b2f'),
    ];

    for (let i = 0; i < instanceCount; i++) {
      // Sphere distribution with outer-bias falloff
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = canopy.radius * Math.pow(Math.random(), 0.4);

      // Add 3D noise jitter
      const jitter = 0.3;
      const nx = (Math.random() - 0.5) * jitter;
      const ny = (Math.random() - 0.5) * jitter;
      const nz = (Math.random() - 0.5) * jitter;

      const x = canopy.center.x + r * Math.sin(phi) * Math.cos(theta) + nx;
      // squash slightly vertically — natural canopy is wider than tall
      const y = canopy.center.y + r * Math.cos(phi) * 0.85 + ny;
      const z = canopy.center.z + r * Math.sin(phi) * Math.sin(theta) + nz;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI
      );
      const s = 0.35 + Math.random() * 0.35;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();

      mats.push(dummy.matrix.clone());
      ph.push(Math.random() * Math.PI * 2);
      ai.push(Math.floor(Math.random() * 4));

      // HSL tint variation
      const base = baseGreens[Math.floor(Math.random() * baseGreens.length)].clone();
      const hsl = { h: 0, s: 0, l: 0 };
      base.getHSL(hsl);
      hsl.h += (Math.random() - 0.5) * 0.044; // ±8°
      hsl.s = Math.min(1, hsl.s + (Math.random() - 0.5) * 0.1);
      hsl.l = Math.min(1, Math.max(0, hsl.l + (Math.random() - 0.5) * 0.1));
      base.setHSL(hsl.h, hsl.s, hsl.l);
      tn.push(base);
    }
    return { matrices: mats, phases: ph, atlasIdx: ai, tints: tn };
  }, [canopy, instanceCount]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    tints.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    mesh.geometry.setAttribute(
      'aPhase',
      new THREE.InstancedBufferAttribute(new Float32Array(phases), 1)
    );
    mesh.geometry.setAttribute(
      'aAtlasIdx',
      new THREE.InstancedBufferAttribute(new Float32Array(atlasIdx), 1)
    );
  }, [matrices, phases, atlasIdx, tints]);

  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = uniformsRef.current.uTime;

    shader.vertexShader =
      `
      attribute float aPhase;
      attribute float aAtlasIdx;
      uniform float uTime;
      varying float vAtlasIdx;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        vec3 transformed = vec3(position);
        float tipMask = clamp(uv.y, 0.0, 1.0);
        // tip-weighted sway
        transformed.x += sin(uTime * 1.2 + aPhase + position.y * 0.8) * 0.04 * tipMask;
        transformed.z += cos(uTime * 0.9 + aPhase * 1.3) * 0.025 * tipMask;
        vAtlasIdx = aAtlasIdx;
      `
    );

    shader.fragmentShader =
      `
      varying float vAtlasIdx;
    ` + shader.fragmentShader;

    // Remap UV to atlas cell (2x2)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
        #ifdef USE_MAP
          float idx = vAtlasIdx;
          float col = mod(idx, 2.0);
          float row = floor(idx / 2.0);
          vec2 atlasUV = vec2(
            (vMapUv.x * 0.5) + col * 0.5,
            (vMapUv.y * 0.5) + (1.0 - row * 0.5 - 0.5)
          );
          vec4 sampledDiffuseColor = texture2D( map, atlasUV );
          diffuseColor *= sampledDiffuseColor;
        #endif
      `
    );

    // Same remap for alphaMap
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <alphamap_fragment>',
      `
        #ifdef USE_ALPHAMAP
          float idxA = vAtlasIdx;
          float colA = mod(idxA, 2.0);
          float rowA = floor(idxA / 2.0);
          vec2 atlasUVA = vec2(
            (vAlphaMapUv.x * 0.5) + colA * 0.5,
            (vAlphaMapUv.y * 0.5) + (1.0 - rowA * 0.5 - 0.5)
          );
          diffuseColor.a *= texture2D( alphaMap, atlasUVA ).g;
        #endif
      `
    );
  };

  useFrame((_, dt) => {
    uniformsRef.current.uTime.value += dt;
  });

  const material = useMemo(() => {
    const common = {
      map: atlas,
      alphaMap: atlas,
      transparent: true,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.75,
      metalness: 0,
    };
    if (mobile) {
      const m = new THREE.MeshStandardMaterial(common);
      m.onBeforeCompile = onBeforeCompile;
      m.customProgramCacheKey = () => 'foliage-mobile';
      return m;
    }
    const m = new THREE.MeshPhysicalMaterial({
      ...common,
      transmission: 0.35,
      thickness: 0.4,
      ior: 1.4,
    });
    m.onBeforeCompile = onBeforeCompile;
    m.customProgramCacheKey = () => 'foliage-desktop';
    return m;
  }, [atlas, mobile]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instanceCount]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}
