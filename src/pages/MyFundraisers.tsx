import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Megaphone, Users, DollarSign, Calendar, ExternalLink, Share2, Eye, Heart } from "lucide-react";

interface FundraiserImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface Fundraiser {
  id: string;
  title: string;
  story: string;
  category: string;
  beneficiary_type: string;
  monthly_goal: number;
  cover_photo_url: string | null;
  status: string;
  amount_raised: number;
  donors_count: number;
  unique_slug: string | null;
  created_at: string;
  fundraiser_images?: FundraiserImage[];
}

const getPrimaryImage = (fundraiser: Fundraiser): string | null => {
  const primaryImg = fundraiser.fundraiser_images?.find(img => img.is_primary)?.image_url;
  if (primaryImg) return primaryImg;
  
  const firstImg = fundraiser.fundraiser_images?.[0]?.image_url;
  if (firstImg) return firstImg;
  
  return fundraiser.cover_photo_url;
};

const MyFundraisers = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Clear data when user changes or logs out to prevent cross-account data flash
    setFundraisers([]);
    setLoadingData(true);

    const fetchFundraisers = async () => {
      if (!user) {
        setLoadingData(false);
        return;
      }

      const { data, error } = await supabase
        .from("fundraisers")
        .select(`
          *,
          fundraiser_images (id, image_url, is_primary)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFundraisers(data);
      }
      setLoadingData(false);
    };

    if (user) {
      fetchFundraisers();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Under Review</Badge>;
      case "paused":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Paused</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    if (!goal) return 0;
    return Math.min((raised / goal) * 100, 100);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your fundraisers</h1>
              <p className="text-muted-foreground mt-1">
                Manage your coupon requests and track their progress
              </p>
            </div>
            <Button onClick={() => navigate("/apply")} className="gap-2">
              <Plus className="w-4 h-4" />
              Start a fundraiser
            </Button>
          </div>

          {/* Fundraisers List */}
          {fundraisers.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No fundraisers yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start your first coupon request to receive assistance from donors in your community.
                </p>
                <Button onClick={() => navigate("/apply")} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Start your first fundraiser
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {fundraisers.map((fundraiser) => {
                const progress = getProgressPercentage(fundraiser.amount_raised, fundraiser.monthly_goal);
                
                return (
                  <Card 
                    key={fundraiser.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/fundraiser/${fundraiser.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Cover image */}
                        <div className="w-full md:w-48 h-32 md:h-auto flex-shrink-0">
                          {(() => {
                            const imageUrl = getPrimaryImage(fundraiser);
                            return imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={fundraiser.title}
                                className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                                <Heart className="w-8 h-8 text-primary/30" />
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                                {fundraiser.title}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Created {new Date(fundraiser.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(fundraiser.status)}
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="font-medium text-foreground">
                                ${fundraiser.amount_raised.toLocaleString()} raised
                              </span>
                              <span className="text-muted-foreground">
                                ${fundraiser.monthly_goal.toLocaleString()} goal
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          
                          {/* Stats & Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {fundraiser.donors_count} donor{fundraiser.donors_count !== 1 ? "s" : ""}
                              </span>
                              <span className="capitalize">{fundraiser.category}</span>
                            </div>
                            
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(`${window.location.origin}/fundraiser/${fundraiser.id}`, "_blank")}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/fundraiser/${fundraiser.id}`)}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyFundraisers;
