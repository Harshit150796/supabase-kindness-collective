import { SEO, breadcrumbJsonLd } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Share2, ChevronLeft, AlertCircle, Loader2, Lock, Receipt, ShieldCheck, Flag, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { FundraiserGallery } from "@/components/fundraiser/FundraiserGallery";
import { ImageUploadModal } from "@/components/fundraiser/ImageUploadModal";
import { useAuth } from "@/hooks/useAuth";
import { useFundraiserLive, usd } from "@/hooks/useFundraiserLive";
import { Reveal } from "@/components/ui/editorial-motion";
import { StoryBody } from "@/components/fundraiser/campaign/StoryBody";
import { DonationPanel } from "@/components/fundraiser/campaign/DonationPanel";
import { CommentsSection } from "@/components/fundraiser/campaign/CommentsSection";
import { TeamSection, useFundraiserTeam } from "@/components/fundraiser/campaign/TeamSection";
import { UpdatesSection } from "@/components/fundraiser/campaign/UpdatesSection";
import { ShareSheet, ShareCardPreview } from "@/components/fundraiser/campaign/ShareSheet";
import { MoreFundraisers } from "@/components/fundraiser/campaign/MoreFundraisers";
import { ReportDialog } from "@/components/fundraiser/campaign/ReportDialog";
import { resolveFundraiserImage } from "@/lib/fundraiserImages";

interface Fundraiser {
  id: string; title: string; story: string; category: string; monthly_goal: number; cover_photo_url: string | null;
  status: string | null; unique_slug: string | null; created_at: string | null; user_id: string; allow_messages: boolean;
  beneficiary_display_name: string | null; show_beneficiary_name: boolean;
}
interface FundraiserImage { id: string; image_url: string; display_order: number; is_primary: boolean }

const categoryLabels: Record<string, string> = {
  food: "Food & Groceries", household: "Household Essentials", health: "Health & Wellness", childcare: "Childcare",
  education: "Education", utilities: "Utilities", other: "Other",
};

