import { User, Users, Building2, Check } from "lucide-react";

interface BeneficiaryStepProps {
  beneficiaryType: string;
  setBeneficiaryType: (value: string) => void;
}

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
    description: "Coupons are distributed through your nonprofit",
  },
];

export const BeneficiaryStep = ({
  beneficiaryType,
  setBeneficiaryType,
}: BeneficiaryStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground animate-fade-in">
        Who are you fundraising for?
      </h2>

      <div className="space-y-4 stagger-children">
        {beneficiaryOptions.map((option, index) => {
          const Icon = option.icon;
          const isSelected = beneficiaryType === option.id;

          return (
            <button
              key={option.id}
              onClick={() => setBeneficiaryType(option.id)}
              style={{ animationDelay: `${index * 0.08}s` }}
              className={`
                selection-card w-full p-6 rounded-2xl border-2 text-left
                flex items-start gap-5 group
                ${isSelected
                  ? "selected"
                  : "bg-card border-border/60"
                }
              `}
            >
              {/* Icon container */}
              <div
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                  transition-all duration-300
                  ${isSelected 
                    ? "bg-primary shadow-lg shadow-primary/20" 
                    : "bg-secondary group-hover:bg-primary/10"
                  }
                `}
              >
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isSelected 
                      ? "text-primary-foreground scale-110" 
                      : "text-muted-foreground group-hover:text-primary"
                  }`}
                />
              </div>
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-lg font-semibold mb-1.5 transition-colors ${
                    isSelected ? "text-foreground" : "text-foreground"
                  }`}
                >
                  {option.title}
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isSelected ? "text-muted-foreground" : "text-muted-foreground"
                }`}>
                  {option.description}
                </p>
              </div>

              {/* Selection indicator */}
              <div
                className={`
                  w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1
                  transition-all duration-300
                  ${isSelected 
                    ? "border-primary bg-primary" 
                    : "border-border/80 group-hover:border-primary/50"
                  }
                `}
              >
                {isSelected && (
                  <Check className="w-4 h-4 text-primary-foreground animate-check-pop" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-sm text-muted-foreground pt-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        This helps us understand how to best support your needs
      </p>
    </div>
  );
};
