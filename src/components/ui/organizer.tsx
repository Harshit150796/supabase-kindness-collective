import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0 space-y-2"><h1 className="product-page-title">{title}</h1>{subtitle && <p className="product-body text-muted-foreground">{subtitle}</p>}</div>{action && <div className="shrink-0">{action}</div>}</header>;
}
export function CardSurface({ className, interactive, index, style, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; index?: number }) {
  return <div className={cn("dash-card", interactive && "dash-interactive-card", index != null && "dash-card-enter", className)} style={index != null ? { animationDelay: `${Math.min(index, 10) * 60}ms`, ...style } : style} {...props} />;
}
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("product-section-label", className)}>{children}</h2>;
}
export function Stat({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return <div className={cn("min-w-0", className)}><dt className="product-section-label">{label}</dt><dd className="product-stat mt-2">{value}</dd></div>;
}
const labels: Record<string, string> = { active: "Live", pending: "Under review", paused: "Paused", completed: "Completed", rejected: "Not approved", ready: "Ready", used: "Used", preparing: "Being prepared" };
export function StatusChip({ status }: { status: string }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-medium", status === "active" || status === "ready" ? "bg-primary/10 text-primary" : status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground")}>{labels[status] ?? status}</span>;
}
export function ProgressBar({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setEntered(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setEntered(true); observer.disconnect(); } }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const pct = Math.max(0, Math.min(100, value));
  return <div ref={ref} role="progressbar" aria-label="Fundraiser goal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full origin-left bg-primary motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out" style={{ transform: `scaleX(${entered ? pct / 100 : 0})` }} /></div>;
}
export function EmptyState({ title, description, action, error }: { title: string; description: string; action?: ReactNode; error?: boolean }) {
  return <div role={error ? "alert" : undefined} className="flex min-h-72 flex-col items-center justify-center px-6 py-14 text-center"><p className="font-sans text-lg font-semibold text-foreground">{title}</p><p className="product-body mt-3 max-w-md text-muted-foreground">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}
export function FundraiserCardSkeleton() {
  return <CardSurface className="overflow-hidden"><div className="grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]"><Skeleton className="aspect-[16/10] rounded-none md:aspect-auto" /><div className="space-y-5 p-6 sm:p-8"><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-36" /><Skeleton className="h-16 w-40" /><Skeleton className="h-2.5 w-full" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-11 w-28" /></div></div></CardSurface>;
}
export { Skeleton as ProductSkeleton, Button as ProductButton };