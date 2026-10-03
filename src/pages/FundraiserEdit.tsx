import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { value: "food", label: "Food & groceries" },
  { value: "utilities", label: "Bills & utilities" },
  { value: "health", label: "Healthcare" },
  { value: "transportation", label: "Transportation" },
  { value: "emergency", label: "Emergency" },
  { value: "essentials", label: "Essentials" },
];

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

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data } = await supabase.from("fundraisers")
        .select("id, user_id, title, story, category, monthly_goal").eq("id", id!).maybeSingle();
      if (!data || data.user_id !== user.id) { navigate(`/fundraiser/${id}`); return; }
      setTitle(data.title ?? ""); setStory(data.story ?? "");
      setCategory(data.category ?? ""); setGoal(String(data.monthly_goal ?? ""));
      setReady(true);
    })();
  }, [user, loading, id, navigate]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const goalNum = Number(goal);
    if (!title.trim() || !story.trim()) { toast({ title: "Title and story are required", variant: "destructive" }); return; }
    if (!(goalNum > 0)) { toast({ title: "Goal must be more than $0", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("fundraisers")
      .update({ title: title.trim(), story: story.trim(), category, monthly_goal: goalNum })
      .eq("id", id!).eq("user_id", user!.id);
    setSaving(false);
    if (error) { toast({ title: "Couldn't save changes", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Changes saved" });
    navigate(`/fundraiser/${id}`);
  };

  const options = CATEGORIES.some((c) => c.value === category) || !category
    ? CATEGORIES : [...CATEGORIES, { value: category, label: category }];

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-5xl font-normal text-foreground mb-8">Edit fundraiser.</h1>
          {!ready ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <form onSubmit={save} className="space-y-6">
              <div className="space-y-2"><Label htmlFor="title">Title</Label>
                <Input id="title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="story">Story</Label>
                <Textarea id="story" rows={10} value={story} onChange={(e) => setStory(e.target.value)} /></div>
              <div className="space-y-2"><Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                  <SelectContent>{options.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-2"><Label htmlFor="goal">Goal ($)</Label>
                <Input id="goal" type="number" min={1} step="1" value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                <Button type="button" variant="ghost" onClick={() => navigate(`/fundraiser/${id}`)}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
