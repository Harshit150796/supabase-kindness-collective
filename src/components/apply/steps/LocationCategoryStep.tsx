import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Heart,
  GraduationCap,
  Shirt,
  Car,
  Zap,
  Check,
  MapPin,
  User,
  Users,
  Building2,
} from "lucide-react";
import { useZipLocation } from "@/lib/zipLookup";

interface LocationCategoryStepProps {
  zipCode: string;
  setZipCode: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  beneficiaryType: string;
  setBeneficiaryType: (value: string) => void;
}

const categories = [
  { id: "food", label: "Food & Groceries", icon: ShoppingCart },
  { id: "healthcare", label: "Healthcare", icon: Heart },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "transportation", label: "Transportation", icon: Car },
  { id: "utilities", label: "Utilities", icon: Zap },
];

const beneficiaryOptions = [
  {
    id: "yourself",
    icon: User,
    title: "Yourself",
    description: "Coupons are delivered to your account for your own use",
  },
  {
    id: "family",
    icon: Users,
    title: "My Family",
    description: "You're applying on behalf of your household",
  },
  {
    id: "organization",
    icon: Building2,
    title: "Community Organization",
    description: "Vouchers are issued to verified recipients referred by your organization",
  },
];

export const LocationCategoryStep = ({
  zipCode,
  setZipCode,
  category,
  setCategory,
  beneficiaryType,
  setBeneficiaryType,
}: LocationCategoryStepProps) => {
  const resolved = useZipLocation(zipCode, "us");
  const cityState = resolved && resolved.includes(",") ? resolved : null;

  return (
    <div className="space-y-10 stagger-children">
      {/* Location Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            What's your ZIP code?
          </h2>
        </div>

        <div className="max-w-xs space-y-2">
          <label htmlFor="apply-zip" className="text-sm font-medium text-foreground">
            ZIP code
          </label>
          <Input
            id="apply-zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="e.g. 78701"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className="h-14 rounded-xl border-border/80 bg-card hover:border-primary/50 transition-colors input-focus-ring text-base tracking-widest"
          />
          {cityState && (
            <p className="text-sm font-medium text-primary flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4" />
              {cityState}
            </p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-secondary/50 border border-border/30">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">United States (US)</span> — vouchers are
            redeemable at US retailers only.
          </p>
        </div>
      </div>

      {/* Category Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          What type of assistance do you need?
        </h2>

        <div className="flex flex-wrap gap-3 stagger-fast">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`
                  pill-chip inline-flex items-center gap-2.5 px-5 py-3 rounded-full border-2 font-medium
                  ${isSelected
                    ? "selected"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <span className={`transition-transform duration-300 ${isSelected ? "scale-110" : ""}`}>
                  <Icon className={`w-4 h-4 ${isSelected ? "text-primary-foreground" : ""}`} />
                </span>
                <span>{cat.label}</span>
                {isSelected && <Check className="w-4 h-4 ml-1 animate-check-pop" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Beneficiary Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Who are you fundraising for?
        </h2>

        <div className="space-y-3">
          {beneficiaryOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = beneficiaryType === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setBeneficiaryType(option.id)}
                className={`
                  selection-card w-full p-4 rounded-2xl border-2 text-left
                  flex items-start gap-4 group
                  ${isSelected ? "selected" : "bg-card border-border/60"}
                `}
              >
                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    transition-all duration-300
                    ${isSelected
                      ? "bg-primary shadow-lg shadow-primary/20"
                      : "bg-secondary group-hover:bg-primary/10"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isSelected
                        ? "text-primary-foreground scale-110"
                        : "text-muted-foreground group-hover:text-primary"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-0.5">{option.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>

                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                    transition-all duration-300
                    ${isSelected
                      ? "border-primary bg-primary"
                      : "border-border/80 group-hover:border-primary/50"
                    }
                  `}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary-foreground animate-check-pop" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
