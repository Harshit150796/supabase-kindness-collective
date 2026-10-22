import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { MenuButton } from "@/components/navigation/MenuButton";
import { signInPath } from "@/lib/serverActions";
import { cn } from "@/lib/utils";
import { SPRING } from "@/components/landing/donate/tokens";
import { APPLY_STEPS } from "./applyOptions";


interface ApplyLayoutProps {
  step: number;
  /** The furthest step reached; earlier steps are clickable in the track. */
  reached: number;
  onGoTo: (step: number) => void;
  headline: string;
  subtext?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  /** Why Continue is off, shown beside it ("Choose at least one store"). */
  blockedReason?: string | null;
  continueLabel?: string;
  busy?: boolean;
  showBack?: boolean;
  direction?: "forward" | "backward";
  isAuthenticated?: boolean;
  userEmail?: string;
  /** The live "Your request" panel for wide screens. */
  panel?: React.ReactNode;
}

const stepMotion = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -20, transition: { duration: 0.16 } }),
};

/**
 * The recipient application's frame: a quiet header, the step track, the step itself and a pinned
 * action bar, with the deep-green "Your request" panel beside it on wide screens.
 */
export const ApplyLayout = ({
  step,
  reached,
  onGoTo,
  headline,
  subtext,
  children,
  onBack,
  onContinue,
  continueDisabled = false,
  blockedReason,
  continueLabel = "Continue",
  busy = false,
  showBack = true,
  direction = "forward",
  isAuthenticated = false,
  userEmail,
  panel,
}: ApplyLayoutProps) => {
  const dir = direction === "forward" ? 1 : -1;
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] xl:grid-cols-[minmax(0,1fr)_32rem]">
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-background/90 px-4 backdrop-blur-md sm:px-8 lg:px-12 xl:px-16">
          <Link to="/" className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="CouponDonation home">
            <img src={logo} alt="" className="h-9 w-9 shrink-0" width={36} height={36} />
            <span className="truncate text-[17px] font-bold"><span className="text-[#2e7d32]">Coupon</span><span className="text-[#1565c0]">Donation</span></span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {isAuthenticated ? (
              <Link to="/profile" className="hidden min-h-11 max-w-[14rem] items-center truncate rounded-md px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex" title={userEmail}>
                {userEmail}
              </Link>
            ) : (
              <Link to={signInPath("/apply")} className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
                Sign in
              </Link>
            )}
            <MenuButton />
          </div>
        </header>

        <main className="flex flex-1 flex-col px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-[46rem] flex-1 pb-10 pt-4 sm:pt-6 lg:pt-8">
            <ol className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Application steps">
              {APPLY_STEPS.map((label, i) => {
                const n = i + 1;
                const current = n === step;
                const done = n < step;
                const canGo = n !== step && n <= reached;
                return (
                  <li key={label} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => canGo && onGoTo(n)}
                      disabled={!canGo}
                      aria-current={current ? "step" : undefined}
                      className="group block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 disabled:cursor-default"
                    >
                      <span className="relative block h-[3px] overflow-hidden rounded-full bg-border">
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-full bg-primary"
                          initial={false}
                          animate={{ width: done || current ? "100%" : "0%" }}
                          transition={SPRING}
                        />
                      </span>
                      <span className={cn(
                        "mt-2 hidden truncate text-[13px] tabular-nums transition-colors sm:block",
                        current ? "font-medium text-foreground" : done ? "text-muted-foreground group-hover:text-foreground" : "text-muted-foreground/70",
                      )}>
                        <span className="mr-1.5">{n}</span>{label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2.5 flex items-baseline justify-between text-[13px] sm:hidden" aria-hidden="true">
              <span className="font-medium text-foreground">{APPLY_STEPS[step - 1]}</span>
              <span className="tabular-nums text-muted-foreground">{step} of {APPLY_STEPS.length}</span>
            </p>

            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={stepMotion}
                initial="enter"
                animate="center"
                exit="exit"
                transition={SPRING}
              >
                <h1 className="mt-8 font-display text-[2.5rem] font-normal leading-[1.04] text-ink dark:text-foreground sm:mt-10 sm:text-[3.25rem] lg:text-[3.5rem]">
                  {headline}
                </h1>
                {subtext && <p className="mt-3 max-w-[36rem] text-[17px] leading-relaxed text-muted-foreground">{subtext}</p>}
                <div className="mt-10 sm:mt-12">{children}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="sticky bottom-0 z-20 -mx-4 mt-auto bg-background/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 xl:-mx-16 xl:px-16">
            <div className="mx-auto flex w-full max-w-[46rem] items-center justify-between gap-3 border-t border-border/70 pt-3">
              {showBack && onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl px-3 text-[15px] font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
              ) : <span />}
              <div className="flex min-w-0 items-center gap-3">
                <AnimatePresence initial={false}>
                  {continueDisabled && blockedReason && (
                    <motion.p
                      key={blockedReason}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block"
                      aria-live="polite"
                    >
                      {blockedReason}
                    </motion.p>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={continueDisabled || busy}
                  data-apply-continue
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-[15px] font-semibold text-primary-foreground outline-none transition-[background-color,opacity,transform] hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {continueLabel}
                </button>
              </div>
            </div>
            {continueDisabled && blockedReason && <p className="mx-auto mt-2 max-w-[46rem] text-right text-[13px] text-muted-foreground sm:hidden">{blockedReason}</p>}
          </div>
        </main>
      </div>

      {panel && <div className="hidden lg:block"><div className="sticky top-0 h-dvh overflow-y-auto">{panel}</div></div>}
    </div>
  );
};
