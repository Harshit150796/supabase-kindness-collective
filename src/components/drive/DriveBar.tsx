import { useLayoutEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { closeThanksgivingBar, THANKSGIVING, THANKSGIVING_BAR_LIVE, thanksgivingBarClosed } from '@/lib/thanksgivingOffer';
import { closeDriveBar, DRIVE, DRIVE_LIVE, driveBarClosed, driveMoney, openDriveTerms, prefetchDriveTerms } from '@/lib/givingDrive';
import { GoldCoin } from './PrizeArt';

const MIN = driveMoney(DRIVE.minGift);
const GIFT = driveMoney(DRIVE.gifts.value);
const CARD = driveMoney(DRIVE.giftCards.value);

/**
 * The Holiday Giving Drive bar (founder's pick, Nov 2026: "announcement bar on every page"). It is the
 * first row of the site header, so it shows on every page that has the header, hides and returns with
 * it on scroll, and the opening lands the logo below it. Founder's wording (Nov 6, 2026): "Donate $10
 * today and stand a chance to win a real gold coin, a $1,000 gift or a $500 gift card this holiday*"
 * (no prize count). Under 850px it sits on two centred lines (l1 over l2); wider screens use one line
 * and add "this holiday", "Ends Jan 15" and "Prizes and terms" as the width allows (index.css). The
 * whole message opens the prizes-and-terms pop-up; × hides the bar until the next visit. It goes away
 * by itself when the drive ends (src/lib/givingDrive.ts).
 *
 * On Nov 17, 2026 (Eastern Time) the same green bar carries the Thanksgiving offer instead
 * (src/lib/thanksgivingOffer.ts, founder request): start a fundraiser by Nov 26 and get a free $10 gift
 * card. It links to /apply and has its own ×; the drive bar returns by itself the next day.
 */
export function DriveBar() {
  const [offer, setOffer] = useState(() => THANKSGIVING_BAR_LIVE && !thanksgivingBarClosed());
  const [drive, setDrive] = useState(() => DRIVE_LIVE && !driveBarClosed());
  const open = offer || drive;

  // Pages that pin things under the header (account sections) add the bar's height (--drive-bar-h).
  useLayoutEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.setAttribute('data-drive-bar', '');
    return () => root.removeAttribute('data-drive-bar');
  }, [open]);

  if (!open) return null;

  if (offer) {
    const value = driveMoney(THANKSGIVING.value);
    return (
      <div className="drive-bar" role="region" aria-label="Thanksgiving offer" data-nosnippet="">
        <Link to={THANKSGIVING.href} className="drive-bar-main">
          <span className="drive-bar-text">
            <span className="drive-bar-offer">
              <span className="drive-bar-l1"><strong>Thanksgiving:</strong> start a fundraiser by {THANKSGIVING.byShort}</span>{' '}
              <span className="drive-bar-l2">and get a <strong>free {value} gift card</strong></span>
            </span>
          </span>
          <span className="drive-bar-link"><span className="drive-bar-link-long">Start your fundraiser</span><span className="drive-bar-link-short">Start now</span></span>
        </Link>
        <button type="button" className="drive-bar-close" aria-label="Hide the Thanksgiving offer" onClick={() => { closeThanksgivingBar(); setOffer(false); }}>
          <X aria-hidden="true" />
        </button>
      </div>
    );
  }

  const hide = () => { closeDriveBar(); setDrive(false); };

  return (
    <div className="drive-bar" role="region" aria-label={DRIVE.name} data-nosnippet="">
      <button
        type="button"
        className="drive-bar-main"
        aria-haspopup="dialog"
        onClick={openDriveTerms}
        onPointerEnter={prefetchDriveTerms}
        onFocus={prefetchDriveTerms}
        onTouchStart={prefetchDriveTerms}
      >
        <span className="drive-coin-turn" aria-hidden="true"><GoldCoin className="drive-coin" /></span>
        {/* The button's name is the words it shows (label in name), then the drive's name for context. */}
        <span className="sr-only">{DRIVE.name}: </span>
        <span className="drive-bar-text">
          <span className="drive-bar-offer">
            <span className="drive-bar-l1"><strong>Donate {MIN} today</strong> and stand a chance to win</span>{' '}
            <span className="drive-bar-l2">a <strong>{DRIVE.goldCoins.name}</strong>, <span className="drive-bar-a">a </span><strong>{GIFT}<span className="drive-bar-gift"> gift</span></strong> or a <strong>{CARD} gift card</strong><span className="drive-bar-when"> this holiday</span><span className="drive-star">*</span></span>
          </span>
          <span className="drive-bar-ends">Ends {DRIVE.endShort}</span>
        </span>
        <span className="drive-bar-link"><span className="drive-bar-link-long">Prizes and terms</span><span className="drive-bar-link-short">Details</span></span>
      </button>
      <button type="button" className="drive-bar-close" aria-label="Hide the Giving Drive bar" onClick={hide}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
