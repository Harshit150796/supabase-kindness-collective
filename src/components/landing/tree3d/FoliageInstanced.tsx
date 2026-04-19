import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getLeafTexture, getLeafTextureB } from './textures';

interface Props {
  clusters: THREE.Vector3[];
  totalCount: number;
  clusterRadius?: number;
}

/**
 * Two-variant instanced foliage: half use leaf A, half use leaf B.
 * Wind sway via per-instance phase in a custom attribute.
 */
function VariantMesh({
  clusters,
  count,
  clusterRadius,
  texture,
  seedOffset,
}: {
  clusters: THREE.Vector3[];
  count: number;
  clusterRadius: number;
  texture: THREE.Texture;
  seedOffset: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const uniformsRef = useRef<{ uTime: { value: number } }>({ uTime: { value: 0 } });

  const { matrices, phases, tints } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const ph: number[] = [];
    const tn: THREE.Color[] = [];
    const palette = [
      '#7CB342',
      '#5FA046',
      '#3F8A3E',
      '#2E7D32',
      '#9CCC65',
      '#558B2F',
    ].map((c) => new THREE.Color(c));
    const perCluster = Math.ceil(count / clusters.length);
    const dummy = new THREE.Object3D();
    const tmpQ = new THREE.Quaternion();
    const tmpE = new THREE.Euler();

    clusters.forEach((center, ci) => {
      for (let i = 0; i < perCluster && mats.length < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        // tighter clustering — bias inward for solid mass
        const r = clusterRadius * Math.pow(Math.random(), 0.4);
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
        // Wider scale variance for natural irregularity
        const s = 0.14 + Math.random() * 0.22;
        const aspect = 1.2 + Math.random() * 0.4;
        dummy.scale.set(s, s * aspect, s);
        dummy.updateMatrix();
        mats.push(dummy.matrix.clone());
        ph.push(Math.random() * Math.PI * 2 + seedOffset + ci * 0.13);
        tn.push(palette[Math.floor(Math.random() * palette.length)]);
      }
    });
    return { matrices: mats, phases: ph, tints: tn };
  }, [clusters, count, clusterRadius, seedOffset]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    tints.forEach((c, i) => mesh.setColorAt(i, c));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    const phaseArr = new Float32Array(phases);
    mesh.geometry.setAttribute(
      'aPhase',
      new THREE.InstancedBufferAttribute(phaseArr, 1)
    );
  }, [matrices, phases, tints]);

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
        float tipMask = clamp(uv.y, 0.0, 1.0);
        float wave = sin(uTime * 1.2 + aPhase) * 0.05 + sin(uTime * 0.6 + aPhase * 1.7) * 0.03;
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
      args={[
        undefined as unknown as THREE.BufferGeometry,
        undefined as unknown as THREE.Material,
        count,
      ]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1.4, 1, 4]} />
      <meshStandardMaterial
        map={texture}
        alphaMap={texture}
        transparent
        alphaTest={0.5}
        side={THREE.DoubleSide}
        roughness={0.85}
        metalness={0}
        onBeforeCompile={onBeforeCompile}
      />
    </instancedMesh>
  );
}

export function FoliageInstanced({ clusters, totalCount, clusterRadius = 1.0 }: Props) {
  const texA = useMemo(() => getLeafTexture(), []);
  const texB = useMemo(() => getLeafTextureB(), []);
  const half = Math.floor(totalCount / 2);
  return (
    <>
      <VariantMesh
        clusters={clusters}
        count={half}
        clusterRadius={clusterRadius}
        texture={texA}
        seedOffset={0}
      />
      <VariantMesh
        clusters={clusters}
        count={totalCount - half}
        clusterRadius={clusterRadius}
        texture={texB}
        seedOffset={1.7}
      />
    </>
  );
}
