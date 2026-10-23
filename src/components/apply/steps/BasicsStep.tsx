import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { NeedsAndStores } from "../NeedsAndStores";
import { BENEFICIARY_OPTIONS } from "../applyOptions";

interface BasicsStepProps {
  beneficiaryType: string;
  setBeneficiaryType: (value: string) => void;
  needs: string[];
  setNeeds: (value: string[]) => void;
  stores: string[];
  setStores: (value: string[]) => void;
  similarOk: boolean;
  setSimilarOk: (value: boolean) => void;
}


/** Step 1: who the request is for, what it's for (several needs), and the stores that would help. */
export const BasicsStep = ({
  beneficiaryType,
  setBeneficiaryType,
  needs,
  setNeeds,
  stores,
  setStores,
  similarOk,
  setSimilarOk,
}: BasicsStepProps) => {
  return (
    <div className="space-y-12">
      <section aria-labelledby="who-heading">
        <h2 id="who-heading" className="font-display text-[1.75rem] font-normal leading-tight text-foreground sm:text-[2rem]">Who is this request for?</h2>
        <div role="radiogroup" aria-labelledby="who-heading" className="mt-5 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {BENEFICIARY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = beneficiaryType === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setBeneficiaryType(option.id)}
                data-who={option.id}
                className={cn(
                  "relative flex items-start gap-3.5 rounded-2xl p-4 text-left outline-none transition-[background-color,box-shadow,transform] duration-200 sm:flex-col sm:gap-4 sm:p-5",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[.98]",
                  selected
                    ? "bg-[hsl(var(--primary-97))] shadow-[inset_0_0_0_2px_hsl(var(--primary))] dark:bg-primary/15"
                    : "bg-muted/70 hover:bg-muted",
                )}
              >
                <Icon className={cn("mt-0.5 h-6 w-6 shrink-0 transition-colors sm:mt-0", selected ? "text-primary" : "text-foreground/70")} strokeWidth={1.75} aria-hidden="true" />
                <span className="min-w-0 pr-7 sm:pr-0">
                  <span className="block text-base font-medium text-foreground">{option.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{option.description}</span>
                </span>
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground"
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.12 } }}
                      transition={{ type: "spring", stiffness: 640, damping: 30 }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </section>

      <NeedsAndStores
        needs={needs}
        onNeeds={setNeeds}
        stores={stores}
        onStores={setStores}
        similarOk={similarOk}
        onSimilarOk={setSimilarOk}
      />
    </div>
  );
};
