import { SEO, breadcrumbJsonLd } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Users,
  Calendar,
  Share2,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ShareModal } from "@/components/apply/ShareModal";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

const categoryLabels: Record<string, string> = {
  family: "Family Support",
  child: "Children & Youth",
  emergency: "Emergency Relief",
  community: "Community Aid",
};

function generateMockSupporters(donorsCount: number) {
  const names = [
    "Sarah M.", "James T.", "Emily R.", "Michael K.", "Jessica L.",
    "David W.", "Amanda P.", "Robert H.", "Lisa C.", "Thomas B.",
  ];
  const messages = [
    "Sending love and support! 💛",
    "Every family deserves food security.",
    "Happy to help!",
    "Keep up the amazing work!",
    null, null,
  ];
  const count = Math.min(donorsCount, 8);
  const supporters = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const amount = [10, 15, 20, 25, 30, 50, 75, 100][Math.floor(Math.random() * 8)];
    supporters.push({
      id: `mock-${i}`,
      name: Math.random() > 0.2 ? names[i % names.length] : "Anonymous",
      isAnonymous: Math.random() > 0.8,
      amount,
      message: messages[Math.floor(Math.random() * messages.length)],
      daysAgo,
    });
  }
  return supporters.sort((a, b) => a.daysAgo - b.daysAgo);
}

interface CMSStory {
  id: string;
  name: string;
  location: string | null;
  short_story: string;
  full_story: string | null;
  category: string;
  amount_raised: number;
  goal: number;
  donors_count: number;
  image_url: string | null;
  impact: string | null;
  created_at: string;
}

const CMSStoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<CMSStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("cms_stories")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (dbError || !data) {
        setError("Story not found");
        return;
      }
      setStory(data);
    } catch {
      setError("Failed to load story");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {error || "Story not found"}
          </h1>
          <p className="text-muted-foreground text-center max-w-md">
            This story may have been removed or the link might be incorrect.
          </p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const image = story.image_url || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800";
  const progressPercent = Math.min(
    (Number(story.amount_raised) / Number(story.goal)) * 100,
    100
  );
  const daysActive = Math.floor(
    (Date.now() - new Date(story.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const supporters = generateMockSupporters(story.donors_count);
  const shareUrl = `${window.location.origin}/story-detail/${story.id}`;
  const storyText = story.full_story || story.short_story;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero image */}
      <div className="relative">
        <div className="w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img
            src={image}
            alt={story.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>

        <Link
          to="/"
          className="absolute top-8 left-4 lg:left-8 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-20 border border-border shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 relative z-10 -mt-20 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div className="bg-card rounded-2xl shadow-lg p-6 lg:p-8 border border-border/50">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {categoryLabels[story.category] || story.category}
                </Badge>
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </Badge>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                {story.name}
              </h1>

              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {story.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {story.name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {story.location || "United States"}
                  </p>
                </div>
              </div>
            </div>

            {/* Story content */}
            <div className="bg-card rounded-2xl shadow-lg p-6 lg:p-8 border border-border/50">
              <h2 className="text-lg font-semibold text-foreground mb-4">Story</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {storyText}
              </div>
            </div>

            {/* Impact */}
            {story.impact && (
              <div className="bg-primary/5 rounded-2xl p-6 lg:p-8 border border-primary/10">
                <h2 className="text-lg font-semibold text-foreground mb-2">Impact</h2>
                <p className="text-primary font-medium">{story.impact}</p>
              </div>
            )}

            {/* Recent supporters */}
            <div className="bg-card rounded-2xl shadow-lg p-6 lg:p-8 border border-border/50">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Recent Supporters ({story.donors_count})
              </h2>
              <div className="space-y-4">
                {supporters.map((s) => (
                  <div key={s.id} className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary text-muted-foreground text-sm">
                        {s.isAnonymous ? "A" : s.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {s.isAnonymous ? "Anonymous" : s.name}
                        </span>
                        <span className="text-primary font-semibold">
                          ${s.amount}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {s.daysAgo === 1 ? "1 day ago" : `${s.daysAgo} days ago`}
                        </span>
                      </div>
                      {s.message && (
                        <p className="text-sm text-muted-foreground mt-1">
                          "{s.message}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Donation panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card rounded-2xl shadow-lg p-6 border border-border/50">
                {/* Circular progress */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-36 h-36">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72" cy="72" r="64"
                        stroke="currentColor" strokeWidth="10" fill="none"
                        className="text-secondary"
                      />
                      <circle
                        cx="72" cy="72" r="64"
                        stroke="currentColor" strokeWidth="10" fill="none"
                        strokeDasharray={`${progressPercent * 4.02} 402`}
                        strokeLinecap="round"
                        className="text-primary transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">
                        {Math.round(progressPercent)}%
                      </span>
                      <span className="text-xs text-muted-foreground">funded</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-foreground">
                    ${Number(story.amount_raised).toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    raised of ${Number(story.goal).toLocaleString()} goal
                  </p>
                </div>

                <div className="flex justify-center gap-6 mb-6 pb-6 border-b border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      {story.donors_count}
                    </div>
                    <p className="text-xs text-muted-foreground">donors</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      {daysActive}
                    </div>
                    <p className="text-xs text-muted-foreground">days active</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full text-lg font-semibold h-14 rounded-full shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate("/donate")}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Donate Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>100% goes to families • No platform fees</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Secure donation processing</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Verified by CouponDonation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-card border-t border-border p-4 z-40">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="flex-shrink-0"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            className="flex-1 font-semibold"
            onClick={() => navigate("/donate")}
          >
            <Heart className="w-5 h-5 mr-2" />
            Donate Now
          </Button>
        </div>
      </div>

      <div className="h-24 lg:h-0" />

      <Footer />

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        title={story.name}
      />
    </div>
  );
};

export default CMSStoryDetail;
