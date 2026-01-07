import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Megaphone, Users, DollarSign, Calendar, ExternalLink } from "lucide-react";

interface Fundraiser {
  id: string;
  submitted_at: string | null;
  verification_type: string;
  status: string;
  notes: string | null;
}

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
    const fetchFundraisers = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("recipient_verifications")
        .select("id, submitted_at, verification_type, status, notes")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

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
      case "approved":
        return <Badge className="bg-primary/10 text-primary">Active</Badge>;
      case "pending":
        return <Badge className="bg-gold/10 text-gold">Pending Review</Badge>;
      case "rejected":
        return <Badge variant="destructive">Not Approved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const parseNotes = (notes: string | null) => {
    if (!notes) return {};
    const parts: Record<string, string> = {};
    notes.split(", ").forEach((part) => {
      const [key, value] = part.split(": ");
      if (key && value) {
        parts[key.toLowerCase()] = value;
      }
    });
    return parts;
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
                const details = parseNotes(fundraiser.notes);
                return (
                  <Card key={fundraiser.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {details.title || `${fundraiser.verification_type} Assistance`}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Created {fundraiser.submitted_at ? new Date(fundraiser.submitted_at).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                        {getStatusBadge(fundraiser.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Goal:</span>
                          <span className="font-medium">${details["monthly goal"] || "0"}/mo</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium capitalize">{details.category || "General"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Megaphone className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">For:</span>
                          <span className="font-medium capitalize">{fundraiser.verification_type}</span>
                        </div>
                      </div>
                      
                      {fundraiser.status === "approved" && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View public page
                        </Button>
                      )}
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