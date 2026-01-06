import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sparkles, ShoppingCart, Heart, GraduationCap } from "lucide-react";

interface GoalStepProps {
  monthlyGoal: string;
  setMonthlyGoal: (value: string) => void;
  smartMatching: boolean;
  setSmartMatching: (value: boolean) => void;
  category: string;
}

const suggestedAmounts = [50, 100, 200, 500];

const getCategoryImpact = (category: string, amount: number) => {
  const impacts: Record<string, { icon: typeof ShoppingCart; text: string }> = {
    food: {
      icon: ShoppingCart,
      text: `≈ ${Math.round(amount / 50)} weeks of groceries`,
    },
    healthcare: {
      icon: Heart,
      text: `≈ ${Math.round(amount / 30)} medical co-pays covered`,
    },
    education: {
      icon: GraduationCap,
      text: `≈ ${Math.round(amount / 25)} school supplies sets`,
    },
    clothing: {
      icon: ShoppingCart,
      text: `≈ ${Math.round(amount / 40)} essential clothing items`,
    },
    transportation: {
      icon: ShoppingCart,
      text: `≈ ${Math.round(amount / 60)} gas fill-ups`,
    },
    utilities: {
      icon: ShoppingCart,
      text: `≈ ${Math.round(amount / 100)} monthly utility bills`,
    },
  };

  return impacts[category] || impacts.food;
};

export const GoalStep = ({
  monthlyGoal,
  setMonthlyGoal,
  smartMatching,
  setSmartMatching,
  category,
}: GoalStepProps) => {
  const numericGoal = parseInt(monthlyGoal) || 0;
  const impact = getCategoryImpact(category, numericGoal);
  const ImpactIcon = impact.icon;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          How much do you need each month?
        </h2>

        {/* Amount Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
            $
          </div>
          <Input
            type="number"
            placeholder="Enter amount"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            className="h-16 text-2xl font-semibold pl-10 pr-20 rounded-xl border-border"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-secondary px-3 py-1 rounded-md text-sm font-medium text-muted-foreground">
            USD
          </div>
        </div>

        {/* Suggested Amounts */}
        <div className="flex flex-wrap gap-2">
          {suggestedAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setMonthlyGoal(amount.toString())}
              className={`
                px-4 py-2 rounded-full border font-medium transition-all duration-200
                ${monthlyGoal === amount.toString()
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50"
                }
              `}
            >
              ${amount}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Families like yours typically request $100-$300 per month.
        </p>
      </div>

      {/* Smart Matching Toggle */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Smart coupon matching</h3>
                <span className="bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll automatically match you with available brand coupons based on your category.
              </p>
            </div>
          </div>
          <Switch
            checked={smartMatching}
            onCheckedChange={setSmartMatching}
            className="flex-shrink-0"
          />
        </div>
      </div>

      {/* Impact Preview */}
      {numericGoal > 0 && (
        <div className="bg-secondary/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <ImpactIcon className="w-5 h-5 text-primary" />
            <p className="text-foreground font-medium">
              Your ${numericGoal}/month {impact.text}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            100% of donations go directly to your coupon wallet
          </p>
        </div>
      )}
    </div>
  );
};
