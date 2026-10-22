import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NeedsAndStores } from "@/components/apply/NeedsAndStores";
import { findRetailer, retailerId } from "@/components/landing/donate/retailers";
import { requestNeeds } from "@/lib/helpNeeds";
import { useZipLookup } from "@/lib/zipLookup";

const missingColumn = (code?: string) => code === "PGRST204" || code === "42703";

export default function FundraiserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [similarOk, setSimilarOk] = useState(true);
  const [hasExtras, setHasExtras] = useState(true);
  const zip = useZipLookup(zipCode);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data } = await supabase.from("fundraisers")
        .select("id, user_id, title, story, category, monthly_goal, zip_code").eq("id", id!).maybeSingle();
      if (!data || data.user_id !== user.id) { navigate(`/fundraiser/${id}`); return; }
      setTitle(data.title ?? ""); setStory(data.story ?? "");
      setCategory(data.category ?? ""); setGoal(String(data.monthly_goal ?? ""));
      setZipCode(data.zip_code ?? "");
      // Needs and stores arrived later; older databases may not have them yet.
      const extras = await supabase.from("fundraisers")
        .select("help_categories, preferred_brands, similar_stores_ok").eq("id", id!).maybeSingle();
      if (extras.error) setHasExtras(false);
      setNeeds(requestNeeds(extras.data?.help_categories, data.category));
      setStores((extras.data?.preferred_brands ?? []).map((name) => retailerId(name)).filter((s) => !!findRetailer(s).logo));
      setSimilarOk(extras.data?.similar_stores_ok !== false);
      setReady(true);
    })();
  }, [user, loading, id, navigate]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const goalNum = Number(goal);
    if (!title.trim() || !story.trim()) { toast({ title: "Title and story are required", variant: "destructive" }); return; }
    if (!(goalNum > 0)) { toast({ title: "Goal must be more than $0", variant: "destructive" }); return; }
    if (!needs.length) { toast({ title: "Choose at least one need", variant: "destructive" }); return; }
    if (zipCode && !/^\d{5}$/.test(zipCode)) { toast({ title: "Enter a 5-digit ZIP code", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("fundraisers")
      .update({ title: title.trim(), story: story.trim(), category: needs[0] ?? category, monthly_goal: goalNum, zip_code: zipCode || null })
      .eq("id", id!).eq("user_id", user!.id);
    if (!error && hasExtras) {
      const found = zip.status === "found";
      const extras = await supabase.from("fundraisers")
        .update({
          help_categories: needs,
          preferred_brands: stores.map((s) => findRetailer(s).name),
          similar_stores_ok: similarOk,
          ...(found ? { city: zip.city, state_code: zip.stateCode } : zipCode ? {} : { city: null, state_code: null }),
        })
        .eq("id", id!).eq("user_id", user!.id);
      if (extras.error && !missingColumn(extras.error.code)) {
        setSaving(false);
        toast({ title: "Couldn't save your stores", description: extras.error.message, variant: "destructive" });
        return;
      }
    }
    setSaving(false);
    if (error) { toast({ title: "Couldn't save changes", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Changes saved" });
    navigate(`/fundraiser/${id}`);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pb-16 pt-24 md:pt-28">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-5xl font-normal text-foreground mb-10">Edit fundraiser.</h1>
          {!ready ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <form onSubmit={save} className="space-y-12">
              <div className="space-y-6">
                <div className="space-y-2"><Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="story">Story</Label>
                  <Textarea id="story" rows={10} value={story} onChange={(e) => setStory(e.target.value)} /></div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="goal">Goal ($)</Label>
                    <Input id="goal" type="number" min={1} step="1" value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="zip">ZIP code</Label>
                    <Input id="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))} />
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
                      {zip.status === "found"
                        ? <><BadgeCheck className="h-4 w-4 text-verify" aria-hidden="true" />Shown as {zip.city}, {zip.stateCode}</>
                        : <><MapPin className="h-4 w-4" aria-hidden="true" />Donors see your city and state only</>}
                    </p>
                  </div>
                </div>
              </div>

              <NeedsAndStores needs={needs} onNeeds={setNeeds} stores={stores} onStores={setStores} similarOk={similarOk} onSimilarOk={setSimilarOk} />

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                <Button type="button" variant="ghost" onClick={() => navigate(`/fundraiser/${id}`)}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer contact={false} />
    </div>
  );
}
