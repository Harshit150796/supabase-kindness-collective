import type { ReactNode } from 'react';
import { Html } from '@react-three/drei';
import { useInteraction } from './InteractionContext';
import { useGardenDistanceFactor } from './gardenMoments';
import './garden.css';

type Spot = [number, number, number];

/**
 * Life on the hill (founder-chosen), quietly in the background: a deer walking the far edge,
 * rabbits grazing and hopping, small birds pecking near the stones, and by day two kids flying a
 * kite and a couple of butterflies (at night the kids go home and the fireflies take over). Each
 * actor stands on a spot on the grass, away from the trunk and the landing ring's busiest side;
 * phones and low-power devices keep only the rabbits and birds.
 */
const DESKTOP = {
  deer: [-8.6, 0, -2.6] as Spot,
  rabbitHop: [-4.3, 0, 3.3] as Spot,
  rabbitGraze: [-5.1, 0, 3.9] as Spot,
  birds: [3.4, 0, 3.5] as Spot,
  kids: [8.2, 0, -1.2] as Spot,
  flyA: [-2.4, 1.1, 2.6] as Spot,
  flyB: [2.7, 1.3, 1.8] as Spot,
};
const PHONE = {
  // Far enough right and back that its hop never reaches the Pause button on any phone.
  rabbitHop: [-1.9, 0, 3.0] as Spot,
  birds: [2.2, 0, 4.1] as Spot,
  flyA: [-1.4, 1.3, 3.1] as Spot,
};

