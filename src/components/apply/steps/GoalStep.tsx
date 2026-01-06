import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sparkles, ShoppingCart, Heart, GraduationCap, TrendingUp, Check } from "lucide-react";

interface GoalStepProps {
  monthlyGoal: string;
  setMonthlyGoal: (value: string) => void;
  smartMatching: boolean;
  setSmartMatching: (value: boolean) => void;
  category: string;
}

const suggestedAmounts = [50, 100, 200, 500];

const getCategoryImpact = (category: string, amount: number) => {
  const impacts: Record<string, { icon: typeof ShoppingCart; text: string; color: string }> = {
    food: {
      icon: ShoppingCart,
      text: `${Math.round(amount / 50)} weeks of groceries`,
      color: "text-emerald-600",
    },
    healthcare: {
      icon: Heart,
      text: `${Math.round(amount / 30)} medical co-pays covered`,
      color: "text-rose-500",
    },
    education: {
      icon: GraduationCap,
      text: `${Math.round(amount / 25)} school supplies sets`,
      color: "text-blue-500",
    },
    clothing: {
      icon: ShoppingCart,
      text: `${Math.round(amount / 40)} essential clothing items`,
      color: "text-purple-500",
    },
    transportation: {
      icon: ShoppingCart,
      text: `${Math.round(amount / 60)} gas fill-ups`,
      color: "text-orange-500",
    },
    utilities: {
      icon: ShoppingCart,
      text: `${Math.round(amount / 100)} monthly utility bills`,
      color: "text-cyan-500",
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
  const [displayAmount, setDisplayAmount] = useState(0);

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
          <h2 className="text-xl font-semibold text-foreground">
            How much do you need each month?
          </h2>
        </div>

        {/* Large Amount Input */}
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground/60 group-focus-within:text-primary transition-colors">
            $
          </div>
          <Input
            type="number"
            placeholder="0"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            className="h-20 text-3xl font-bold pl-14 pr-24 rounded-2xl border-2 border-border/60 bg-card hover:border-primary/30 focus:border-primary transition-all input-focus-ring"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-secondary/80 px-4 py-1.5 rounded-lg text-sm font-semibold text-muted-foreground">
            USD / month
          </div>
        </div>

        {/* Suggested Amounts */}
        <div className="flex flex-wrap gap-3">
          {suggestedAmounts.map((amount) => {
            const isSelected = monthlyGoal === amount.toString();
            return (
              <button
                key={amount}
                onClick={() => setMonthlyGoal(amount.toString())}
                className={`
                  pill-chip px-6 py-2.5 rounded-full border-2 font-semibold
                  ${isSelected 
                    ? "selected" 
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                ${amount}
                {isSelected && <Check className="w-4 h-4 ml-2 inline animate-check-pop" />}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/80" />
          Families like yours typically request $100-$300 per month
        </p>
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

      {/* Impact Preview - Animated */}
      {numericGoal > 0 && (
        <div className="bg-gradient-to-br from-secondary via-secondary/80 to-primary/5 rounded-2xl p-6 border border-primary/10 animate-scale-in">
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center ${impact.color}`}>
              <ImpactIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your monthly goal equals</p>
              <p className="text-foreground font-bold text-lg">
                ≈ {impact.text}
              </p>
            </div>
          </div>
          
          {/* Visual progress indicator */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Impact preview</span>
              <span className="font-semibold text-primary">${displayAmount}</span>
            </div>
            <div className="h-2 bg-border/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-emerald-light rounded-full transition-all duration-500 ease-out progress-glow"
                style={{ width: `${Math.min((numericGoal / 500) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" />
              100% of donations go directly to your coupon wallet
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
