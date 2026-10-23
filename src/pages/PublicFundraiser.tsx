import { SEO, breadcrumbJsonLd } from "@/components/SEO";
import { snippet } from "@/lib/seo";
import { needForCategory } from "@/data/needs";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Share2, ChevronLeft, AlertCircle, Loader2, Lock, Receipt, ShieldCheck, Flag, Calendar, Tag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { FundraiserGallery } from "@/components/fundraiser/FundraiserGallery";
import { ImageUploadModal } from "@/components/fundraiser/ImageUploadModal";
import { useAuth } from "@/hooks/useAuth";
import { useFundraiserLive, usd } from "@/hooks/useFundraiserLive";
import { brandLogoFor } from "@/data/brandLogos";
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
import { RequestedHelp } from "@/components/fundraiser/campaign/RequestedHelp";
import { cityState, needLabel, requestNeeds } from "@/lib/helpNeeds";
import { useZipLocation } from "@/lib/zipLookup";

interface Fundraiser {
  id: string; title: string; story: string; category: string; monthly_goal: number; cover_photo_url: string | null;
  status: string | null; unique_slug: string | null; created_at: string | null; user_id: string; allow_messages: boolean;
  beneficiary_display_name: string | null; show_beneficiary_name: boolean; is_example?: boolean; zip_code?: string | null;
}
/** Needs, stores and city/state; read separately so the page still opens on databases without them. */
interface FundraiserRequest { help_categories: string[] | null; preferred_brands: string[] | null; similar_stores_ok: boolean | null; city: string | null; state_code: string | null }
interface FundraiserImage { id: string; image_url: string; display_order: number; is_primary: boolean }


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
  const [request, setRequest] = useState<FundraiserRequest | null>(null);
  const [requestRead, setRequestRead] = useState(false);

  const live = useFundraiserLive(fundraiser?.id);
  // Requests made before city and state were saved find them from the ZIP code, as the cards do.
  const zipPlace = useZipLocation(requestRead && !request?.city ? fundraiser?.zip_code : null, "us");
  const team = useFundraiserTeam(fundraiser?.id);
  const isOwner = !!user && !!fundraiser && user.id === fundraiser.user_id;

  const fetchImages = async (id: string) => {
    const { data } = await supabase.from("fundraiser_images").select("id,image_url,display_order,is_primary").eq("fundraiser_id", id).order("display_order");
    setImages((data ?? []).map((d) => ({ ...d, is_primary: !!d.is_primary })));
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setError(null); setRequest(null); setRequestRead(false);
    (async () => {
      const { data, error } = await supabase.from("fundraisers")
        .select("id,title,story,category,monthly_goal,cover_photo_url,status,unique_slug,created_at,user_id,allow_messages,beneficiary_display_name,show_beneficiary_name,is_example,zip_code")
        .eq(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug) ? "id" : "unique_slug", slug).maybeSingle();
      if (error || !data) setError("Fundraiser not found");
      else if (data.status !== "active" && data.status !== "pending") setError("This fundraiser is no longer active");
      else {
        setFundraiser(data as Fundraiser); fetchImages(data.id);
        supabase.from("fundraisers").select("help_categories,preferred_brands,similar_stores_ok,city,state_code").eq("id", data.id).maybeSingle()
          .then(({ data: extra, error: extraError }) => { setRequest(extraError ? null : (extra as FundraiserRequest | null)); setRequestRead(true); });
      }
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
        <SEO title="Fundraiser not found" description="This fundraiser may have been removed or the link might be incorrect." path={`/f/${slug ?? ""}`} noindex />
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
  // City and state only; a bare ZIP code is never shown.
  const place = cityState(request?.city, request?.state_code) ?? (zipPlace?.includes(",") ? zipPlace : null);
  const needs = requestNeeds(request?.help_categories, fundraiser.category);
  // Search and share text: who is asking, for what and where, then the start of their story.
  const helpPage = needForCategory(needs[0] ?? fundraiser.category);
  const asking = `${team.find((t) => t.role === "organizer")?.display_name ?? "A family"} is asking for help with ${needs.length ? needs.map((n) => needLabel(n).toLowerCase()).join(", ") : "everyday needs"}${place ? ` in ${place}` : ""}.`;
  const seoTitle = place ? `${fundraiser.title} — ${place}` : fundraiser.title;

  return (
    <div className="min-h-dvh bg-background pb-24 lg:pb-0">
      <SEO
        title={seoTitle}
        description={snippet(`${asking} ${fundraiser.story ?? ""}`)}
        path={`/f/${fundraiser.unique_slug}`}
        type="article"
        image={resolvedCover || undefined}
        imageAlt={fundraiser.title}
        noindex={!!fundraiser.is_example}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          helpPage ? { name: helpPage.name, path: `/help/${helpPage.slug}` } : { name: "Fundraisers", path: "/stories" },
          { name: fundraiser.title, path: `/f/${fundraiser.unique_slug}` },
        ])}
      />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 md:pt-28">
        <Link to="/stories" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" />All fundraisers</Link>
        <Reveal><h1 className="mt-4 max-w-4xl font-display text-4xl font-normal leading-[1.05] text-ink md:text-6xl dark:text-foreground">{fundraiser.title}</h1>{place && <p className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{place}</p>}{fundraiser.is_example && <p className="mt-3 text-sm text-muted-foreground">Example campaign · Giving is closed on example campaigns.</p>}</Reveal>

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
            </div>

            {/* Mobile panel */}
            <div className="lg:hidden"><DonationPanel live={live} goal={Number(fundraiser.monthly_goal)} onDonate={donate} onShare={() => setShare(true)} fundraiserId={fundraiser.id} closed={!!fundraiser.is_example} /></div>

            <RequestedHelp fundraiserId={fundraiser.id} needs={needs} stores={request?.preferred_brands ?? []} similarOk={request?.similar_stores_ok !== false} closed={!!fundraiser.is_example} />

            <section><StoryBody story={fundraiser.story} /></section>

            <div className="flex flex-wrap gap-3">
              {!fundraiser.is_example && <Button size="lg" onClick={donate}><Heart className="mr-2 h-4 w-4" />Donate</Button>}
              <Button size="lg" className="bg-ink text-ink-foreground hover:bg-ink/90" onClick={() => setShare(true)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
            </div>

            {(live.converted > 0 || live.retailers.length > 0) && (
              <section className="rounded-[1.5rem] p-7" style={{ backgroundColor: "hsl(var(--primary-97))" }}>
                <h2 className="font-display text-3xl font-normal text-foreground">Where the money goes</h2>
                {live.converted > 0 && (
                  <p className="mt-3 text-muted-foreground"><span className="font-medium text-foreground">{usd(live.converted)}</span> converted to {live.couponsCount} coupons · <span className="font-medium text-foreground">{usd(live.redeemed)}</span> redeemed</p>
                )}
                {live.byStore.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-foreground">Coupons by store</h3>
                    <ul className="mt-2 divide-y divide-border/60">
                      {live.byStore.map((r) => { const logo = brandLogoFor(r.brand_name); return (
                        <li key={r.brand_name} className="flex items-center gap-3 py-3 text-sm">
                          {logo ? <img src={logo} alt="" className="h-6 w-10 object-contain" loading="lazy" /> : <span className="w-10" />}
                          <span className="flex-1 font-medium text-foreground">{r.brand_name}</span>
                          <span className="tabular-nums text-foreground">{usd(r.total_value)}</span>
                          <span className="hidden w-40 text-right tabular-nums text-muted-foreground sm:inline">{r.coupons_count} coupons · {r.used_count} used</span>
                        </li>); })}
                    </ul>
                  </div>
                ) : live.retailers.length > 0 && (
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
              <Link to={helpPage ? `/help/${helpPage.slug}` : "/stories"} className="flex min-h-11 items-center gap-2 py-2.5 hover:text-foreground"><Tag className="h-4 w-4" />{needLabel(fundraiser.category)}</Link>
              <button onClick={() => setReport(true)} className="flex min-h-11 items-center gap-2 py-2.5 hover:text-foreground"><Flag className="h-4 w-4" />Report fundraiser</button>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28"><DonationPanel live={live} goal={Number(fundraiser.monthly_goal)} onDonate={donate} onShare={() => setShare(true)} fundraiserId={fundraiser.id} closed={!!fundraiser.is_example} /></div>
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
        <div role="status" className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-fade-in whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm text-ink-foreground shadow-lg [@media(max-height:500px)]:bottom-[calc(3.75rem+env(safe-area-inset-bottom))] lg:bottom-8">
          <Heart className="mr-2 inline h-4 w-4 text-primary" />{live.justDonated.display_name} just donated {usd(live.justDonated.amount)}
        </div>
      )}

      <div className="campaign-sticky-actions fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        {!fundraiser.is_example && <Button className="h-12 flex-1 text-base font-semibold" onClick={donate}><Heart className="mr-2 h-4 w-4" />Donate</Button>}
        <Button className="h-12 flex-1 bg-ink text-ink-foreground hover:bg-ink/90" onClick={() => setShare(true)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
      </div>

      <ShareSheet open={share} onOpenChange={setShare} slug={fundraiser.unique_slug!} title={fundraiser.title} cover={resolvedCover} raised={live.totalRaised} goal={Number(fundraiser.monthly_goal)} organizer={organizer} />
      <ReportDialog open={report} onOpenChange={setReport} targetType="fundraiser" targetId={fundraiser.id} fundraiserId={fundraiser.id} />
      {isOwner && <ImageUploadModal open={imgModal} onClose={() => setImgModal(false)} fundraiserId={fundraiser.id} existingImages={images} onImagesUpdated={() => fetchImages(fundraiser.id)} />}
    </div>
  );
};

export default PublicFundraiser;
