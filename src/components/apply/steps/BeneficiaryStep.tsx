import { User, Users, Building2 } from "lucide-react";

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
      <h2 className="text-xl font-semibold text-foreground">
        Who are you applying for?
      </h2>

      <div className="space-y-4">
        {beneficiaryOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = beneficiaryType === option.id;

          return (
            <button
              key={option.id}
              onClick={() => setBeneficiaryType(option.id)}
              className={`
                w-full p-6 rounded-xl border-2 text-left transition-all duration-200
                flex items-start gap-4
                ${isSelected
                  ? "bg-accent/10 border-accent shadow-sm"
                  : "bg-card border-border hover:border-primary/50 hover:shadow-sm"
                }
              `}
            >
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                  ${isSelected ? "bg-accent/20" : "bg-secondary"}
                `}
              >
                <Icon
                  className={`w-6 h-6 ${isSelected ? "text-accent" : "text-muted-foreground"}`}
                />
              </div>
              
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold mb-1 ${
                    isSelected ? "text-foreground" : "text-foreground"
                  }`}
                >
                  {option.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {option.description}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1
                  ${isSelected ? "border-accent" : "border-border"}
                `}
              >
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-accent" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
