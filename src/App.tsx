import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SessionSecurityProvider } from "@/components/auth/SessionSecurityProvider";
import Index from "./pages/Index";

// Lazy-load every non-home page to keep the landing bundle small.
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
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

const RecipientDashboard = lazy(() => import("./pages/recipient/RecipientDashboard"));
const RecipientCoupons = lazy(() => import("./pages/recipient/RecipientCoupons"));
const RecipientHistory = lazy(() => import("./pages/recipient/RecipientHistory"));
const RecipientLoyaltyCard = lazy(() => import("./pages/recipient/RecipientLoyaltyCard"));
const RecipientVerification = lazy(() => import("./pages/recipient/RecipientVerification"));

const DonorDashboard = lazy(() => import("./pages/donor/DonorDashboard"));
const DonorDonate = lazy(() => import("./pages/donor/DonorDonate"));
const DonorImpact = lazy(() => import("./pages/donor/DonorImpact"));
const DonorHistory = lazy(() => import("./pages/donor/DonorHistory"));
const DonorCoupons = lazy(() => import("./pages/donor/DonorCoupons"));

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

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, roles, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
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
    <Route path="/apply" element={<ApplyRecipient />} />
    <Route path="/donate" element={<Donate />} />
    <Route path="/my-fundraisers" element={<MyFundraisers />} />
    <Route path="/my-impact" element={<MyImpact />} />
    <Route path="/fundraiser/:id" element={<FundraiserDashboard />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
    
    {/* Recipient Routes */}
    <Route path="/recipient" element={<ProtectedRoute allowedRoles={['recipient']}><RecipientDashboard /></ProtectedRoute>} />
    <Route path="/recipient/coupons" element={<ProtectedRoute allowedRoles={['recipient']}><RecipientCoupons /></ProtectedRoute>} />
    <Route path="/recipient/history" element={<ProtectedRoute allowedRoles={['recipient']}><RecipientHistory /></ProtectedRoute>} />
    <Route path="/recipient/loyalty-card" element={<ProtectedRoute allowedRoles={['recipient']}><RecipientLoyaltyCard /></ProtectedRoute>} />
    <Route path="/recipient/verification" element={<ProtectedRoute allowedRoles={['recipient']}><RecipientVerification /></ProtectedRoute>} />
    
    {/* Donor Routes */}
    <Route path="/donor" element={<ProtectedRoute allowedRoles={['donor']}><DonorDashboard /></ProtectedRoute>} />
    <Route path="/donor/donate" element={<ProtectedRoute allowedRoles={['donor']}><DonorDonate /></ProtectedRoute>} />
    <Route path="/donor/impact" element={<ProtectedRoute allowedRoles={['donor']}><DonorImpact /></ProtectedRoute>} />
    <Route path="/donor/coupons" element={<ProtectedRoute allowedRoles={['donor']}><DonorCoupons /></ProtectedRoute>} />
    <Route path="/donor/history" element={<ProtectedRoute allowedRoles={['donor']}><DonorHistory /></ProtectedRoute>} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminVerifications /></ProtectedRoute>} />
    <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['admin']}><AdminCoupons /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
    <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['admin']}><AdminContent /></ProtectedRoute>} />
    <Route path="/admin/stories" element={<ProtectedRoute allowedRoles={['admin']}><AdminStories /></ProtectedRoute>} />
    <Route path="/admin/testimonials" element={<ProtectedRoute allowedRoles={['admin']}><AdminTestimonials /></ProtectedRoute>} />
    <Route path="/admin/blog" element={<ProtectedRoute allowedRoles={['admin']}><AdminBlog /></ProtectedRoute>} />
    <Route path="/admin/faq" element={<ProtectedRoute allowedRoles={['admin']}><AdminFAQ /></ProtectedRoute>} />
    <Route path="/admin/fundraisers" element={<ProtectedRoute allowedRoles={['admin']}><AdminFundraisers /></ProtectedRoute>} />
    <Route path="/admin/newsletters" element={<ProtectedRoute allowedRoles={['admin']}><AdminNewsletters /></ProtectedRoute>} />
    <Route path="/admin/donations" element={<ProtectedRoute allowedRoles={['admin']}><AdminDonations /></ProtectedRoute>} />
    <Route path="/admin/procurement" element={<ProtectedRoute allowedRoles={['admin']}><AdminProcurement /></ProtectedRoute>} />
    
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
              </SessionSecurityProvider>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
