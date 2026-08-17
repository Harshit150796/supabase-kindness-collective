import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function getInitial() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  // Synchronous initial value avoids a first-paint flash of the desktop
  // branch on phones (previously the hook returned `false` for one render
  // until the effect fired).
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitial);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

export type DeviceTier = "mobile" | "tablet" | "desktop";

const TABLET_BREAKPOINT = 1280;

function getTier(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < MOBILE_BREAKPOINT) return "mobile";
  if (w < TABLET_BREAKPOINT) return "tablet";
  return "desktop";
}

/**
 * Presentation-only breakpoint tier (mobile / tablet / desktop).
 * Used for sizing DOM overlays inside the 3D hero — never for 3D quality knobs.
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = React.useState<DeviceTier>(getTier);

  React.useEffect(() => {
    const onResize = () => setTier(getTier());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return tier;
}

