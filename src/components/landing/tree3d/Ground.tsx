import { ContactShadows } from '@react-three/drei';

export function Ground({ y = -0.01 }: { y?: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color="#E8F0E8" roughness={1} />
      </mesh>
      <ContactShadows
        position={[0, y + 0.005, 0]}
        opacity={0.45}
        scale={10}
        blur={2.4}
        far={6}
        color="#1f2937"
      />
    </>
  );
}
