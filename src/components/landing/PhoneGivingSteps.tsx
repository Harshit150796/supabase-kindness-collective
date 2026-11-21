import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

type Step = { title: string; phone: string };

// The homepage description we give Google (index.html, Index.tsx), word for word (founder request, Nov 21, 2026).
export const GIVING_STATEMENT = {
  lead: "World's most trusted crowdfunding platform.",
  body: 'CouponDonation is transforming giving: donated money becomes coupons, with trackable, transparent giving for every donor.',
};

const WORDS = ['One', 'Two', 'Three', 'Four'];
const TONES = ['text-primary', 'text-verify', 'text-primary', 'text-verify']; // logo green / logo blue

/**
 * Phones and tablets (below lg): "Quiet luxury" (founder's pick, Nov 21, 2026, design 12 of 12, with the
 * statement styled as in design 04: blue italic serif). Centred and spacious: a small heart, the heading,
 * the homepage description Google shows, a short rule, then the four steps as One to Four. It replaced
 * "One coin's path", which was too big and cluttered on phones.
 */
export function PhoneGivingSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="mx-auto flex max-w-[30rem] flex-col items-center px-2 pb-2 pt-4 text-center" data-giving-steps="quiet">
      <svg viewBox="0 0 24 24" className="h-[34px] w-[34px] text-primary" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
      <LineReveal><h2 className="mt-5 font-display text-[2.3rem] font-normal min-[380px]:text-[2.625rem] leading-[1.04] text-foreground">Give what people need.</h2></LineReveal>
      <Reveal delay={0.06}>
        <p className="mt-5 text-balance font-display text-[1.625rem] italic leading-[1.15] text-verify" data-giving-statement>{GIVING_STATEMENT.lead}</p>
        <p className="mx-auto mt-4 max-w-[20rem] text-balance text-[15.5px] leading-[1.65] text-muted-foreground">{GIVING_STATEMENT.body}</p>
      </Reveal>
      <div className="my-8 h-px w-10 bg-border" aria-hidden="true" />
      <ol className="flex w-full flex-col gap-[1.625rem]">
        {steps.map((step, index) => (
          <li key={step.title} data-phone-step={index + 1}>
            <Reveal delay={0.04 * index}>
              <p className={`text-[13px] tracking-[0.04em] ${TONES[index]}`}>{WORDS[index]}</p>
              <h3 className="mt-1 font-display text-2xl font-normal leading-tight text-foreground">{step.title}</h3>
              <p className="mt-0.5 text-[14.5px] text-muted-foreground">{step.phone}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
