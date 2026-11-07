import { useLayoutEffect, useState } from 'react';
import { X } from 'lucide-react';
import { closeDriveBar, DRIVE, DRIVE_LIVE, DRIVE_PRIZES, driveBarClosed, driveMoney, openDriveTerms, prefetchDriveTerms } from '@/lib/givingDrive';
import { GoldCoin } from './PrizeArt';

const GIFT = driveMoney(DRIVE.gifts.value);
const CARD = driveMoney(DRIVE.giftCards.value);

/**
 * The Holiday Giving Drive bar (founder's pick, Nov 2026: "announcement bar on every page"). It is the
 * first row of the site header, so it shows on every page that has the header, hides and returns with
 * it on scroll, and the opening lands the logo below it. Founder's wording (Nov 6, 2026): "Win a real
 * gold coin, a $1,000 gift or a $500 gift card this holiday*", then "110 chances to win" (the sum of
 * every prize in DRIVE). Phones set it on two lines (l1 over l2 and the chances); wider screens use
 * one line and add "this holiday", "Ends Jan 15" and "Prizes and terms" as the width allows
 * (index.css). The whole message opens the prizes-and-terms pop-up; × hides the bar until the next
 * visit. It goes away by itself when the drive ends (src/lib/givingDrive.ts).
 */
export function DriveBar() {
  const [open, setOpen] = useState(() => DRIVE_LIVE && !driveBarClosed());

  // Pages that pin things under the header (account sections) add the bar's height (--drive-bar-h).
  useLayoutEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.setAttribute('data-drive-bar', '');
    return () => root.removeAttribute('data-drive-bar');
  }, [open]);

  if (!open) return null;

  const hide = () => { closeDriveBar(); setOpen(false); };

  return (
    <div className="drive-bar" role="region" aria-label={DRIVE.name} data-nosnippet="">
      <button
        type="button"
        className="drive-bar-main"
        aria-haspopup="dialog"
        aria-label={`${DRIVE.name}: win a ${DRIVE.goldCoins.name}, a ${GIFT} gift or a ${CARD} gift card this holiday. ${DRIVE_PRIZES} chances to win. Ends ${DRIVE.endLabel}. See the prizes and terms.`}
        onClick={openDriveTerms}
        onPointerEnter={prefetchDriveTerms}
        onFocus={prefetchDriveTerms}
        onTouchStart={prefetchDriveTerms}
      >
        <span className="drive-coin-turn" aria-hidden="true"><GoldCoin className="drive-coin" /></span>
        <span className="drive-bar-text" aria-hidden="true">
          <span className="drive-bar-offer">
            <span className="drive-bar-l1">Win a <strong>{DRIVE.goldCoins.name}</strong>, a <strong>{GIFT} gift</strong></span>{' '}
            <span className="drive-bar-l2">or a <strong>{CARD} gift card</strong><span className="drive-bar-when"> this holiday</span><span className="drive-star">*</span></span>
          </span>
          <span className="drive-bar-chances">{DRIVE_PRIZES} chances to win</span>
          <span className="drive-bar-ends">Ends {DRIVE.endShort}</span>
        </span>
        <span className="drive-bar-link" aria-hidden="true"><span className="drive-bar-link-long">Prizes and terms</span><span className="drive-bar-link-short">Details</span></span>
      </button>
      <button type="button" className="drive-bar-close" aria-label="Hide the Giving Drive bar" onClick={hide}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
