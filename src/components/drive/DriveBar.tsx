import { useLayoutEffect, useState } from 'react';
import { X } from 'lucide-react';
import { closeDriveBar, DRIVE, DRIVE_LIVE, driveBarClosed, openDriveTerms, prefetchDriveTerms } from '@/lib/givingDrive';
import { GoldCoin } from './PrizeArt';

/**
 * The Holiday Giving Drive bar (founder's pick, Nov 2026: "announcement bar on every page", the one
 * that talks about the gold coin). It is the first row of the site header, so it shows on every page
 * that has the header, hides and returns with it on scroll, and the opening lands the logo below it.
 * The whole message opens the prizes-and-terms pop-up; × hides the bar until the next visit. It goes
 * away by itself when the drive ends (src/lib/givingDrive.ts).
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
        aria-label={`${DRIVE.name}: the top ${DRIVE.goldCoins.count} donors each win a ${DRIVE.goldCoins.name}. Ends ${DRIVE.endLabel}. See the prizes and terms.`}
        onClick={openDriveTerms}
        onPointerEnter={prefetchDriveTerms}
        onFocus={prefetchDriveTerms}
        onTouchStart={prefetchDriveTerms}
      >
        <span className="drive-coin-turn" aria-hidden="true"><GoldCoin className="drive-coin" /></span>
        <span className="drive-bar-text" aria-hidden="true">
          <span className="drive-bar-long"><strong>{DRIVE.name}:</strong> the top {DRIVE.goldCoins.count} donors each win a {DRIVE.goldCoins.name}<span className="drive-star">*</span></span>
          <span className="drive-bar-short">Top {DRIVE.goldCoins.count} donors win a {DRIVE.goldCoins.name}<span className="drive-star">*</span></span>
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
