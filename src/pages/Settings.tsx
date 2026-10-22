import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useSignOut } from "@/hooks/useSignOut";
import { signInPath } from "@/lib/serverActions";
import { PaymentMethods } from "@/components/donor/PaymentMethods";
import { Bell, Shield, Trash2, Mail, Heart, LogOut } from "lucide-react";
import { LEGAL_EMAIL } from "@/lib/legal";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const signOut = useSignOut();

  useEffect(() => {
    if (!loading && !user) {
      navigate(signInPath("/settings"), { replace: true });
    }
  }, [user, loading, navigate]);

  // Deletion and data copies are handled by the team from an email sent from the account's own
  // address, which confirms it's really the account holder (Privacy Policy, "Your choices").
  const requestEmail = (kind: "delete" | "copy") => {
    const subject = kind === "delete" ? "Delete my CouponDonation account" : "Send me a copy of my CouponDonation data";
    const body = kind === "delete"
      ? `Please delete my CouponDonation account (${user?.email ?? ""}) and the personal data linked to it.`
      : `Please send me a copy of the personal data linked to my CouponDonation account (${user?.email ?? ""}).`;
    window.location.href = `mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-5xl font-normal text-foreground">Your settings.</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account preferences
            </p>
          </div>

          {/* Notifications */}
          <Card className="mb-6 rounded-md shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your donations and fundraisers
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Impact updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone you helped shares an update
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="mb-6 rounded-md shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Privacy
              </CardTitle>
              <CardDescription>
                Control your privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show my name on donations</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your name publicly on fundraiser pages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show donation amount</Label>
                  <p className="text-sm text-muted-foreground">
                    Display how much you donated publicly
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <PaymentMethods />

          {/* Session */}
          <Card className="mb-6 rounded-md shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-primary" />
                Signed in
              </CardTitle>
              <CardDescription>
                {user?.email ? `You are signed in as ${user.email}.` : 'You are signed in on this device.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Sign out here when you are on a shared or public device. Other devices stay signed in.
                </p>
                <Button variant="outline" size="sm" className="min-h-11 shrink-0" onClick={() => { void signOut(); }}>
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="rounded-md border-destructive/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <Label>Get a copy of your data</Label>
                  <p className="text-sm text-muted-foreground">
                    Opens an email to our team. We reply within 30 days.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => requestEmail("copy")}>
                  Request a copy
                </Button>
              </div>
              <Separator className="my-5" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <Label>Delete account</Label>
                  <p className="text-sm text-muted-foreground">
                    Opens an email to our team from your address. We delete your account and personal data
                    within 30 days, except records the law requires us to keep, such as donation receipts.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => requestEmail("delete")}
                >
                  Request deletion
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer contact={false} />
    </div>
  );
};

export default Settings;