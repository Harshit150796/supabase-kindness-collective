import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserCountry } from "@/lib/geo";

type Status = "checking" | "allowed" | "blocked";

let toastShown = false;

interface GeoGuardProps {
  children: ReactNode;
}

export function GeoGuard({ children }: GeoGuardProps) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    getUserCountry().then((country) => {
      if (cancelled) return;
      // Fail-open: null country (lookup failed) is allowed.
      if (country === null || country === "US") {
        setStatus("allowed");
      } else {
        if (!toastShown) {
          toastShown = true;
          toast.error(
            "Campaign creation and beneficiary onboarding are currently restricted to United States residents."
          );
        }
        setStatus("blocked");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
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
