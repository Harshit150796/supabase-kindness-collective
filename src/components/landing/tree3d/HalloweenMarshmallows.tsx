import { useEffect, useMemo, type CSSProperties } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useInteraction } from './InteractionContext';
import { useGardenDistanceFactor } from './gardenMoments';
import { holdSpot, releaseSpot } from './gardenSpots';
import { marshmallowSpots, MM_SCALE, type GroupId } from './marshmallowSpots';
import './garden.css';

/**
 * Halloween marshmallows on the grass (founder request, Nov 2026): little marshmallow ghosts,
 * pumpkins and a mummy standing in small groups at the back of the hill. At night they light up:
 * the pumpkins' faces glow, each figure has a soft halo and a pool of light falls on the grass
 * around them, flickering like candlelight. By day they are just marshmallows. Every device gets
 * them (phones a smaller set); marshmallowSpots fits each group to the screen, and the garden's
 * plants keep clear of them. Pause animations keeps them still, lights on.
 */

const INK = '#211A16';

function Ghost({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 30 42" width="30" height="42" style={{ overflow: 'visible' }}>
      <ellipse cx="15" cy="41" rx="10" ry="1.8" fill={lit ? 'rgba(20,40,15,.16)' : 'rgba(20,40,15,.24)'} />
      <g className="mm-float">
        <ellipse cx="3.6" cy="22" rx="2.5" ry="4.2" transform="rotate(-28 3.6 22)" fill="#F1EDE4" />
        <ellipse cx="26.4" cy="22" rx="2.5" ry="4.2" transform="rotate(28 26.4 22)" fill="#E9E3D8" />
        <path d="M4.5 37C3.6 26 3.8 18 5.6 12C7.6 5.2 11 2 15 2C19 2 22.4 5.2 24.4 12C26.2 18 26.4 26 25.5 37C23.8 35.4 22.4 35.4 20.6 37.8C19 35.6 17 35.6 15 37.8C13 35.6 11 35.6 9.4 37.8C7.6 35.4 6.2 35.4 4.5 37Z" fill="#FBF8F2" />
        <path d="M19.5 4.2C22.6 6.4 24.6 11 25.4 17C26.2 23 26 30 25.5 37C23.8 35.4 22.4 35.4 20.6 37.8C22.8 29 22.6 15 19.5 4.2Z" fill="#E8E2D6" />
        <ellipse cx="10.4" cy="8.6" rx="2.6" ry="1.5" transform="rotate(-30 10.4 8.6)" fill="#FFFFFF" />
        <ellipse cx="11.4" cy="15.6" rx="1.9" ry="2.9" fill={INK} />
        <ellipse cx="18.6" cy="15.6" rx="1.9" ry="2.9" fill={INK} />
        <ellipse cx="15" cy="22.4" rx="1.9" ry="2.5" fill={INK} />
      </g>
    </svg>
  );
}

