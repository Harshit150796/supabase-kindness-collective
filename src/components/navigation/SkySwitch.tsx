import { toggleSky, useSky } from '@/lib/sky';

const MOON = 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z';
const SUN = 'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8z';

/**
 * The header's night/day switch for the homepage tree. The orb slides between a moon and a sun;
 * it flips <html data-sky>, which the live tree, the hero and the header all follow.
 */
export function SkySwitch({ className = '' }: { className?: string }) {
  const sky = useSky();
  const night = sky === 'night';
  return (
    <button
      type="button"
      onClick={toggleSky}
      aria-label={night ? 'Switch the sky to day' : 'Switch the sky to night'}
      data-sky-state={sky}
      className={`sky-switch ${className}`}
    >
      <span className="sky-switch-orb" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path className="sky-switch-moon" d={MOON} />
          <path className="sky-switch-sun" d={SUN} />
        </svg>
      </span>
    </button>
  );
}
