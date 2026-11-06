import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DRIVE, driveMoney } from '@/lib/givingDrive';
import { COMPANY, COMPANY_FORM, MAILING_ADDRESS } from '@/lib/legal';
import { GiftBox, GiftCardArt, GoldCoin } from './PrizeArt';

const { gifts, goldCoins, giftCards, freeEntry } = DRIVE;
const min = driveMoney(DRIVE.minGift);

const PRIZES: Array<{ art: ReactNode; name: string; how: string }> = [
  { art: <GiftBox className="h-10 w-10" />, name: `A gift worth ${driveMoney(gifts.value)}`, how: `${gifts.count} winners, drawn at random` },
  { art: <GoldCoin className="h-10 w-10" />, name: 'A gold coin', how: `For each of the ${goldCoins.count} donors who give the most` },
  { art: <GiftCardArt className="h-10 w-10" />, name: `A ${driveMoney(giftCards.value)} gift card`, how: `${giftCards.count} more winners, drawn at random` },
];

const FreeEmail = () => <a href={`mailto:${freeEntry.email}?subject=${encodeURIComponent(freeEntry.subject)}`} className="font-medium text-foreground underline underline-offset-2">{freeEntry.email}</a>;

const TERMS: Array<[string, ReactNode]> = [
  ['No donation necessary.', <>You don't have to give to enter or win a random prize, and giving more doesn't improve your chances of winning one.</>],
  ['Dates.', <>The drive runs from {DRIVE.startLabel} to {DRIVE.endLabel} at 11:59 PM Eastern Time. Gifts and entries received after that don't count.</>],
  ['Who can enter.', <>Legal residents of the 50 United States and Washington, D.C. who are 18 or older. Void where prohibited. Employees of {COMPANY} and the people they live with can't win.</>],
  ['How to enter.', <>Make a completed gift of {min} or more to a fundraiser on coupondonation.com during the drive (tips and card fees don't count toward the {min}, and refunded or charged-back gifts don't count), or email <FreeEmail /> with the subject “{freeEntry.subject}” and your full name and state. One entry per person, however many times you give or email.</>],
  ['Prizes.', <>{gifts.count} gifts worth {driveMoney(gifts.value)} each; {giftCards.count} gift cards worth {driveMoney(giftCards.value)} each; and a gold coin for each of the {goldCoins.count} donors whose completed gifts during the drive add up to the most. A tie goes to the donor who reached that total first.</>],
  ['Winners are chosen at random.', <>The {driveMoney(gifts.value)} gifts and {driveMoney(giftCards.value)} gift cards are drawn at random from all entries within {DRIVE.drawWithinDays} days after the drive ends. No prize is guaranteed for any donation, and the odds of winning depend on how many people enter.</>],
  ['Winning.', <>We email winners within {DRIVE.drawWithinDays} days of the draw. A winner who doesn't reply within {DRIVE.replyWithinDays} days, or isn't eligible, loses the prize, and we may draw another winner. Prizes can't be transferred or exchanged for cash; we may swap a prize for one of equal or greater value.</>],
  ['Taxes.', <>Winners are responsible for any taxes on their prize. Winners of prizes worth $600 or more give us their tax details so we can issue a Form 1099.</>],
  ['Your gift still goes to the family.', <>{COMPANY} pays for every prize. Nothing comes out of donations, so 100% of each gift still reaches the family. Gifts are not tax-deductible.</>],
  ['Sponsor.', <>{COMPANY}, {COMPANY_FORM}{MAILING_ADDRESS ? `, ${MAILING_ADDRESS}` : ''}. For questions or the list of winners, email <a href={`mailto:${freeEntry.email}`} className="font-medium text-foreground underline underline-offset-2">{freeEntry.email}</a>.</>],
];

/**
 * The Holiday Giving Drive pop-up (founder request, Nov 2026), opened from the header bar and the hero
 * sticker: the three prizes, Donate now, then the terms in small print.
 */
export default function DriveTermsDialog({ open, onOpenChange, returnFocus }: { open: boolean; onOpenChange: (open: boolean) => void; returnFocus: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus(); }} className="drive-dialog flex max-h-[min(90dvh,820px)] w-[calc(100%-24px)] max-w-[600px] flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:rounded-2xl">
        <div className="shrink-0 px-5 pb-4 pt-7 sm:px-8 sm:pt-8">
          <DialogTitle className="pr-10 font-display text-[2rem] font-normal leading-none text-foreground sm:text-[2.375rem]">{DRIVE.name}</DialogTitle>
          <DialogDescription className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Give {min} or more by {DRIVE.endLabel} for a chance to win. No donation is needed to enter.
          </DialogDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
          <ul className="space-y-1 rounded-xl bg-primary/5 px-4 py-2 sm:px-5" aria-label="Prizes">
            {PRIZES.map((prize) => (
              <li key={prize.name} className="flex items-center gap-4 py-2.5">
                <span className="shrink-0">{prize.art}</span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug text-foreground">{prize.name}</span>
                  <span className="block text-sm leading-snug text-muted-foreground">{prize.how}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg" className="rounded-full px-7 text-[15px] font-semibold">
              <Link to="/donate" onClick={() => onOpenChange(false)}>Donate now</Link>
            </Button>
            <p className="text-sm text-muted-foreground">One gift of {min} or more enters you in the draw.</p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            To enter without giving, email <FreeEmail /> with the subject “{freeEntry.subject}” and your name and state.
          </p>

          <h3 className="mt-7 font-sans text-sm font-semibold text-foreground">Terms</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-[12.5px] leading-relaxed text-muted-foreground marker:text-muted-foreground">
            {TERMS.map(([lead, body]) => (
              <li key={lead} className="pl-1"><strong className="font-semibold text-foreground">{lead}</strong> {body}</li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