/** A pumpkin marshmallow: an orange marshmallow (the classic cylinder, flat top) with a stem and a carved face. */
function Pumpkin({ lit, width = 28 }: { lit: boolean; width?: number }) {
  const face = lit ? '#FFF1A6' : '#4A2A14';
  return (
    <svg viewBox="0 0 28 31" width={width} height={(width * 31) / 28} style={{ overflow: 'visible' }}>
      <ellipse cx="14" cy="29.8" rx="12" ry="1.8" fill={lit ? 'rgba(20,40,15,.14)' : 'rgba(20,40,15,.24)'} />
      <rect x="1" y="6" width="26" height="23" rx="7.5" fill="#F4923A" />
      <path d="M19 6.6C23.6 7.4 27 9 27 12V22C27 26 24 28.6 19.6 29C21.6 24 21.6 11 19 6.6Z" fill="#E27C26" />
      <path d="M8.6 10C7.6 15 7.6 21 8.6 27M19.4 10C20.4 15 20.4 21 19.4 27" stroke="#E2802B" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <ellipse cx="14" cy="7.6" rx="12.6" ry="3.8" fill="#FAB067" />
      <ellipse cx="9.6" cy="7" rx="3.4" ry="1.2" fill="#FFD3A1" />
      <path d="M13 7.8C12.8 4.6 13.8 2.4 16.6 1.8L17.2 3.4C15.6 3.9 15.3 5.2 15.5 7.8Z" fill="#3F7A36" />
      <path d="M16.2 4.2C18 2.6 20.4 2.6 21.6 3.8C20 5.4 17.8 5.4 16.2 4.2Z" fill="#4E8F42" />
      <g fill={face}>
        <path d="M7.4 17.2L10 12.8L12 17.2Z" />
        <path d="M16 17.2L18 12.8L20.6 17.2Z" />
        <path d="M6.4 19.8Q14 26.4 21.6 19.8L19.6 20.8L18.4 19.8L16.8 21.2L15.3 20L13.8 21.3L12.2 20L10.7 21.1L9.3 20Z" />
      </g>
      <g fill="#FFFFFF" opacity=".55">
        <circle cx="4.6" cy="12" r=".45" /><circle cx="23.4" cy="14.6" r=".4" /><circle cx="5.4" cy="24" r=".4" /><circle cx="22" cy="25.4" r=".45" /><circle cx="17.4" cy="10.2" r=".35" />
      </g>
    </svg>
  );
}

