import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserCountry } from "@/lib/geo";
import { useAuth } from "@/hooks/useAuth";

type Status = "checking" | "allowed" | "blocked";
type Mode = "advisory" | "strict";

let advisoryToastShown = false;
let blockedToastShown = false;

interface GeoGuardProps {
  children: ReactNode;
  /**
   * "advisory" (default) renders children immediately and only shows a notice
   * for non-US visitors. "strict" redirects non-US visitors, except admins.
   */
  mode?: Mode;
}

export function GeoGuard({ children, mode = "advisory" }: GeoGuardProps) {
  const { hasRole, rolesLoaded } = useAuth();
  const isAdmin = hasRole("admin");
  const strict = mode === "strict";

  const [status, setStatus] = useState<Status>(strict ? "checking" : "allowed");

  useEffect(() => {
    let cancelled = false;

    // Admins bypass geo entirely — role checks + RLS are the real control.
    if (strict && !rolesLoaded) return;
    if (strict && isAdmin) {
      setStatus("allowed");
      return;
    }

    getUserCountry().then((country) => {
      if (cancelled) return;
      // Fail-open: null country (lookup failed) is allowed.
      const isUS = country === null || country === "US";

      if (isUS) {
        setStatus("allowed");
        return;
      }

      if (strict) {
        if (!blockedToastShown) {
          blockedToastShown = true;
          toast.error("Admin access is restricted to United States residents.");
        }
        setStatus("blocked");
        return;
      }

      // Advisory: informational only, never blocks.
      if (!advisoryToastShown) {
        advisoryToastShown = true;
        toast.info("Vouchers are redeemable at US retailers only.");
      }
      setStatus("allowed");
    });

    return () => {
      cancelled = true;
    };
  }, [strict, isAdmin, rolesLoaded]);

  if (strict && status === "checking") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-muted-foreground">
        Checking access...
      </div>
    );
  }

  if (status === "blocked") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
