import { Link } from 'react-router-dom';
import { Reveal } from '@/components/ui/editorial-motion';

/** Deep forest green for this card only; reads as premium against the mint donate section. */
const FOREST = '#10301A';
// The same logo file the site header loads, so it is usually cached already.
const LOGO = '/brand/logo-256.webp';
// A fine pinstripe gives the card face a printed, embossed feel without a gradient wash.
const CARD_FACE = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 10px), #23602F';

/** Decorative gift card pair. Sized in percentages so it scales from a 320px phone to a desktop. */
function GiftCardArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[310/206] w-full max-w-[340px] md:max-w-[400px]">
      <div className="absolute left-[11%] top-[10.7%] aspect-[1.586] w-[90%] rotate-[7deg] rounded-2xl bg-[#3B7F47] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 motion-safe:group-hover:rotate-[9deg]" />
      <div
        className="absolute left-[4%] top-[4%] flex aspect-[1.586] w-[93.5%] -rotate-[4deg] flex-col justify-between rounded-2xl p-[6.5%] text-white shadow-[0_30px_50px_-18px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-transform duration-500 motion-safe:group-hover:-rotate-[6deg]"
        style={{ background: CARD_FACE }}
      >
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white md:h-11 md:w-11 lg:h-12 lg:w-12 lg:rounded-xl"><img src={LOGO} alt="" className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9" width={36} height={36} /></span>
          <span className="text-[13px] text-white/80 lg:text-[15px]">eGift card</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="text-[13px] tracking-[0.14em] text-white/90 sm:text-[15px] lg:text-[17px]">•••• •••• 4821</span>
          <span className="font-display text-[26px] leading-none sm:text-[30px] md:text-[34px] lg:text-[42px]">$25</span>
        </div>
      </div>
    </div>
  );
}

/**
 * The "donate a card you already have" card under the donate box (homepage and /donate).
 * Founder's pick from the design options (Oct 2026): a forest-green card with a gift card graphic.
 * Stacks on phones; graphic beside the text from md up.
 */
export function DonateCardPromo() {
  return (
    <Reveal className="mx-auto mt-8 max-w-5xl md:mt-10">
      <section
        data-donate-card-link
        aria-labelledby="donate-card-promo-heading"
        className="group grid items-center gap-6 overflow-hidden rounded-[1.75rem] px-6 pb-7 pt-7 text-white ring-1 ring-white/10 sm:px-8 md:grid-cols-[1.05fr_1fr] md:gap-10 md:p-10 lg:gap-14 lg:p-14"
        style={{ backgroundColor: FOREST }}
      >
        <div className="md:order-last"><GiftCardArt /></div>
        <div className="flex flex-col">
          <h2 id="donate-card-promo-heading" className="font-display text-[2.25rem] font-normal leading-[1.02] sm:text-[2.5rem] lg:text-[3.25rem]">Have a gift card you won’t use?</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75 md:mt-4 md:text-base">Donate the code to a family who asked for help, or to our shared pool. Our team checks the balance before it’s given.</p>
          <Link
            to="/donate-a-card"
            className="mt-6 inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-white px-7 text-base font-semibold outline-none transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#10301A] sm:w-auto sm:self-start md:mt-8"
            style={{ color: FOREST }}
          >
            Donate a card
          </Link>
          <p className="mt-3.5 text-center text-[13px] text-white/65 sm:text-left">Digital gift cards, store coupons and promo codes</p>
        </div>
      </section>
    </Reveal>
  );
}