const PublicFundraiser = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [images, setImages] = useState<FundraiserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [imgModal, setImgModal] = useState(false);
  const [report, setReport] = useState(false);
  const [isTeam, setIsTeam] = useState(false);

  const live = useFundraiserLive(fundraiser?.id);
  const team = useFundraiserTeam(fundraiser?.id);
  const isOwner = !!user && !!fundraiser && user.id === fundraiser.user_id;

  const fetchImages = async (id: string) => {
    const { data } = await supabase.from("fundraiser_images").select("id,image_url,display_order,is_primary").eq("fundraiser_id", id).order("display_order");
    setImages((data ?? []).map((d) => ({ ...d, is_primary: !!d.is_primary })));
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setError(null);
    (async () => {
      const { data, error } = await supabase.from("fundraisers")
        .select("id,title,story,category,monthly_goal,cover_photo_url,status,unique_slug,created_at,user_id,allow_messages,beneficiary_display_name,show_beneficiary_name")
        .eq(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug) ? "id" : "unique_slug", slug).maybeSingle();
      if (error || !data) setError("Fundraiser not found");
      else if (data.status !== "active" && data.status !== "pending") setError("This fundraiser is no longer active");
      else { setFundraiser(data as Fundraiser); fetchImages(data.id); }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!user || !fundraiser) { setIsTeam(false); return; }
    supabase.rpc("is_fundraiser_team" as never, { _fid: fundraiser.id, _uid: user.id } as never).then(({ data }) => setIsTeam(!!data));
  }, [user, fundraiser]);

  if (loading) return <div className="min-h-dvh bg-background"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;

  if (error || !fundraiser) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h1 className="font-display text-4xl text-foreground">{error || "Fundraiser not found"}</h1>
          <p className="max-w-md text-muted-foreground">This fundraiser may have been removed or the link might be incorrect.</p>
          <Button onClick={() => navigate("/stories")}>Browse fundraisers</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const organizer = team.find((t) => t.role === "organizer")?.display_name ?? "the organizer";
  const beneficiary = fundraiser.show_beneficiary_name && fundraiser.beneficiary_display_name?.trim() ? fundraiser.beneficiary_display_name.trim() : null;
  const donate = () => navigate(`/donate?fundraiser=${fundraiser.id}`);
  const created = fundraiser.created_at ? new Date(fundraiser.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
  const resolvedCover = resolveFundraiserImage({ cover_photo_url: fundraiser.cover_photo_url, fundraiser_images: images });

  return (
    <div className="min-h-dvh bg-background pb-24 lg:pb-0">
      <SEO
        title={`${fundraiser.title} — Fundraiser`}
        description={(fundraiser.story || `Support ${fundraiser.title} on CouponDonation.`).slice(0, 155)}
        path={`/f/${fundraiser.unique_slug}`}
        type="article"
        image={resolvedCover || undefined}
        jsonLd={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Stories", path: "/stories" }, { name: fundraiser.title, path: `/f/${fundraiser.unique_slug}` }])}
      />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 md:pt-28">
        <Link to="/stories" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" />All fundraisers</Link>
        <Reveal><h1 className="mt-4 max-w-4xl font-display text-4xl font-normal leading-[1.05] text-ink md:text-6xl dark:text-foreground">{fundraiser.title}</h1></Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
          <div className="min-w-0 space-y-12">
            <div className="overflow-hidden rounded-[1.5rem]">
              <FundraiserGallery images={images} isOwner={isOwner} onAddPhotos={() => setImgModal(true)} fundraiserTitle={fundraiser.title} coverPhotoUrl={fundraiser.cover_photo_url} category={fundraiser.category} />
            </div>

            <div className="space-y-4 border-b border-border pb-8">
              <p className="flex items-center gap-3 text-foreground">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-ink-foreground">{organizer[0]?.toUpperCase()}</span>
                <span><span className="font-medium">{organizer}</span>{beneficiary ? <> is organizing for <span className="font-medium">{beneficiary}</span></> : " is organizing this fundraiser"}</span>
              </p>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span><span className="font-medium text-foreground">Coupon-locked · Traceable.</span> Donations become restricted retailer coupons for this need — never cash — with a receipt trail.</span>
              </p>
            </div>

            {/* Mobile panel */}
            <div className="lg:hidden"><DonationPanel live={live} goal={Number(fundraiser.monthly_goal)} onDonate={donate} onShare={() => setShare(true)} fundraiserId={fundraiser.id} /></div>

            <section><StoryBody story={fundraiser.story} /></section>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={donate}><Heart className="mr-2 h-4 w-4" />Donate</Button>
              <Button size="lg" className="bg-ink text-ink-foreground hover:bg-ink/90" onClick={() => setShare(true)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
            </div>

            {(live.converted > 0 || live.retailers.length > 0) && (
              <section className="rounded-[1.5rem] p-7" style={{ backgroundColor: "hsl(var(--primary-97))" }}>
                <h2 className="font-display text-3xl font-normal text-foreground">Where the money goes</h2>
                {live.converted > 0 && (
                  <p className="mt-3 text-muted-foreground"><span className="font-medium text-foreground">{usd(live.converted)}</span> converted to {live.couponsCount} coupons · <span className="font-medium text-foreground">{usd(live.redeemed)}</span> redeemed</p>
                )}
                {live.retailers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">{live.retailers.map((r) => <span key={r} className="rounded-full bg-background px-3 py-1 text-sm text-foreground">{r}</span>)}</div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">Totals only. Individual purchases are never shown publicly.</p>
              </section>
            )}

            <UpdatesSection fundraiserId={fundraiser.id} />

            <TeamSection team={team} fundraiserId={fundraiser.id} allowMessages={fundraiser.allow_messages} isTeam={isTeam} beneficiary={beneficiary} slug={fundraiser.unique_slug!} />

            <section>
              <h2 className="font-display text-4xl font-normal text-foreground">Help spread the word</h2>
              <div className="mt-6 max-w-md"><ShareCardPreview title={fundraiser.title} cover={resolvedCover} raised={live.totalRaised} goal={Number(fundraiser.monthly_goal)} organizer={organizer} /></div>
              <Button className="mt-4 bg-ink text-ink-foreground hover:bg-ink/90" onClick={() => setShare(true)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
            </section>

            <CommentsSection fundraiserId={fundraiser.id} isTeam={isTeam} slug={fundraiser.unique_slug!} />

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
              {created && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Created {created}</span>}
              <Link to={`/stories?category=${fundraiser.category}`} className="flex min-h-11 items-center gap-2 py-2.5 hover:text-foreground"><Tag className="h-4 w-4" />{categoryLabels[fundraiser.category] ?? fundraiser.category}</Link>
              <button onClick={() => setReport(true)} className="flex min-h-11 items-center gap-2 py-2.5 hover:text-foreground"><Flag className="h-4 w-4" />Report fundraiser</button>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28"><DonationPanel live={live} goal={Number(fundraiser.monthly_goal)} onDonate={donate} onShare={() => setShare(true)} fundraiserId={fundraiser.id} /></div>
          </aside>
        </div>

        <section className="my-20 grid gap-8 border-t border-border pt-12 md:grid-cols-3">
          {[
            { Icon: Lock, t: "Coupons, not cash", d: "Every donation becomes restricted retailer coupons for essentials." },
            { Icon: Receipt, t: "A receipt for every dollar", d: "Totals on this page come from completed donations only." },
            { Icon: ShieldCheck, t: "Messages stay on platform", d: "Contact details are removed and payment requests are blocked." },
          ].map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 0.08}><Icon className="h-6 w-6 text-primary" /><h3 className="mt-4 text-lg font-medium text-foreground">{t}</h3><p className="mt-1 text-muted-foreground">{d}</p></Reveal>
          ))}
        </section>
      </main>

      <MoreFundraisers excludeId={fundraiser.id} />
      <Footer />

      {live.justDonated && (
        <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-full bg-ink px-5 py-3 text-sm text-ink-foreground shadow-lg lg:bottom-8">
          <Heart className="mr-2 inline h-4 w-4 text-primary" />{live.justDonated.display_name} just donated {usd(live.justDonated.amount)}
        </div>
      )}

      <div className="campaign-sticky-actions fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <Button className="h-12 flex-1 text-base font-semibold" onClick={donate}><Heart className="mr-2 h-4 w-4" />Donate</Button>
        <Button className="h-12 flex-1 bg-ink text-ink-foreground hover:bg-ink/90" onClick={() => setShare(true)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
      </div>

      <ShareSheet open={share} onOpenChange={setShare} slug={fundraiser.unique_slug!} title={fundraiser.title} cover={resolvedCover} raised={live.totalRaised} goal={Number(fundraiser.monthly_goal)} organizer={organizer} />
      <ReportDialog open={report} onOpenChange={setReport} targetType="fundraiser" targetId={fundraiser.id} fundraiserId={fundraiser.id} />
      {isOwner && <ImageUploadModal open={imgModal} onClose={() => setImgModal(false)} fundraiserId={fundraiser.id} existingImages={images} onImagesUpdated={() => fetchImages(fundraiser.id)} />}
    </div>
  );
};

export default PublicFundraiser;
