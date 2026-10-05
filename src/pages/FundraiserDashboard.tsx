import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Share2, Edit2, Copy, Check, ExternalLink, Users, Trash2, Camera, ArrowLeft } from "lucide-react";
import { OwnerCouponsSection } from "@/components/fundraiser/OwnerCouponsSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DonationCouponList, type OwnerCoupon } from "@/components/fundraiser/DonationCouponList";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareModal } from "@/components/apply/ShareModal";
import { FundraiserGallery } from "@/components/fundraiser/FundraiserGallery";
import { ImageUploadModal } from "@/components/fundraiser/ImageUploadModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { OrganizerTools } from "@/components/fundraiser/OrganizerTools";
import { cn } from "@/lib/utils";

interface Fundraiser {
  id: string;
  user_id: string;
  title: string;
  story: string;
  category: string;
  beneficiary_type: string;
  monthly_goal: number;
  cover_photo_url: string | null;
  is_long_term: boolean;
  status: string;
  amount_raised: number;
  donors_count: number;
  unique_slug: string | null;
  created_at: string;
}

interface Donation {
  id: string;
  amount: number;
  donor_email: string | null;
  is_anonymous: boolean;
  message: string | null;
  created_at: string;
}

interface FundraiserImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

type Ledger = { total: number; count: number; donations: Donation[] };

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "donations", label: "Donations" },
  { id: "coupons", label: "Coupons" },
  { id: "updates", label: "Organizer tools" },
] as const;

