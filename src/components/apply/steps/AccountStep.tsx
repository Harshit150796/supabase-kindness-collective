import { useState } from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";

interface AccountStepProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (name: string) => void;
  onGoogleAuth: () => void;
  isLoading?: boolean;
}

export const AccountStep = ({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  onGoogleAuth,
  isLoading = false,
}: AccountStepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password validation
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strengthPercent = (passedChecks / 4) * 100;

  const getStrengthColor = () => {
    if (passedChecks <= 1) return "bg-destructive";
    if (passedChecks <= 2) return "bg-gold";
    if (passedChecks <= 3) return "bg-gold";
    return "bg-primary";
  };

  const getStrengthLabel = () => {
    if (passedChecks <= 1) return "Weak";
    if (passedChecks <= 2) return "Fair";
    if (passedChecks <= 3) return "Good";
    return "Strong";
  };

  return (
    <div className="space-y-6 stagger-children">
      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="text-muted-foreground">
          Set up your account to submit your request and receive coupons.
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={onGoogleAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-border/60 bg-background hover:bg-secondary/50 hover:border-border transition-all duration-200 disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-medium text-foreground">Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Full Name Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onFocus={() => setFocusedField("name")}
          onBlur={() => setFocusedField(null)}
          placeholder="Enter your full name"
          disabled={isLoading}
          className={`
            w-full px-4 py-3.5 rounded-xl border-2 bg-background
            text-foreground placeholder:text-muted-foreground/60
            transition-all duration-200
            disabled:opacity-50
            ${focusedField === "name"
              ? "border-primary ring-4 ring-primary/10"
              : "border-border/60 hover:border-border"
            }
          `}
        />
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
          placeholder="you@example.com"
          disabled={isLoading}
          className={`
            w-full px-4 py-3.5 rounded-xl border-2 bg-background
            text-foreground placeholder:text-muted-foreground/60
            transition-all duration-200
            disabled:opacity-50
            ${focusedField === "email"
              ? "border-primary ring-4 ring-primary/10"
              : "border-border/60 hover:border-border"
            }
          `}
        />
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            placeholder="Create a secure password"
            disabled={isLoading}
            className={`
              w-full px-4 py-3.5 pr-12 rounded-xl border-2 bg-background
              text-foreground placeholder:text-muted-foreground/60
              transition-all duration-200
              disabled:opacity-50
              ${focusedField === "password"
                ? "border-primary ring-4 ring-primary/10"
                : "border-border/60 hover:border-border"
              }
            `}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${strengthPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{getStrengthLabel()}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { key: "length", label: "8+ characters" },
                { key: "uppercase", label: "Uppercase" },
                { key: "lowercase", label: "Lowercase" },
                { key: "number", label: "Number" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className={`flex items-center gap-1 ${
                    checks[key as keyof typeof checks] ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {checks[key as keyof typeof checks] ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Terms */}
      <p className="text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
        {" "}and{" "}
        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
      </p>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Creating your account...</span>
        </div>
      )}
    </div>
  );
};
