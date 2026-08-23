import { useState } from "react";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  onGoogleAuth: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  /** Copy tuned to what happens after they finish */
  intent: "advance" | "submit";
  goalAmount?: string;
  title?: string;
}

export const AccountDialog = ({
  open,
  onOpenChange,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  onGoogleAuth,
  onSubmit,
  isLoading = false,
  intent,
  goalAmount,
  title,
}: AccountDialogProps) => {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strengthPercent = (passedChecks / 4) * 100;
  const strengthColor =
    passedChecks <= 1 ? "bg-destructive" : passedChecks <= 3 ? "bg-gold" : "bg-primary";
  const strengthLabel =
    passedChecks <= 1 ? "Weak" : passedChecks <= 2 ? "Fair" : passedChecks <= 3 ? "Good" : "Strong";

  const canSubmit = !!email && !!fullName && checks.length && !isLoading;

  const description =
    intent === "submit"
      ? "Create your account to submit your request."
      : "Your answers are already saved — create your account and you'll come right back to this step.";

  const submitLabel = isLoading
    ? "Please wait..."
    : intent === "submit"
      ? "Create account & submit"
      : "Create account & continue";

  const body = (
    <div className="space-y-5">
      {/* What they're saving */}
      {(goalAmount || title) && (
        <div className="rounded-xl border border-border/60 bg-secondary/30 px-4 py-3">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {title || "Your request"}
          </p>
          {goalAmount ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Goal ${Number(goalAmount || 0).toLocaleString()} total
            </p>
          ) : null}
        </div>
      )}

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

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label htmlFor="account-name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="account-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            disabled={isLoading}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-border/60 bg-background text-foreground
              placeholder:text-muted-foreground/60 hover:border-border focus:border-primary focus:ring-4
              focus:ring-primary/10 focus:outline-none transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="account-email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-border/60 bg-background text-foreground
              placeholder:text-muted-foreground/60 hover:border-border focus:border-primary focus:ring-4
              focus:ring-primary/10 focus:outline-none transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="account-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="account-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              disabled={isLoading}
              className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-border/60 bg-background text-foreground
                placeholder:text-muted-foreground/60 hover:border-border focus:border-primary focus:ring-4
                focus:ring-primary/10 focus:outline-none transition-all duration-200 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {password && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${strengthPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{strengthLabel}</span>
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

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold
            hover:bg-primary/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        Already have an account? Enter the same email above and we'll take you to sign in.
      </p>

      <p className="text-xs text-muted-foreground text-center">
        By creating an account, you agree to our{" "}
        <a href="/terms" className="text-primary hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Save your request</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save your request</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};
