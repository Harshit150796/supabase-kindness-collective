import { Reveal } from '@/components/ui/editorial-motion';

type Step = { title: string; phone: string };

// The homepage description we give Google (index.html, Index.tsx), word for word (founder request, Nov 21, 2026).
export const GIVING_STATEMENT = {
  lead: "World's most trusted crowdfunding platform.",
  body: 'CouponDonation is transforming giving: donated money becomes coupons, with trackable, transparent giving for every donor.',
};

const TONES = ['hsl(var(--primary))', 'hsl(var(--verify))', 'hsl(var(--primary))', 'hsl(var(--verify))']; // logo green / logo blue

/**
 * Phones and tablets (below lg): "Give what people need." as one wide statement and four plain steps
 * (founder request, Nov 21, 2026: the coin path was too big and cluttered on phones). The statement is
 * the homepage description Google shows, set full width on a deep-green panel; the steps are a single
 * column of number, title and one line, so the whole section reads in one screen and a half.
 */
export function PhoneGivingSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="mt-7" data-giving-steps="phone-list">
      <Reveal>
        <div className="rounded-2xl bg-[hsl(var(--primary))] px-5 py-6 text-white sm:px-7 sm:py-8" data-giving-statement>
          <p className="font-display text-[1.75rem] font-normal leading-[1.12] sm:text-[2.1rem]">{GIVING_STATEMENT.lead}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/90 sm:text-base">{GIVING_STATEMENT.body}</p>
        </div>
      </Reveal>
      <ol className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-x-8">
        {steps.map((step, index) => (
          <li key={step.title} data-phone-step={index + 1}>
            <Reveal delay={0.05 * index} className="flex items-baseline gap-4">
              <span className="w-7 shrink-0 font-display text-[1.6rem] leading-none tabular-nums" style={{ color: TONES[index] }} aria-hidden="true">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-[1.3rem] font-normal leading-tight text-foreground">{step.title}</h3>
                <p className="mt-1 text-[15px] leading-snug text-muted-foreground">{step.phone}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
