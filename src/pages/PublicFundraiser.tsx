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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ShareModal } from "@/components/apply/ShareModal";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { FundraiserGallery } from "@/components/fundraiser/FundraiserGallery";
import { ImageUploadModal } from "@/components/fundraiser/ImageUploadModal";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Fundraiser {
  id: string;
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
  user_id: string;
}

interface Donation {
  id: string;
  amount: number;
  donor_email: string | null;
  is_anonymous: boolean;
  message: string | null;
  created_at: string;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface FundraiserImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

const categoryLabels: Record<string, string> = {
  food: "Food & Groceries",
  household: "Household Essentials",
  health: "Health & Wellness",
  childcare: "Childcare",
  education: "Education",
  utilities: "Utilities",
  other: "Other",
};

const PublicFundraiser = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [organizer, setOrganizer] = useState<Profile | null>(null);
  const [images, setImages] = useState<FundraiserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user && fundraiser ? user.id === fundraiser.user_id : false;

  useEffect(() => {
    if (slug) {
      fetchFundraiser();
    }
  }, [slug]);

  const fetchImages = async (fundraiserId: string) => {
    try {
      const { data, error } = await supabase
        .from("fundraiser_images")
        .select("*")
        .eq("fundraiser_id", fundraiserId)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setImages(data);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const fetchFundraiser = async () => {
    try {
      const { data, error } = await supabase
        .from("fundraisers")
        .select("*")
        .eq("unique_slug", slug)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setError("Fundraiser not found");
        } else {
          throw error;
        }
        return;
      }

      // Only show active fundraisers publicly
      if (data.status !== "active" && data.status !== "pending") {
        setError("This fundraiser is no longer active");
        return;
      }

      setFundraiser(data);
      fetchDonations(data.id);
      fetchOrganizer(data.user_id);
      fetchImages(data.id);
    } catch (err) {
      console.error("Error fetching fundraiser:", err);
      setError("Failed to load fundraiser");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async (fundraiserId: string) => {
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("fundraiser_id", fundraiserId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setDonations(data || []);
    } catch (err) {
      console.error("Error fetching donations:", err);
    }
  };

  const fetchOrganizer = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        setOrganizer(data);
      }
    } catch (err) {
      console.error("Error fetching organizer:", err);
    }
  };

  const getProgressPercentage = () => {
    if (!fundraiser || !fundraiser.monthly_goal) return 0;
    return Math.min((fundraiser.amount_raised / fundraiser.monthly_goal) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
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

  if (error || !fundraiser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {error || "Fundraiser not found"}
          </h1>
          <p className="text-muted-foreground text-center max-w-md">
            This fundraiser may have been removed or the link might be incorrect.
          </p>
          <Button onClick={() => navigate("/stories")}>
            Browse Fundraisers
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/f/${fundraiser.unique_slug}`;
  const progressPercent = getProgressPercentage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero section with gallery */}
      <div className="relative">
        <FundraiserGallery
          images={images}
          isOwner={isOwner}
          onAddPhotos={() => setShowImageModal(true)}
          fundraiserTitle={fundraiser.title}
          coverPhotoUrl={fundraiser.cover_photo_url}
        />
        
        {/* Back button - positioned to work with both empty and filled states */}
        <Link 
          to="/stories"
          className="absolute top-8 left-4 lg:left-8 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm 
               flex items-center justify-center hover:bg-background transition-colors z-20 
               border border-border shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        {/* Extra padding when gallery has thumbnails */}
        {images.length > 1 && <div className="h-12" />}
      </div>

      {/* Main content - adjust margin based on whether images exist */}
      <div className={cn(
        "max-w-6xl mx-auto px-4 lg:px-8 relative z-10 pb-24 lg:pb-8",
        images.length === 0 ? "-mt-2" : "-mt-20"
      )}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Story content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div className="bg-card rounded-2xl shadow-lg p-6 lg:p-8 border border-border/50">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {categoryLabels[fundraiser.category] || fundraiser.category}
                </Badge>
                {fundraiser.status === "active" && (
                  <Badge className="bg-green-100 text-green-700 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                {fundraiser.title}
              </h1>

              {/* Organizer info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {organizer?.full_name?.[0]?.toUpperCase() || "O"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {organizer?.full_name || "Organizer"}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created {formatDate(fundraiser.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Story content */}
            <div className="bg-card rounded-2xl shadow-lg p-6 lg:p-8 border border-border/50">
              <h2 className="text-lg font-semibold text-foreground mb-4">Story</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {fundraiser.story}
              </div>
            </div>

            {/* Recent supporters */}
            {donations.length > 0 && (
              <div className="bg-card rounded-2xl shadow-lg p-6 lg:p-8 border border-border/50">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Recent Supporters ({fundraiser.donors_count})
                </h2>
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div key={donation.id} className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-secondary text-muted-foreground text-sm">
                          {donation.is_anonymous ? "A" : (donation.donor_email?.[0] || "D").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {donation.is_anonymous ? "Anonymous" : (donation.donor_email?.split("@")[0] || "Supporter")}
                          </span>
                          <span className="text-primary font-semibold">
                            ${donation.amount.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • {formatTimeAgo(donation.created_at)}
                          </span>
                        </div>
                        {donation.message && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            "{donation.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Donation panel (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Progress card */}
              <div className="bg-card rounded-2xl shadow-lg p-6 border border-border/50">
                {/* Circular progress */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-36 h-36">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-secondary"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
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

                {/* Amount raised */}
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-foreground">
                    ${fundraiser.amount_raised.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    raised of ${fundraiser.monthly_goal.toLocaleString()} goal
                  </p>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-6 mb-6 pb-6 border-b border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      {fundraiser.donors_count}
                    </div>
                    <p className="text-xs text-muted-foreground">donors</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      {Math.floor((Date.now() - new Date(fundraiser.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-xs text-muted-foreground">days active</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full text-lg font-semibold h-14 rounded-full shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate(`/donate?fundraiser=${fundraiser.id}`)}
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

              {/* Trust badges */}
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Secure donation processing</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>100% of donations go to the cause</span>
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
            onClick={() => navigate(`/donate?fundraiser=${fundraiser.id}`)}
          >
            <Heart className="w-5 h-5 mr-2" />
            Donate Now
          </Button>
        </div>
      </div>

      {/* Add padding at bottom for mobile CTA */}
      <div className="h-24 lg:h-0" />

      <Footer />

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        title={fundraiser.title}
        slug={fundraiser.unique_slug || undefined}
        amountRaised={fundraiser.amount_raised}
        goalAmount={fundraiser.monthly_goal}
      />

      {isOwner && fundraiser && (
        <ImageUploadModal
          open={showImageModal}
          onClose={() => setShowImageModal(false)}
          fundraiserId={fundraiser.id}
          existingImages={images}
          onImagesUpdated={() => fetchImages(fundraiser.id)}
        />
      )}
    </div>
  );
};

export default PublicFundraiser;
