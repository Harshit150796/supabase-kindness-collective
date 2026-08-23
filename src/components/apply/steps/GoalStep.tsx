import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sparkles, TrendingUp, Check, MapPin } from "lucide-react";

interface GoalStepProps {
  goalAmount: string;
  setGoalAmount: (value: string) => void;
  smartMatching: boolean;
  setSmartMatching: (value: boolean) => void;
  beneficiaryType: string;
  zipCode: string;
  setZipCode: (value: string) => void;
  locationLabel?: string | null;
}

const personalAmounts = [100, 250, 500, 1000];
const organizationAmounts = [500, 1500, 3000, 5000];

export const GoalStep = ({
  goalAmount,
  setGoalAmount,
  smartMatching,
  setSmartMatching,
  beneficiaryType,
  zipCode,
  setZipCode,
  locationLabel,
}: GoalStepProps) => {
  const numericGoal = parseInt(goalAmount) || 0;
  const [displayAmount, setDisplayAmount] = useState(0);

  const isOrganization = beneficiaryType === "organization";
  const suggestedAmounts = isOrganization ? organizationAmounts : personalAmounts;
  const helperText = isOrganization
    ? "Organizations often request $1,500–$5,000 to cover a program period — tell donors the timeframe in your story."
    : "Most personal requests are $150–$600.";
  const progressCeiling = isOrganization ? 5000 : 1000;
  const cityState = locationLabel && locationLabel.includes(",") ? locationLabel : null;
  // Long labels ("San Luis Obispo, CA") would collide with the digits on narrow
  // screens, so they confirm on a line below the field instead of inside it.
  const inlineCityState = !!cityState && cityState.length <= 16;

  // Animate the display amount when goal changes
  useEffect(() => {
    if (numericGoal === 0) {
      setDisplayAmount(0);
      return;
    }

    const duration = 500;
    const steps = 20;
    const stepValue = numericGoal / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= numericGoal) {
        setDisplayAmount(numericGoal);
        clearInterval(timer);
      } else {
        setDisplayAmount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericGoal]);

  return (
    <div className="space-y-10 stagger-children">
      {/* Amount Input Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">How much do you need?</h2>
            <p className="text-sm text-muted-foreground">
              One goal. Once it's fully funded, your request closes.
            </p>
          </div>
        </div>

        {/* Large Amount Input */}
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground/60 group-focus-within:text-primary transition-colors">
            $
          </div>
          <Input
            type="number"
            placeholder="0"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            className="h-20 text-3xl font-bold pl-14 pr-24 rounded-2xl border-2 border-border/60 bg-card hover:border-primary/30 focus:border-primary transition-all input-focus-ring"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-secondary/80 px-4 py-1.5 rounded-lg text-sm font-semibold text-muted-foreground">
            USD total
          </div>
        </div>

        {/* Suggested Amounts */}
        <div className="flex flex-wrap gap-3">
          {suggestedAmounts.map((amount) => {
            const isSelected = goalAmount === amount.toString();
            return (
              <button
                key={amount}
                onClick={() => setGoalAmount(amount.toString())}
                className={`
                  pill-chip px-6 py-2.5 rounded-full border-2 font-semibold
                  ${isSelected
                    ? "selected"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                ${amount.toLocaleString()}
                {isSelected && <Check className="w-4 h-4 ml-2 inline animate-check-pop" />}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/80 mt-1.5 shrink-0" />
          {helperText}
        </p>
      </div>

      {/* ZIP code */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Where are you located?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your ZIP code matches you with retailers near you. Vouchers are redeemable at US
            retailers only.
          </p>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <MapPin className="w-5 h-5 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            id="apply-zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="ZIP code"
            aria-label="ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className={`h-14 w-full rounded-2xl bg-muted/40 border border-border pl-12 text-lg
              font-medium tracking-normal transition-all hover:border-primary/30
              focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20
              ${cityState ? "pr-36" : "pr-4"}`}
          />
          {cityState && (
            <div className="absolute inset-y-0 right-4 hidden xs:flex items-center gap-1.5 pointer-events-none animate-fade-in">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{cityState}</span>
            </div>
          )}
        </div>

        {cityState && (
          <p className="xs:hidden flex items-center gap-1.5 text-sm font-medium text-primary animate-fade-in">
            <Check className="w-4 h-4" />
            {cityState}
          </p>
        )}
      </div>


      {/* Smart Matching Card - Glass effect */}
      <div className="glass-strong rounded-2xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-accent animate-sparkle" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h3 className="font-semibold text-foreground text-lg">Smart coupon matching</h3>
                <span className="bg-accent/20 text-accent text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide pulse-glow">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We'll automatically match you with available brand coupons based on your category and maximize your savings.
              </p>
            </div>
          </div>
          <Switch
            checked={smartMatching}
            onCheckedChange={setSmartMatching}
            className="flex-shrink-0 scale-110"
          />
        </div>
      </div>

      {/* Goal progress preview */}
      {numericGoal > 0 && (
        <div className="bg-gradient-to-br from-secondary via-secondary/80 to-primary/5 rounded-2xl p-6 border border-primary/10 animate-scale-in">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your goal</span>
            <span className="font-semibold text-primary">${displayAmount.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-border/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-light rounded-full transition-all duration-500 ease-out progress-glow"
              style={{ width: `${Math.min((numericGoal / progressCeiling) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-primary" />
            100% of donations go directly to your coupon wallet
          </p>
        </div>
      )}
    </div>
  );
};
