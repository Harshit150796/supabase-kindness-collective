import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SessionSecurityProvider } from "@/components/auth/SessionSecurityProvider";
import { GeoGuard } from "@/components/auth/GeoGuard";
import Index from "./pages/Index";
import { PrivacyConsentBanner } from "./components/PrivacyConsentBanner";

// All non-homepage routes are lazy-loaded so mobile users don't download
// the entire app on first paint.
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DonationSuccess = lazy(() => import("./pages/DonationSuccess"));
const DonationCancelled = lazy(() => import("./pages/DonationCancelled"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Stories = lazy(() => import("./pages/Stories"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const ApplyRecipient = lazy(() => import("./pages/ApplyRecipient"));
const PublicFundraiser = lazy(() => import("./pages/PublicFundraiser"));
const ProgressBarOverlay = lazy(() => import("./pages/overlays/ProgressBarOverlay"));
const DonationAlertOverlay = lazy(() => import("./pages/overlays/DonationAlertOverlay"));
const QRCodeOverlay = lazy(() => import("./pages/overlays/QRCodeOverlay"));
const MyFundraisers = lazy(() => import("./pages/MyFundraisers"));
const MyImpact = lazy(() => import("./pages/MyImpact"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const FundraiserDashboard = lazy(() => import("./pages/FundraiserDashboard"));
const Donate = lazy(() => import("./pages/Donate"));
const FeaturedStoryDetail = lazy(() => import("./pages/FeaturedStoryDetail"));
const CMSStoryDetail = lazy(() => import("./pages/CMSStoryDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Receiving-side pages
const RecipientCoupons = lazy(() => import("./pages/recipient/RecipientCoupons"));
const RecipientHistory = lazy(() => import("./pages/recipient/RecipientHistory"));
const RecipientLoyaltyCard = lazy(() => import("./pages/recipient/RecipientLoyaltyCard"));
const RecipientVerification = lazy(() => import("./pages/recipient/RecipientVerification"));

// Giving-side pages
const DonorDonate = lazy(() => import("./pages/donor/DonorDonate"));
const DonorImpact = lazy(() => import("./pages/donor/DonorImpact"));
const DonorHistory = lazy(() => import("./pages/donor/DonorHistory"));


// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminStories = lazy(() => import("./pages/admin/AdminStories"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminFundraisers = lazy(() => import("./pages/admin/AdminFundraisers"));
const AdminNewsletters = lazy(() => import("./pages/admin/AdminNewsletters"));
const AdminDonations = lazy(() => import("./pages/admin/AdminDonations"));
const AdminProcurement = lazy(() => import("./pages/admin/AdminProcurement"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-dvh flex items-center justify-center bg-background">Loading...</div>
);

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, roles, loading } = useAuth();
  
  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-background">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!allowedRoles.some(role => roles.includes(role as any))) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/story/:id" element={<StoryDetail />} />
      <Route path="/f/:slug" element={<PublicFundraiser />} />
      <Route path="/featured/:storyKey" element={<FeaturedStoryDetail />} />
      <Route path="/story-detail/:id" element={<CMSStoryDetail />} />

      {/* OBS/Streaming Overlay Routes */}
      <Route path="/overlay/progress/:slug" element={<ProgressBarOverlay />} />
      <Route path="/overlay/alerts/:slug" element={<DonationAlertOverlay />} />
      <Route path="/overlay/qr/:slug" element={<QRCodeOverlay />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/donation-success" element={<DonationSuccess />} />
      <Route path="/donation-cancelled" element={<DonationCancelled />} />
      <Route path="/apply" element={<GeoGuard><ApplyRecipient /></GeoGuard>} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/my-fundraisers" element={<GeoGuard><MyFundraisers /></GeoGuard>} />
      <Route path="/my-impact" element={<MyImpact />} />
      <Route path="/fundraiser/:id" element={<GeoGuard><FundraiserDashboard /></GeoGuard>} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />

      {/* Unified account routes — one account, giving + receiving */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/donate" element={<ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><DonorDonate /></ProtectedRoute>} />
      <Route path="/dashboard/giving" element={<ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><DonorHistory /></ProtectedRoute>} />
      <Route path="/dashboard/impact" element={<ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><DonorImpact /></ProtectedRoute>} />
      <Route path="/dashboard/wallet" element={<GeoGuard><ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><RecipientCoupons /></ProtectedRoute></GeoGuard>} />
      <Route path="/dashboard/loyalty-card" element={<GeoGuard><ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><RecipientLoyaltyCard /></ProtectedRoute></GeoGuard>} />
      <Route path="/dashboard/verification" element={<GeoGuard><ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><RecipientVerification /></ProtectedRoute></GeoGuard>} />
      <Route path="/dashboard/history" element={<GeoGuard><ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}><RecipientHistory /></ProtectedRoute></GeoGuard>} />

      {/* Legacy role-split paths — kept as redirects so old links keep working */}
      <Route path="/recipient" element={<Navigate to="/dashboard" replace />} />
      <Route path="/recipient/coupons" element={<Navigate to="/dashboard/wallet" replace />} />
      <Route path="/recipient/history" element={<Navigate to="/dashboard/history" replace />} />
      <Route path="/recipient/loyalty-card" element={<Navigate to="/dashboard/loyalty-card" replace />} />
      <Route path="/recipient/verification" element={<Navigate to="/dashboard/verification" replace />} />
      <Route path="/donor" element={<Navigate to="/dashboard" replace />} />
      <Route path="/donor/donate" element={<Navigate to="/dashboard/donate" replace />} />
      <Route path="/donor/impact" element={<Navigate to="/dashboard/impact" replace />} />
      <Route path="/donor/coupons" element={<Navigate to="/dashboard/wallet" replace />} />
      <Route path="/donor/history" element={<Navigate to="/dashboard/giving" replace />} />


      {/* Admin Routes (US-only) */}
      <Route path="/admin" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/users" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/verifications" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminVerifications /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/coupons" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminCoupons /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/analytics" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/content" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminContent /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/stories" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminStories /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/testimonials" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminTestimonials /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/blog" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminBlog /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/faq" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminFAQ /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/fundraisers" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminFundraisers /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/newsletters" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminNewsletters /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/donations" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminDonations /></ProtectedRoute></GeoGuard>} />
      <Route path="/admin/procurement" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={['admin']}><AdminProcurement /></ProtectedRoute></GeoGuard>} />

      {/* Blog Routes */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <SessionSecurityProvider>
                <AppRoutes />
                <PrivacyConsentBanner />
              </SessionSecurityProvider>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
