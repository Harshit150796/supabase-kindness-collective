import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getLeafTexture } from './textures';

interface Props {
  clusters: THREE.Vector3[];
  totalCount: number;
  clusterRadius?: number;
}

/**
 * Thousands of instanced leaf cards distributed around branch tips.
 * Wind sway is done in the vertex shader via per-instance phase (stored in instanceColor.r).
 */
export function FoliageInstanced({ clusters, totalCount, clusterRadius = 1.0 }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const uniformsRef = useRef<{ uTime: { value: number } }>({ uTime: { value: 0 } });

  const tex = useMemo(() => getLeafTexture(), []);

  const { matrices, phases, tints } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const ph: number[] = [];
    const tn: THREE.Color[] = [];
    const palette = ['#34D399', '#10B981', '#059669', '#047857', '#86EFAC'].map((c) => new THREE.Color(c));
    const perCluster = Math.ceil(totalCount / clusters.length);
    const dummy = new THREE.Object3D();
    const tmpQ = new THREE.Quaternion();
    const tmpE = new THREE.Euler();

    clusters.forEach((center) => {
      for (let i = 0; i < perCluster && mats.length < totalCount; i++) {
        // Spherical-ish distribution biased outward
        const u = Math.random();
        const v = Math.random();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const r = clusterRadius * Math.pow(Math.random(), 0.55);
        const x = center.x + r * Math.sin(phi) * Math.cos(theta);
        const y = center.y + r * Math.cos(phi) * 0.85;
        const z = center.z + r * Math.sin(phi) * Math.sin(theta);
        dummy.position.set(x, y, z);
        tmpE.set(
          (Math.random() - 0.5) * Math.PI,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI
        );
        tmpQ.setFromEuler(tmpE);
        dummy.quaternion.copy(tmpQ);
        const s = 0.18 + Math.random() * 0.18;
        dummy.scale.set(s, s * 1.4, s);
        dummy.updateMatrix();
        mats.push(dummy.matrix.clone());
        ph.push(Math.random() * Math.PI * 2);
        tn.push(palette[Math.floor(Math.random() * palette.length)]);
      }
    });

    return { matrices: mats, phases: ph, tints: tn };
  }, [clusters, totalCount, clusterRadius]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    tints.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Inject per-instance phase as a custom attribute
    const phaseArr = new Float32Array(phases);
    mesh.geometry.setAttribute(
      'aPhase',
      new THREE.InstancedBufferAttribute(phaseArr, 1)
    );
  }, [matrices, phases, tints]);

  // Wind shader injection
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = uniformsRef.current.uTime;
    shader.vertexShader = `
      attribute float aPhase;
      uniform float uTime;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        vec3 transformed = vec3(position);
        // Wind: more sway at top of leaf (uv.y high). Per-instance phase adds variety.
        float tipMask = clamp(uv.y, 0.0, 1.0);
        float wave = sin(uTime * 1.4 + aPhase) * 0.06 + sin(uTime * 0.7 + aPhase * 1.7) * 0.04;
        transformed.x += wave * tipMask;
        transformed.z += wave * 0.6 * tipMask;
      `
    );
  };

  useFrame((_, dt) => {
    uniformsRef.current.uTime.value += dt;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, totalCount]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1.4, 1, 4]} />
      <meshStandardMaterial
        ref={matRef}
        map={tex}
        alphaMap={tex}
        transparent
        alphaTest={0.4}
        side={THREE.DoubleSide}
        roughness={0.75}
        metalness={0}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}
