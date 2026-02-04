import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Share2, 
  Edit2, 
  Copy, 
  Check, 
  ExternalLink, 
  Users,
  TrendingUp,
  Heart,
  LayoutDashboard,
  CreditCard,
  FileText,
  ChevronRight,
  Menu,
  X,
  Trash2,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareModal } from "@/components/apply/ShareModal";
import { FundraiserGallery } from "@/components/fundraiser/FundraiserGallery";
import { ImageUploadModal } from "@/components/fundraiser/ImageUploadModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";

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

const FundraiserDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [images, setImages] = useState<FundraiserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("fundraiser_images")
        .select("*")
        .eq("fundraiser_id", id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }, [id]);

  const fetchFundraiser = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("fundraisers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFundraiser(data);
    } catch (error) {
      console.error("Error fetching fundraiser:", error);
      toast({
        title: "Error",
        description: "Failed to load fundraiser details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchDonations = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("fundraiser_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // Clear data when user changes to prevent cross-account data flash
    setFundraiser(null);
    setDonations([]);
    setImages([]);
    setLoading(true);

    if (user && id) {
      fetchFundraiser();
      fetchDonations();
      fetchImages();
    }

    // Auto-open share modal if ?share=true is present
    const params = new URLSearchParams(window.location.search);
    if (params.get('share') === 'true') {
      setShowShareModal(true);
      // Clean up URL without refresh
      window.history.replaceState({}, '', `/fundraiser/${id}`);
    }
  }, [user, authLoading, id, fetchFundraiser, fetchDonations, fetchImages]);

  const handleDeleteFundraiser = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("fundraisers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Fundraiser deleted",
        description: "Your fundraiser has been permanently removed",
      });
      navigate("/my-fundraisers");
    } catch (error) {
      console.error("Error deleting fundraiser:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete fundraiser. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCopyLink = async () => {
    const url = fundraiser?.unique_slug 
      ? `${window.location.origin}/f/${fundraiser.unique_slug}`
      : `${window.location.origin}/fundraiser/${id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share it with friends and family",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getProgressPercentage = () => {
    if (!fundraiser || !fundraiser.monthly_goal) return 0;
    return Math.min((fundraiser.amount_raised / fundraiser.monthly_goal) * 100, 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Under Review</Badge>;
      case "paused":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return formatDate(dateString);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!fundraiser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Fundraiser not found</p>
        <Button onClick={() => navigate("/my-fundraisers")}>Go to My Fundraisers</Button>
      </div>
    );
  }

  const shareUrl = fundraiser.unique_slug 
    ? `${window.location.origin}/f/${fundraiser.unique_slug}`
    : `${window.location.origin}/fundraiser/${id}`;

  const sidebarLinks = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Heart, label: "Donations", href: "#donations" },
    { icon: CreditCard, label: "Transfers", href: "#transfers" },
    { icon: FileText, label: "Updates", href: "#updates" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border 
          transform transition-transform duration-300 lg:translate-x-0 pt-20
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-4">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">Hi, {user?.user_metadata?.full_name || "there"}!</p>
              <p className="text-lg font-semibold text-foreground">We're in this together</p>
            </div>
            
            <nav className="space-y-1">
              {sidebarLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href || "#"}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${link.active 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  `}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </a>
              ))}
            </nav>

            <Separator className="my-6" />
            
            <Link
              to="/my-fundraisers"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              View all fundraisers
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {/* Gallery section - full width */}
          <div className="pt-16 lg:pt-0">
            <div className="relative rounded-b-2xl overflow-hidden">
              <FundraiserGallery
                images={images}
                isOwner={true}
                onAddPhotos={() => setShowImageModal(true)}
                fundraiserTitle={fundraiser.title}
              />
            </div>
          </div>

          <div className="p-4 lg:p-8 pt-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Fundraiser header info */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(fundraiser.status)}
                      </div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{fundraiser.title}</h1>
                      <p className="text-muted-foreground">
                        Created {formatDate(fundraiser.created_at)} • {fundraiser.category}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(shareUrl, "_blank")}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Public Page
                      </Button>
                      <Button size="sm" onClick={() => setShowShareModal(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress and stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress ring card */}
                <Card className="lg:col-span-2 border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-8">
                      {/* Circular progress */}
                      <div className="relative w-28 h-28 lg:w-32 lg:h-32 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-secondary"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${getProgressPercentage() * 2.83} 283`}
                            strokeLinecap="round"
                            className="text-primary transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl lg:text-2xl font-bold text-foreground">
                            {Math.round(getProgressPercentage())}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <span className="text-2xl lg:text-3xl font-bold text-foreground">
                            ${fundraiser.amount_raised.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground ml-2 text-sm lg:text-base">
                            of ${fundraiser.monthly_goal.toLocaleString()} goal
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {fundraiser.donors_count} donor{fundraiser.donors_count !== 1 ? "s" : ""} have contributed
                        </p>
                        <Button variant="outline" size="sm">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Set up transfers
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick actions */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-10" onClick={() => navigate(`/fundraiser/${id}/edit`)}>
                      <Edit2 className="w-4 h-4 mr-3" />
                      Edit fundraiser
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-10" onClick={handleCopyLink}>
                      {copied ? <Check className="w-4 h-4 mr-3" /> : <Copy className="w-4 h-4 mr-3" />}
                      {copied ? "Copied!" : "Copy link"}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-10" onClick={() => setShowImageModal(true)}>
                      <Camera className="w-4 h-4 mr-3" />
                      Manage photos
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-10">
                      <Users className="w-4 h-4 mr-3" />
                      Invite co-organizers
                    </Button>
                    
                    <Separator className="my-2" />
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-3" />
                      Delete fundraiser
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent donations */}
              <Card id="donations" className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Recent Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {donations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">No donations yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Share your fundraiser to start receiving donations
                      </p>
                      <Button onClick={() => setShowShareModal(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share fundraiser
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {donations.map((donation) => (
                        <div key={donation.id} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {donation.is_anonymous ? "A" : (donation.donor_email?.[0] || "D").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {donation.is_anonymous ? "Anonymous" : donation.donor_email || "Donor"}
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                ${donation.amount.toLocaleString()}
                              </span>
                            </div>
                            {donation.message && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{donation.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(donation.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips card */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Boost your fundraiser</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Fundraisers shared on social media raise 3x more on average. Share yours now!
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setShowShareModal(true)}>
                        Share on social media
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        title={fundraiser.title}
        slug={fundraiser.unique_slug || undefined}
        amountRaised={fundraiser.amount_raised}
        goalAmount={fundraiser.monthly_goal}
      />

      <ImageUploadModal
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        fundraiserId={fundraiser.id}
        existingImages={images}
        onImagesUpdated={fetchImages}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this fundraiser?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data including photos and donation history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFundraiser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FundraiserDashboard;