function Actor({ at, distanceFactor, children }: { at: Spot; distanceFactor: number; children: ReactNode }) {
  return (
    <Html position={at} center distanceFactor={distanceFactor} zIndexRange={[19, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
      <div className="hl" aria-hidden="true">{children}</div>
    </Html>
  );
}

function Rabbit({ grazing = false }: { grazing?: boolean }) {
  return (
    <svg viewBox="0 0 54 40">
      <ellipse cx="30" cy="38" rx="20" ry="2.6" fill="rgba(20,40,15,.24)" />
      <ellipse cx="32" cy="26" rx="17" ry="12" fill="#9C978F" />
      <ellipse cx="34" cy="30" rx="11" ry="7" fill="#B9B4AB" />
      <circle cx="49" cy="24" r="4.6" fill="#F4F2EE" />
      <ellipse cx="22" cy="35" rx="5" ry="2.6" fill="#8E8981" />
      <ellipse cx="40" cy="35.5" rx="8" ry="3" fill="#8E8981" />
      <g className={grazing ? 'hl-graze' : undefined}>
        <ellipse cx="13" cy="7" rx="2.8" ry="8.5" fill="#9C978F" transform="rotate(-18 13 7)" />
        <ellipse cx="13" cy="7.5" rx="1.2" ry="6" fill="#D6BDB6" transform="rotate(-18 13 7)" />
        <ellipse cx="18.5" cy="7" rx="2.8" ry="8.5" fill="#8E8981" transform="rotate(10 18.5 7)" />
        <ellipse cx="15" cy="19" rx="9" ry="8" fill="#A6A199" />
        <circle cx="11.5" cy="17.5" r="1.4" fill="#141414" />
        <circle cx="7" cy="20.5" r="1.1" fill="#C98F8F" />
      </g>
    </svg>
  );
}

function Bird({ tone, delay }: { tone: string; delay: string }) {
  return (
    <svg viewBox="0 0 22 18">
      <ellipse cx="11" cy="16" rx="8" ry="1.5" fill="rgba(20,40,15,.22)" />
      <ellipse cx="13" cy="10" rx="7" ry="5" fill={tone} />
      <ellipse cx="13" cy="12" rx="5" ry="3" fill="#E9ECEF" />
      <path d="M19 9L22 7" stroke={tone} strokeWidth="2" strokeLinecap="round" />
      <g className="hl-peck" style={{ animationDelay: delay }}>
        <circle cx="7" cy="7" r="3.6" fill={tone} />
        <path d="M3.6 7.5L1 8.4" stroke="#D9C9A0" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="6" cy="6.2" r=".7" fill="#111" />
      </g>
      <path d="M12 15V17M15 15V17" stroke="#3A3A3A" strokeWidth=".8" />
    </svg>
  );
}

function Butterfly({ light = false }: { light?: boolean }) {
  const a = light ? '#F7FAF7' : '#1566C1';
  const b = light ? '#DCE8FA' : '#2F7FD6';
  return (
    <svg viewBox="0 0 34 28" width="20" height="17">
      <g className="hl-wings">
        <path d="M17 14C13 5 3 1 1.5 6C0 11 7 15 17 14Z" fill={a} />
        <path d="M17 14C11 16 5.5 23 8.5 26C11.5 28 16 21 17 14Z" fill={b} />
        <path d="M17 14C21 5 31 1 32.5 6C34 11 27 15 17 14Z" fill={a} />
        <path d="M17 14C23 16 28.5 23 25.5 26C22.5 28 18 21 17 14Z" fill={b} />
      </g>
      <path d="M17 8V21" stroke="#14213D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HillLife({ isMobile, lowPower }: { isMobile: boolean; lowPower: boolean }) {
  const { timeOfDay } = useInteraction();
  const distanceFactor = useGardenDistanceFactor(isMobile);
  const day = timeOfDay === 'day';
  const full = !isMobile && !lowPower;
  const spots = isMobile ? PHONE : DESKTOP;

  return (
    <>
      {full && (
        <Actor at={DESKTOP.deer} distanceFactor={distanceFactor}>
          <span className="hl-actor hl-deer" style={{ left: -23, top: -42, width: 46, height: 42 }}>
            <svg viewBox="0 0 60 54" width="46" height="42" style={{ overflow: 'visible' }}>
              <ellipse cx="28" cy="52" rx="18" ry="2" fill="rgba(20,40,15,.2)" />
              <path className="hl-legr" d="M16 30L15 51" stroke="#7A6D62" strokeWidth="2.4" strokeLinecap="round" />
              <path className="hl-legf" d="M21 31L22 51" stroke="#8A7E72" strokeWidth="2.4" strokeLinecap="round" />
              <path className="hl-legf" d="M35 31L34 51" stroke="#7A6D62" strokeWidth="2.4" strokeLinecap="round" />
              <path className="hl-legr" d="M40 30L41 51" stroke="#8A7E72" strokeWidth="2.4" strokeLinecap="round" />
              <ellipse cx="28" cy="25" rx="16" ry="8" fill="#8A7E72" />
              <ellipse cx="27" cy="28" rx="10" ry="4" fill="#A49789" />
              <path d="M12 21L9 19" stroke="#8A7E72" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M39 22L45 9L49 10L44 24Z" fill="#8A7E72" />
              <ellipse cx="49" cy="8" rx="5.5" ry="3.6" fill="#8A7E72" />
              <path d="M45 5L43 1M47 5L49 1" stroke="#7A6D62" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="50" cy="7" r=".9" fill="#1C1A18" />
            </svg>
          </span>
        </Actor>
      )}

      <Actor at={spots.rabbitHop} distanceFactor={distanceFactor}>
        <span className="hl-actor hl-hop" style={{ left: -21, top: -31, width: 42, height: 31 }}><Rabbit /></span>
      </Actor>
      {full && (
        <Actor at={DESKTOP.rabbitGraze} distanceFactor={distanceFactor}>
          <span className="hl-actor" style={{ left: -19, top: -28, width: 38, height: 28, transform: 'scaleX(-1)' }}><Rabbit grazing /></span>
        </Actor>
      )}

      {day && (
        <Actor at={spots.birds} distanceFactor={distanceFactor}>
          <span className="hl-actor" style={{ left: -24, top: -16, width: 20, height: 16 }}><Bird tone="#5B6B82" delay="0s" /></span>
          <span className="hl-actor" style={{ left: 8, top: -27, width: 18, height: 15, transform: 'scaleX(-1)' }}><Bird tone="#6C7A8E" delay="-1.4s" /></span>
        </Actor>
      )}

      {day && full && (
        <Actor at={DESKTOP.kids} distanceFactor={distanceFactor}>
          <svg className="hl-actor" viewBox="0 0 140 170" width="140" height="170" style={{ left: 0, top: -160 }}>
            <path d="M24 133C46 100 76 66 98 40" stroke="rgba(30,40,60,.45)" strokeWidth=".8" fill="none" />
          </svg>
          <span className="hl-actor hl-kite" style={{ left: 85, top: -156, width: 26, height: 36 }}>
            <svg viewBox="0 0 26 36" width="26" height="36" style={{ overflow: 'visible' }}>
              <path d="M13 0L26 13L13 36L0 13Z" fill="#1566C1" />
              <path d="M13 0L13 36M0 13H26" stroke="rgba(255,255,255,.55)" strokeWidth=".8" />
              <path d="M13 0L26 13L13 17Z" fill="#2F7F33" />
              <g className="hl-ktail">
                <path d="M13 36C8 44 18 50 12 58C7 66 16 70 12 78" stroke="#F7FAF7" strokeWidth="1" fill="none" />
                <path d="M9 46L15 44L13 49ZM9 60L15 58L13 63Z" fill="#2F7F33" />
              </g>
            </svg>
          </span>
          <svg className="hl-actor" viewBox="0 0 40 52" width="26" height="34" style={{ left: 2, top: -34, overflow: 'visible' }}>
            <ellipse cx="20" cy="51" rx="9" ry="1.8" fill="rgba(20,40,15,.22)" />
            <rect x="15" y="32" width="4.2" height="17" rx="2" fill="#1F2C5C" />
            <rect x="21" y="32" width="4.2" height="17" rx="2" fill="#24346B" />
            <path d="M12 18Q20 14 28 18L30 35Q20 38 10 35Z" fill="#2F7F33" />
            <g className="hl-arm"><path d="M26 21L34 10" stroke="#C68B65" strokeWidth="3" strokeLinecap="round" /></g>
            <circle cx="20" cy="10" r="6.5" fill="#C68B65" />
            <path d="M13.5 10Q13 3 20 3.5Q27 4 26.5 9Q22 6.5 17 7.5Q15 9 14.5 13Z" fill="#2B2320" />
          </svg>
          <svg className="hl-actor" viewBox="0 0 40 52" width="24" height="31" style={{ left: -26, top: -27, overflow: 'visible' }}>
            <ellipse cx="20" cy="51" rx="9" ry="1.8" fill="rgba(20,40,15,.22)" />
            <rect x="15" y="36" width="4.2" height="13" rx="2" fill="#8D5A3B" />
            <rect x="21" y="36" width="4.2" height="13" rx="2" fill="#7F5034" />
            <path d="M12 30H28V38H12Z" fill="#1F2C5C" />
            <path d="M11 17Q20 13 29 17L29 32H11Z" fill="#1566C1" />
            <path d="M27 20L33 13" stroke="#8D5A3B" strokeWidth="3" strokeLinecap="round" />
            <circle cx="20" cy="9.5" r="6.5" fill="#8D5A3B" />
            <path d="M13.5 9Q13 3 20 3Q27 3 26.5 9Q23 6 20 6.5Q16 6.5 13.5 9Z" fill="#1B1716" />
          </svg>
        </Actor>
      )}

      {day && (
        <Actor at={spots.flyA} distanceFactor={distanceFactor}>
          <span className="hl-bfly" style={{ offsetPath: "path('M0 0C-40 -50 40 -90 80 -50C120 -10 60 40 0 0Z')" }}><Butterfly /></span>
        </Actor>
      )}
      {day && full && (
        <Actor at={DESKTOP.flyB} distanceFactor={distanceFactor}>
          <span className="hl-bfly" style={{ offsetPath: "path('M0 0C50 -40 100 20 60 50C20 80 -40 40 0 0Z')", animationDuration: '9s', animationDelay: '-3s' }}><Butterfly light /></span>
        </Actor>
      )}
    </>
  );
}