const STATUS_LABEL: Record<string, string> = { active: "Live", pending: "Under review", paused: "Paused", rejected: "Not approved", completed: "Completed" };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Counts up to `target` once, the first time a real value arrives. Never re-animates. */
function useCountUpOnce(target: number | null, ms = 600) {
  const [value, setValue] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (target == null) return;
    if (done.current || reducedMotion()) { done.current = true; setValue(target); return; }
    done.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / ms, 1);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function ProgressRing({ pct }: { pct: number }) {
  const R = 54, C = 2 * Math.PI * R;
  const [drawn, setDrawn] = useState(reducedMotion() ? pct : 0);
  useEffect(() => {
    if (reducedMotion()) { setDrawn(pct); return; }
    const raf = requestAnimationFrame(() => setDrawn(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return (
    <div className="relative h-36 w-36 shrink-0 sm:h-40 sm:w-40" role="img" aria-label={`${Math.round(pct)}% of goal`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="2.5" className="stroke-border" />
        <circle
          cx="60" cy="60" r={R} fill="none" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(pct, pct > 0 ? 0.6 : 0) / 100)}
          className="stroke-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[900ms] motion-safe:ease-out"
          style={{ strokeDashoffset: C * (1 - (drawn > 0 ? Math.max(drawn, 0.6) : 0) / 100) }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-normal tabular-nums text-foreground">{Math.round(pct)}%</span>
        <span className="text-xs text-muted-foreground">of goal</span>
      </div>
    </div>
  );
}

const FundraiserDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  // Headline total, donor count and list all come from this one ledger, so they can never disagree.
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);
  const donations = ledger?.donations ?? [];
  const [coupons, setCoupons] = useState<OwnerCoupon[]>([]);
  const [images, setImages] = useState<FundraiserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [teamSignal, setTeamSignal] = useState(0);
  const [active, setActive] = useState<string>("overview");

  const fetchImages = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase.from("fundraiser_images").select("*").eq("fundraiser_id", id).order("display_order", { ascending: true });
    if (error) console.error("Error fetching images:", error);
    else setImages(data || []);
  }, [id]);

  const fetchFundraiser = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase.from("fundraisers").select("*").eq("id", id).single();
      if (error) throw error;
      setFundraiser(data as Fundraiser);
    } catch (error) {
      console.error("Error fetching fundraiser:", error);
      toast({ title: "Could not load this fundraiser", description: "Please refresh the page.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchDonations = useCallback(async () => {
    if (!id) return;
    try {
      // One source for the headline total, the donor count and the list: the team-gated RPC.
      const { data, error } = await (supabase.rpc as any)("get_my_fundraiser_donations", { _fundraiser_id: id });
      if (error) throw error;
      const l = data as { total: number | string; count: number; donations: Donation[] } | null;
      setLedger(l ? { total: Number(l.total) || 0, count: Number(l.count) || 0, donations: (l.donations || []).map((d) => ({ ...d, amount: Number(d.amount) })) } : null);
    } catch (error) {
      console.error("Error fetching donations:", error);
      setLedger(null);
    } finally {
      setLedgerLoaded(true);
    }
    try {
      const { data: cs } = await (supabase.rpc as any)("get_my_fundraiser_coupons", { _fundraiser_id: id });
      setCoupons((cs as OwnerCoupon[]) || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    // Clear data when user changes to prevent cross-account data flash
    setFundraiser(null); setLedger(null); setLedgerLoaded(false); setImages([]); setCoupons([]); setLoading(true);
    if (user && id) { fetchFundraiser(); fetchDonations(); fetchImages(); }
    const params = new URLSearchParams(window.location.search);
    if (params.get("share") === "true") {
      setShowShareModal(true);
      window.history.replaceState({}, "", `/fundraiser/${id}`);
    }
  }, [user, authLoading, id, fetchFundraiser, fetchDonations, fetchImages]);

  // Active nav item follows scroll position.
  useEffect(() => {
    if (!fundraiser) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [fundraiser, ledgerLoaded]);

  const goTo = (sid: string) => {
    document.getElementById(sid)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    setActive(sid);
  };

  const animatedTotal = useCountUpOnce(ledger ? ledger.total : null);

  const handleDeleteFundraiser = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("fundraisers").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Fundraiser deleted" });
      navigate("/my-fundraisers");
    } catch (error) {
      console.error("Error deleting fundraiser:", error);
      toast({ title: "Delete failed", description: "Fundraisers with donations can't be deleted. Contact us if you need it taken down.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const shareUrl = fundraiser?.unique_slug ? `${window.location.origin}/f/${fundraiser.unique_slug}` : `${window.location.origin}/fundraiser/${id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy", description: shareUrl });
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTimeAgo = (s: string) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return formatDate(s);
  };

  if (loading || authLoading) return <DashboardSkeleton />;

  if (!fundraiser) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">This fundraiser could not be found.</p>
        <Button onClick={() => navigate("/my-fundraisers")}>Go to My fundraisers</Button>
      </div>
    );
  }

  const isOwnerView = !!user && user.id === fundraiser.user_id;
  const goal = Number(fundraiser.monthly_goal) || 0;
  const pct = ledger && goal ? Math.min((ledger.total / goal) * 100, 100) : 0;
  const days = Math.max(1, Math.ceil((Date.now() - new Date(fundraiser.created_at).getTime()) / 86400000));
  const liveCoupons = coupons.filter((c) => !["void", "returned"].includes(c.status));
  const unavailable = donations.length === 0 && (!ledger || Number(fundraiser.amount_raised) > 0);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      {/* Mobile section nav */}
      <nav aria-label="Dashboard sections" className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex gap-1 overflow-x-auto px-4 py-2">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => goTo(s.id)}
              className={cn("shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ease-out",
                active === s.id ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:pt-24">
        {/* Desktop side nav with the fundraiser's own identity */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <div className="space-y-2">
              <p className="font-display text-xl leading-snug text-foreground">{fundraiser.title}</p>
              <p className="text-sm text-muted-foreground">
                <span className={cn("font-medium", fundraiser.status === "active" ? "text-primary" : "text-foreground")}>{STATUS_LABEL[fundraiser.status] ?? fundraiser.status}</span>
                {" · "}{days} day{days !== 1 ? "s" : ""} running
              </p>
            </div>
            <nav aria-label="Dashboard sections" className="space-y-0.5 border-l border-border">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => goTo(s.id)} aria-current={active === s.id ? "true" : undefined}
                  className={cn("-ml-px block w-full border-l py-1.5 pl-4 text-left text-sm transition-colors duration-200 ease-out",
                    active === s.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  {s.label}
                </button>
              ))}
            </nav>
            <Link to="/my-fundraisers" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> All fundraisers
            </Link>
          </div>
        </aside>

        <main className="min-w-0 max-w-4xl space-y-16">
          {/* Overview */}
          <section id="overview" className="scroll-mt-32 space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground lg:hidden">
                  <span className={cn("font-medium", fundraiser.status === "active" ? "text-primary" : "text-foreground")}>{STATUS_LABEL[fundraiser.status] ?? fundraiser.status}</span>
                  {" · "}{days} day{days !== 1 ? "s" : ""} running
                </p>
                <h1 className="font-display text-4xl font-normal leading-tight text-foreground sm:text-5xl">{fundraiser.title}</h1>
                <p className="text-sm text-muted-foreground">Started {formatDate(fundraiser.created_at)} · {fundraiser.category}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(shareUrl, "_blank", "noopener")}>
                  <ExternalLink className="mr-2 h-4 w-4" />Public page
                </Button>
                <Button size="sm" className="bg-ink text-ink-foreground hover:bg-ink/90" onClick={() => setShowShareModal(true)}>
                  <Share2 className="mr-2 h-4 w-4" />Share
                </Button>
              </div>
            </header>

            <FundraiserGallery images={images} isOwner onAddPhotos={() => setShowImageModal(true)} fundraiserTitle={fundraiser.title} coverPhotoUrl={fundraiser.cover_photo_url} category={fundraiser.category} />

            {/* Ledger */}
            <div className="rounded-2xl bg-card px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-12">
                <ProgressRing pct={pct} />
                <div className="min-w-0 space-y-2">
                  <p className="text-sm text-muted-foreground">Raised</p>
                  <p className="font-display text-6xl font-normal leading-none tabular-nums text-foreground sm:text-7xl">
                    {ledgerLoaded ? (ledger ? usd(Math.round(animatedTotal * 100) / 100) : "—") : <Skeleton className="h-16 w-40" />}
                  </p>
                  <p className="text-base text-muted-foreground">
                    of {usd(goal)} goal
                    {ledger ? <> · {ledger.count} donor{ledger.count !== 1 ? "s" : ""}</> : ledgerLoaded ? " · totals unavailable right now" : null}
                  </p>
                </div>
              </div>
              <dl className="mt-10 grid grid-cols-3 border-t border-border pt-6">
                {[
                  { k: "Total raised", v: ledger ? usd(ledger.total) : "—" },
                  { k: "Donors", v: ledger ? String(ledger.count) : "—" },
                  { k: "Coupons received", v: String(liveCoupons.length) },
                ].map((s, i) => (
                  <div key={s.k} className={cn("min-w-0", i > 0 && "border-l border-border pl-4 sm:pl-6")}>
                    <dt className="text-xs text-muted-foreground sm:text-sm">{s.k}</dt>
                    <dd className="mt-1 font-display text-2xl tabular-nums text-foreground sm:text-3xl">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Routine actions */}
            <div className="flex flex-wrap gap-x-1 gap-y-1">
              {[
                { icon: Edit2, label: "Edit fundraiser", on: () => navigate(`/fundraiser/${id}/edit`) },
                { icon: copied ? Check : Copy, label: copied ? "Copied" : "Copy link", on: handleCopyLink },
                { icon: Camera, label: "Manage photos", on: () => setShowImageModal(true) },
                { icon: Users, label: "Invite co-organizers", on: () => { setTeamSignal((n) => n + 1); setTimeout(() => goTo("updates"), 50); } },
              ].map((a) => (
                <Button key={a.label} variant="ghost" size="sm" className="h-9 text-muted-foreground transition-colors duration-200 hover:text-foreground" onClick={a.on}>
                  <a.icon className="mr-2 h-4 w-4" />{a.label}
                </Button>
              ))}
            </div>
          </section>

          {/* Donations */}
          <section id="donations" className="scroll-mt-32">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-3xl font-normal text-foreground">Donations</h2>
              {ledger && ledger.count > 0 && <span className="text-sm text-muted-foreground">{ledger.count} completed</span>}
            </div>
            <div className="mt-6">
              {!ledgerLoaded ? (
                <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : unavailable ? (
                <div className="rounded-2xl bg-card px-6 py-10">
                  <p className="font-medium text-foreground">Donation details are unavailable right now</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your total is safe. Please try again in a moment.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchDonations()}>Try again</Button>
                </div>
              ) : donations.length === 0 ? (
                <p className="border-t border-border pt-6 text-sm text-muted-foreground">No completed donations yet. Each one will be listed here with its coupons.</p>
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {donations.map((d, i) => (
                    <li key={d.id} className="dash-rise py-5" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{d.is_anonymous ? "Anonymous" : d.donor_email || "Donor"}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatTimeAgo(d.created_at)}</p>
                        </div>
                        <span className="font-display text-2xl tabular-nums text-foreground">{usd(d.amount)}</span>
                      </div>
                      {d.message && <p className="mt-2 text-sm text-muted-foreground">“{d.message}”</p>}
                      <DonationCouponList coupons={coupons.filter((c) => c.donation_id === d.id)} isOwner={isOwnerView} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <OwnerCouponsSection coupons={coupons} isOwner={isOwnerView} onChanged={fetchDonations} />

          <div id="updates" className="scroll-mt-32 [&>section]:mt-0">
            <OrganizerTools fundraiserId={fundraiser.id} isOwner={isOwnerView} openTeamSignal={teamSignal} />
          </div>

          {isOwnerView && (
            <section aria-labelledby="danger" className="border-t border-border pt-8">
              <h2 id="danger" className="text-sm font-medium text-foreground">Delete fundraiser</h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">Removes the fundraiser and its photos. This can’t be undone.</p>
              <Button variant="outline" size="sm" className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />Delete fundraiser
              </Button>
            </section>
          )}
        </main>
      </div>

      <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} shareUrl={shareUrl} title={fundraiser.title}
        slug={fundraiser.unique_slug || undefined} amountRaised={ledger?.total ?? fundraiser.amount_raised} goalAmount={fundraiser.monthly_goal} />

      <ImageUploadModal open={showImageModal} onClose={() => setShowImageModal(false)} fundraiserId={fundraiser.id} existingImages={images} onImagesUpdated={fetchImages} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this fundraiser?</AlertDialogTitle>
            <AlertDialogDescription>This can’t be undone. The fundraiser and its photos will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFundraiser} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function DashboardSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:pt-24">
        <div className="hidden space-y-3 lg:block"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-28" /><Skeleton className="mt-6 h-28 w-full" /></div>
        <div className="max-w-4xl space-y-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <div className="flex items-center gap-10 rounded-2xl bg-card p-10"><Skeleton className="h-36 w-36 rounded-full" /><div className="space-y-3"><Skeleton className="h-16 w-48" /><Skeleton className="h-4 w-36" /></div></div>
        </div>
      </div>
    </div>
  );
}

export default FundraiserDashboard;
