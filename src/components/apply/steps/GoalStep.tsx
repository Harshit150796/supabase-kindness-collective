import { BadgeCheck, Loader2, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/data/usStates";
import type { ZipStatus } from "@/lib/zipLookup";

interface GoalStepProps {
  goalAmount: string;
  setGoalAmount: (value: string) => void;
  beneficiaryType: string;
  zipCode: string;
  setZipCode: (value: string) => void;
  zip: { status: ZipStatus; city: string | null; stateCode: string | null };
}

const personalAmounts = [150, 300, 500, 1000];
const organizationAmounts = [1500, 3000, 5000, 10000];
const MAX_GOAL = 100000;
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const STATE_NAMES = new Map(US_STATES.map((s) => [s.code, s.name]));

/** Step 3: one total goal, and where the recipient lives (shown to donors as city and state only). */
export const GoalStep = ({ goalAmount, setGoalAmount, beneficiaryType, zipCode, setZipCode, zip }: GoalStepProps) => {
  const isOrganization = beneficiaryType === "organization";
  const presets = isOrganization ? organizationAmounts : personalAmounts;
  const numeric = parseInt(goalAmount, 10) || 0;
  const stateName = zip.stateCode ? STATE_NAMES.get(zip.stateCode) ?? zip.stateCode : null;

  const onAmount = (raw: string) => {
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 6);
    setGoalAmount(digits && Number(digits) > MAX_GOAL ? String(MAX_GOAL) : digits);
  };

  return (
    <div className="space-y-12">
      <section aria-labelledby="goal-heading">
        <h2 id="goal-heading" className="font-display text-[1.75rem] font-normal leading-tight text-foreground sm:text-[2rem]">How much do you need in total?</h2>
        <p className="mt-1.5 max-w-[34rem] text-[15px] leading-relaxed text-muted-foreground">
          One goal for the whole request. When it's fully funded, your request closes.
        </p>

        <label className="mt-5 flex h-[5.5rem] items-center gap-2 rounded-2xl bg-muted/60 px-5 transition-shadow focus-within:shadow-[inset_0_0_0_2px_hsl(var(--primary))] sm:h-24 sm:px-6">
          <span className={cn("font-display text-[2.75rem] leading-none transition-colors sm:text-5xl", numeric ? "text-foreground" : "text-muted-foreground/60")} aria-hidden="true">$</span>
          <input
            id="apply-goal"
            data-large-type
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            aria-label="Goal in US dollars"
            value={numeric ? whole.format(numeric) : ""}
            onChange={(e) => onAmount(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-display text-[2.75rem] leading-none tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-5xl"
          />
          <span className="shrink-0 text-sm font-medium text-muted-foreground">USD</span>
        </label>

        <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Common goals">
          {presets.map((amount) => {
            const selected = numeric === amount;
            return (
              <button
                key={amount}
                type="button"
                aria-pressed={selected}
                onClick={() => setGoalAmount(String(amount))}
                className={cn(
                  "h-12 rounded-xl text-[15px] font-medium tabular-nums outline-none transition-[background-color,box-shadow] duration-200",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[.98]",
                  selected
                    ? "bg-[hsl(var(--primary-97))] text-foreground shadow-[inset_0_0_0_2px_hsl(var(--primary))] dark:bg-primary/15"
                    : "bg-muted/70 text-foreground hover:bg-muted",
                )}
              >
                ${whole.format(amount)}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {isOrganization
            ? "Groups often ask for $1,500 to $5,000 for a program. Say how long it covers in your story."
            : "Most personal requests are between $150 and $600."}
        </p>
      </section>

      <section aria-labelledby="where-heading">
        <h2 id="where-heading" className="font-display text-[1.75rem] font-normal leading-tight text-foreground sm:text-[2rem]">Where do you live?</h2>
        <p className="mt-1.5 max-w-[34rem] text-[15px] leading-relaxed text-muted-foreground">
          Help is for people living in the United States. Your ZIP code finds your city.
        </p>

        <div className="mt-5 flex h-16 items-stretch overflow-hidden rounded-2xl bg-muted/60 transition-shadow focus-within:shadow-[inset_0_0_0_2px_hsl(var(--primary))]">
          <span className="flex shrink-0 items-center gap-2 border-r border-border/70 px-4 text-[15px] font-medium text-foreground sm:px-5">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            United States
          </span>
          <input
            id="apply-zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="ZIP code"
            aria-label="ZIP code"
            aria-describedby="apply-zip-status"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className="min-w-0 flex-1 bg-transparent px-4 text-xl font-medium tracking-[0.12em] tabular-nums text-foreground outline-none placeholder:tracking-normal placeholder:text-muted-foreground/60 sm:px-5"
          />
        </div>

        <div id="apply-zip-status" aria-live="polite" className="mt-4 min-h-[3.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={zip.status}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {zip.status === "found" && (
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-verify" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-medium leading-snug text-foreground">{zip.city}, {stateName}</p>
                    <p className="text-sm text-muted-foreground">Donors will see {zip.city}, {zip.stateCode}. Your ZIP code stays off your page.</p>
                  </div>
                </div>
              )}
              {zip.status === "checking" && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Finding your city</p>
              )}
              {zip.status === "partial" && (
                <p className="text-sm tabular-nums text-muted-foreground">{zipCode.length} of 5 digits</p>
              )}
              {zip.status === "empty" && <p className="text-sm text-muted-foreground">Enter your 5-digit ZIP code.</p>}
              {zip.status === "unknown" && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  We couldn't confirm the city for {zipCode}. Check the numbers. If they're right, you can still continue.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
