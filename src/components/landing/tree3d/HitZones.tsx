import { useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useInteraction } from './InteractionContext';
import { toast } from 'sonner';

export function HitZones() {
  const {
    triggerShake,
    toggleTransparency,
    cycleTimeOfDay,
    triggerBird,
    timeOfDay,
  } = useInteraction();

  const canopyDownRef = useRef<number | null>(null);

  const stop = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Trunk hit zone — click to shake */}
      <mesh
        position={[0, 1.8, 0]}
        onClick={(e) => {
          stop(e);
          triggerShake();
          toast('🌳 The tree shakes!', { duration: 1500 });
        }}
      >
        <cylinderGeometry args={[0.55, 0.7, 3.6, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Root disc — click for transparency */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          stop(e);
          toggleTransparency();
        }}
      >
        <ringGeometry args={[0.7, 1.6, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Canopy hold zone — bird flies out */}
      <mesh
        position={[0, 4.4, 0]}
        onPointerDown={(e) => {
          stop(e);
          canopyDownRef.current = performance.now();
        }}
        onPointerUp={(e) => {
          stop(e);
          if (canopyDownRef.current && performance.now() - canopyDownRef.current > 500) {
            triggerBird();
          }
          canopyDownRef.current = null;
        }}
        onPointerOut={() => {
          canopyDownRef.current = null;
        }}
      >
        <sphereGeometry args={[2.6, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Sky back-plane — click to cycle day/night */}
      <mesh
        position={[0, 6, -14]}
        onClick={(e) => {
          stop(e);
          cycleTimeOfDay();
          const next = timeOfDay === 'day' ? 'sunset' : timeOfDay === 'sunset' ? 'night' : 'day';
          toast(`${next === 'day' ? '☀️ Day' : next === 'sunset' ? '🌅 Sunset' : '🌙 Night'}`, {
            duration: 1200,
          });
        }}
      >
        <planeGeometry args={[40, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}