function Mummy({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 22 31" width="22" height="31" style={{ overflow: 'visible' }}>
      <ellipse cx="11" cy="30" rx="9" ry="1.6" fill={lit ? 'rgba(20,40,15,.14)' : 'rgba(20,40,15,.24)'} />
      <g className="mm-wobble">
        <rect x="1" y="2" width="20" height="27.5" rx="6.5" fill="#F7F3EB" />
        <path d="M14.5 2.4C18.6 3.4 21 6 21 9V23C21 27 18.6 29 14.5 29.4C17 25 17 7 14.5 2.4Z" fill="#E6DFD2" />
        <path d="M2 7.4L20 4.8M2 20.6L20 17.4M2 25.6L20 23.2" stroke="#DCD3C3" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="1.6" y="9.4" width="18.8" height="6.6" rx="2.4" fill="#3A302A" />
        <circle cx="7.6" cy="12.7" r="2.3" fill="#FFFFFF" />
        <circle cx="8" cy="13" r="1.05" fill={INK} />
        <circle cx="14.6" cy="12.8" r="1.7" fill="#FFFFFF" />
        <circle cx="14.9" cy="13" r=".85" fill={INK} />
        <ellipse cx="6.4" cy="5" rx="2.4" ry="1.1" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/** Light around a figure (night only): warm for pumpkins, moonlit for ghosts and the mummy. */
function Halo({ x, y, size, warm, delay }: { x: number; y: number; size: number; warm: boolean; delay: string }) {
  return <span className={`mm-halo mm-flicker ${warm ? 'mm-warm' : 'mm-cool'}`} style={{ left: x - size / 2, top: y - size / 2, width: size, height: size, animationDelay: delay }} />;
}

/** The pool of light on the grass under a group (night only). */
function Pool({ x, w, h, delay }: { x: number; w: number; h: number; delay: string }) {
  return <span className="mm-pool mm-flicker" style={{ left: x - w / 2, top: -h / 2 + 1, width: w, height: h, animationDelay: delay }} />;
}

const at = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({ left, top, ...extra });

/** One group's figures and night light, drawn around its anchor (the box in marshmallowSpots.GROUP_BOX). */
export function MarshmallowGroupArt({ id, lit }: { id: GroupId; lit: boolean }) {
  if (id === 'single') {
    return (
      <>
        {lit && <Pool x={0} w={78} h={22} delay="-0.6s" />}
        {lit && <Halo x={0} y={-14} size={64} warm delay="-0.6s" />}
        <span className="hl-actor" style={at(-14, -29)}><Pumpkin lit={lit} /></span>
      </>
    );
  }
  if (id === 'pair') {
    return (
      <>
        {lit && <Pool x={-4} w={88} h={24} delay="-1.2s" />}
        {lit && <Halo x={-15} y={-22} size={58} warm={false} delay="-0.7s" />}
        {lit && <Halo x={9} y={-13} size={60} warm delay="-1.9s" />}
        <span className="hl-actor" style={at(-30, -42)}><Ghost lit={lit} /></span>
        <span className="hl-actor" style={at(-4, -27)}><Pumpkin lit={lit} width={26} /></span>
      </>
    );
  }
  if (id === 'trio-a') {
    return (
      <>
        {lit && <Pool x={0} w={128} h={28} delay="0s" />}
        {lit && <Halo x={-25} y={-22} size={60} warm={false} delay="-1.1s" />}
        {lit && <Halo x={29} y={-16} size={46} warm={false} delay="-2.2s" />}
        {lit && <Halo x={2} y={-14} size={64} warm delay="-0.4s" />}
        <span className="hl-actor" style={at(-40, -42)}><Ghost lit={lit} /></span>
        <span className="hl-actor" style={at(18, -31)}><Mummy lit={lit} /></span>
        <span className="hl-actor" style={at(-12, -29)}><Pumpkin lit={lit} /></span>
      </>
    );
  }
  return (
    <>
      {lit && <Pool x={0} w={130} h={28} delay="-1.5s" />}
      {lit && <Halo x={-26} y={-16} size={68} warm delay="-1.8s" />}
      {lit && <Halo x={11} y={-25} size={58} warm={false} delay="-0.9s" />}
      {lit && <Halo x={33} y={-9} size={40} warm delay="-2.6s" />}
      <span className="hl-actor" style={at(-4, -45)}><Ghost lit={lit} /></span>
      <span className="hl-actor" style={at(-42, -33)}><Pumpkin lit={lit} width={32} /></span>
      <span className="hl-actor" style={at(24, -18)}><Pumpkin lit={lit} width={18} /></span>
    </>
  );
}

function Group({ id, spot, lit, still, distanceFactor, scale }: { id: GroupId; spot: [number, number, number]; lit: boolean; still: boolean; distanceFactor: number; scale: number }) {
  return (
    <Html position={spot} center distanceFactor={distanceFactor} zIndexRange={[19, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
      <div className={`hl mm${still ? ' mm-still' : ''}`} aria-hidden="true">
        <div className="mm-art" style={{ transform: `scale(${scale})` }}>
          <MarshmallowGroupArt id={id} lit={lit} />
        </div>
      </div>
    </Html>
  );
}

export function HalloweenMarshmallows({ isMobile, lowPower, gentle }: { isMobile: boolean; lowPower: boolean; gentle: boolean }) {
  const { timeOfDay } = useInteraction();
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const distanceFactor = useGardenDistanceFactor(isMobile);
  // HillLife's deer walks only on the full tier away from phones (and not when animations are paused).
  const groups = useMemo(() => marshmallowSpots(width, height, isMobile, !isMobile && !lowPower && !gentle), [width, height, isMobile, lowPower, gentle]);

  // The garden's plants keep clear of the groups.
  useEffect(() => {
    for (const g of groups) holdSpot(`marshmallow-${g.id}`, g.at);
    return () => { for (const g of groups) releaseSpot(`marshmallow-${g.id}`); };
  }, [groups]);

  const lit = timeOfDay === 'night';
  return (
    <>
      {groups.map((g) => (
        <Group key={g.id} id={g.id} spot={[g.at.x, 0, g.at.z]} lit={lit} still={gentle} distanceFactor={distanceFactor} scale={isMobile ? MM_SCALE.phone : MM_SCALE.wide} />
      ))}
    </>
  );
}
