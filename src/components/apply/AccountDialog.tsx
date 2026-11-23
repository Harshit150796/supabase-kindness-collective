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
import type { User } from "@supabase/supabase-js";
import { AgreementNotice } from "@/components/legal/AgreementNotice";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  /** Google signs them in right here (no redirect), so the application carries on. */
  onGoogleStart: () => void;
  onGoogleSignedIn: (user: User) => void;
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
  onGoogleStart,
  onGoogleSignedIn,
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
    passedChecks <= 1 ? "bg-destructive" : passedChecks <= 3 ? "bg-verify" : "bg-primary";
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

      {/* Google: no code email to wait for (founder request, Nov 22, 2026) */}
      <div className={isLoading ? "pointer-events-none opacity-50" : undefined}>
        <GoogleSignIn onBeforeSignIn={onGoogleStart} onSignedIn={onGoogleSignedIn} />
      </div>
      <AgreementNotice google className="-mt-2 text-center text-[13px]" />

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

        <AgreementNotice action={intent === "submit" ? "Create account & submit" : "Create account & continue"} className="text-[13px]" />
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
