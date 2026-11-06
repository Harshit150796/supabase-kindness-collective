import { useId } from 'react';

/**
 * Small drawings of the Holiday Giving Drive prizes. The gold coin is prize artwork, so its gold is
 * allowed beside the UI's green and blue (founder request, Nov 2026); the gift and the gift card use
 * the logo green and blue.
 */
const HEART = 'M12 20.5s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 5.7-8 10.6-8 10.6z';

export function GoldCoin({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}f`} cx="34%" cy="28%" r="78%">
          <stop offset="0" stopColor="#FFF4C7" />
          <stop offset=".42" stopColor="#F3C64A" />
          <stop offset="1" stopColor="#B98319" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11.4" fill="#8F620F" />
      <circle cx="12" cy="12" r="10.3" fill={`url(#${id}f)`} />
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="#A8740F" strokeOpacity=".6" strokeWidth=".75" strokeDasharray=".85 .75" />
      <path d={HEART} transform="translate(12.35 12.95) scale(.48) translate(-12 -13)" fill="#FFF0B8" fillOpacity=".75" />
      <path d={HEART} transform="translate(12 12.6) scale(.48) translate(-12 -13)" fill="#A9730F" />
      <path d="M5.7 8.4a7.4 7.4 0 0 1 4.6-3.8" fill="none" stroke="#FFFBEA" strokeOpacity=".85" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}

export function GiftBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="4" y="10.6" width="16" height="10.4" rx="1.6" fill="#2E7D32" />
      <rect x="3" y="7.6" width="18" height="4.2" rx="1.3" fill="#3B8F40" />
      <rect x="10.8" y="7.6" width="2.4" height="13.4" fill="#1565C0" />
      <path d="M12 7.6c-1.3-2.7-4.9-3.9-5.6-1.9-.6 1.7 2.7 1.9 5.6 1.9zm0 0c1.3-2.7 4.9-3.9 5.6-1.9.6 1.7-2.7 1.9-5.6 1.9z" fill="#1565C0" />
      <rect x="4" y="11.8" width="16" height="1" fill="#000" fillOpacity=".12" />
    </svg>
  );
}

export function GiftCardArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="1.8" y="5.5" width="20.4" height="13.6" rx="2.2" fill="#1565C0" />
      <rect x="6.6" y="5.5" width="2.2" height="13.6" fill="#F7FAF7" />
      <path d="M7.7 10.2c-1-1.9-3.6-2.6-4-1.2-.4 1.3 1.9 1.3 4 1.2zm0 0c1-1.9 3.6-2.6 4-1.2.4 1.3-1.9 1.3-4 1.2z" fill="#F7FAF7" />
      <rect x="13" y="14.6" width="6.4" height="1.4" rx=".7" fill="#F7FAF7" fillOpacity=".7" />
    </svg>
  );
}
