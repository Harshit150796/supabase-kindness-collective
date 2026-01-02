import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Criterion {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const criteria: Criterion[] = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const strengthPercent = (metCount / criteria.length) * 100;

  const getStrengthColor = () => {
    if (metCount <= 2) return "bg-destructive";
    if (metCount <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (metCount <= 2) return "Weak";
    if (metCount <= 3) return "Medium";
    if (metCount <= 4) return "Strong";
    return "Very Strong";
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            metCount <= 2 && "text-destructive",
            metCount === 3 && "text-yellow-600",
            metCount >= 4 && "text-green-600"
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", getStrengthColor())}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
      </div>
      <ul className="text-xs space-y-1.5">
        {criteria.map((criterion, index) => (
          <li
            key={index}
            className={cn(
              "flex items-center gap-2 transition-colors",
              criterion.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {criterion.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {criterion.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
