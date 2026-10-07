import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CardSurface, PageHeader, Stat, StatusChip, ProgressBar, EmptyState, FundraiserCardSkeleton } from "@/components/ui/organizer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, CalendarDays, Share2, ArrowUpRight, Ticket, ArrowRight } from "lucide-react";
import { resolveFundraiserImage, transformedFundraiserImage, FundraiserImageFallback, type FundraiserImageLike } from "@/lib/fundraiserImages";
import { fundraiserPublicUrl, shareFundraiser } from "@/lib/fundraiserSharing";
import { SEO } from "@/components/SEO";

interface Fundraiser {
  id: string; title: string; category: string; monthly_goal: number;
  cover_photo_url: string | null; status: string; amount_raised: number;
  donors_count: number; coupons_ready: number; unique_slug: string | null;
  created_at: string; last_donation_at: string | null; fundraiser_images?: FundraiserImageLike[];
}
const usd = (amount: number) => `$${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function FundraiserHomeCard({ fundraiser: f, index }: { fundraiser: Fundraiser; index: number }) {
  const { toast } = useToast();
  const [failedImage, setFailedImage] = useState(false);
  const image = resolveFundraiserImage(f);
  const dashboard = `/fundraiser/${f.id}`;
  const days = Math.max(1, Math.ceil((Date.now() - new Date(f.created_at).getTime()) / 86400000));
  const share = async () => {
    try {
      const result = await shareFundraiser(f.title, fundraiserPublicUrl(f.unique_slug, f.id));
      if (result === "copied") toast({ title: "Public link copied", description: "Ready to share with your supporters." });
    } catch { toast({ title: "Could not share the link", description: "Please try again.", variant: "destructive" }); }
  };
  return <CardSurface index={index} interactive className="group relative overflow-hidden">
    <div className="grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]">
      <div className="aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-80">
        {image && !failedImage ? <img src={transformedFundraiserImage(image, 900) ?? image} alt={f.title} onError={() => setFailedImage(true)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" /> : <FundraiserImageFallback category={f.category} />}
      </div>
      <div className="min-w-0 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 font-display text-[28px] font-normal leading-8"><Link to={dashboard} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">{f.title}</Link></h2>
          <StatusChip status={f.status} />
        </div>
        <p className="product-meta mt-2">Started {date(f.created_at)}</p>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="product-hero-number">{usd(f.amount_raised)}</span>
          <span className="product-meta">of {usd(f.monthly_goal)} goal</span>
        </div>
        <div className="mt-4"><ProgressBar value={f.monthly_goal ? f.amount_raised / f.monthly_goal * 100 : 0} /></div>
        <div className="product-meta mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{f.donors_count} donor{f.donors_count === 1 ? "" : "s"}</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{days} day{days === 1 ? "" : "s"} running</span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[12px] capitalize">{f.category.replaceAll("_", " ")}</span>
        </div>
        {f.coupons_ready > 0 && <Button asChild variant="ghost" className="relative z-10 mt-5 h-auto min-h-11 justify-start gap-2 whitespace-normal rounded-lg bg-primary/10 px-3 py-2 text-left text-[13px] text-primary hover:bg-primary/15"><Link to={`${dashboard}#coupons`}><Ticket className="h-4 w-4 shrink-0" />{f.coupons_ready} coupon{f.coupons_ready === 1 ? "" : "s"} ready to reveal<ArrowRight className="h-4 w-4 shrink-0" /></Link></Button>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="product-meta">{f.last_donation_at ? `Last donation ${date(f.last_donation_at)}` : "Be the first to give"}</p>
          <div className="relative z-10 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground" aria-label={`Share ${f.title}`} title="Share public fundraiser" onClick={share}><Share2 className="h-4 w-4" /></Button>
            <Button asChild variant="ghost" className="h-11 gap-2 px-3 font-semibold"><Link to={dashboard}>Manage<ArrowUpRight className="h-4 w-4" /></Link></Button>
          </div>
        </div>
      </div>
    </div>
  </CardSurface>;
}

export default function MyFundraisers() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [user, loading, navigate]);
  useEffect(() => {
    let cancelled = false;
    setFundraisers([]); setLoadingData(true); setError(false);
    if (!user) return () => { cancelled = true; };
    (async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc("get_my_fundraisers");
        if (rpcError) throw rpcError;
        if (!cancelled) setFundraisers((data as unknown as Fundraiser[]) ?? []);
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoadingData(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.id, retry]);
  const summary = fundraisers.reduce((s, f) => ({ raised: s.raised + Number(f.amount_raised), donors: s.donors + Number(f.donors_count), ready: s.ready + Number(f.coupons_ready) }), { raised: 0, donors: 0, ready: 0 });
  return <div className="flex min-h-dvh flex-col bg-background">
    <SEO title="Your fundraisers" description="Manage your fundraisers, track giving, and reveal ready coupons." path="/my-fundraisers" />
    <Navbar />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <PageHeader title="Your fundraisers" subtitle="Track your campaigns and keep support moving." action={<Button variant="outline" className="h-11 gap-2 bg-card" onClick={() => navigate("/apply")}><Plus className="h-4 w-4" />New fundraiser</Button>} />
      {!loading && !loadingData && !error && fundraisers.length >= 2 && <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-border py-6"><Stat label="Total raised" value={usd(summary.raised)} /><Stat label="Total donors" value={summary.donors} /><Stat label="Coupons ready" value={summary.ready} /></dl>}
      <div className="mt-8 space-y-6">
        {loading || loadingData ? <div aria-label="Loading fundraisers" className="space-y-6"><FundraiserCardSkeleton /><FundraiserCardSkeleton /></div> : error ? <EmptyState error title="Your fundraisers couldn’t load" description="We couldn’t retrieve your campaigns. Please try again." action={<Button variant="outline" onClick={() => setRetry(n => n + 1)}>Try again</Button>} /> : fundraisers.length === 0 ? <EmptyState title="Your first fundraiser starts here" description="Bring your community together around the essentials you need." action={<Button className="gap-2" onClick={() => navigate("/apply")}><Plus className="h-4 w-4" />Start a fundraiser</Button>} /> : fundraisers.map((f, i) => <FundraiserHomeCard key={f.id} fundraiser={f} index={i} />)}
      </div>
    </main>
    <Footer />
  </div>;
}
