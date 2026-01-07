import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DonationSuccess from "./pages/DonationSuccess";
import DonationCancelled from "./pages/DonationCancelled";
import ResetPassword from "./pages/ResetPassword";
import Stories from "./pages/Stories";
import StoryDetail from "./pages/StoryDetail";
import ApplyRecipient from "./pages/ApplyRecipient";
import MyFundraisers from "./pages/MyFundraisers";
import MyImpact from "./pages/MyImpact";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Recipient pages
import RecipientDashboard from "./pages/recipient/RecipientDashboard";
import RecipientCoupons from "./pages/recipient/RecipientCoupons";
import RecipientHistory from "./pages/recipient/RecipientHistory";
import RecipientLoyaltyCard from "./pages/recipient/RecipientLoyaltyCard";
import RecipientVerification from "./pages/recipient/RecipientVerification";

// Donor pages
import DonorDashboard from "./pages/donor/DonorDashboard";
import DonorDonate from "./pages/donor/DonorDonate";
import DonorImpact from "./pages/donor/DonorImpact";
import DonorHistory from "./pages/donor/DonorHistory";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, roles, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!allowedRoles.some(role => roles.includes(role as any))) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/about" element={<About />} />
    <Route path="/how-it-works" element={<HowItWorks />} />
    <Route path="/faq" element={<FAQ />} />
    <Route path="/stories" element={<Stories />} />
    <Route path="/story/:id" element={<StoryDetail />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/donation-success" element={<DonationSuccess />} />
    <Route path="/donation-cancelled" element={<DonationCancelled />} />
    <Route path="/apply" element={<ApplyRecipient />} />
    <Route path="/my-fundraisers" element={<MyFundraisers />} />
    <Route path="/my-impact" element={<MyImpact />} />
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
    <Route path="/donor/history" element={<ProtectedRoute allowedRoles={['donor']}><DonorHistory /></ProtectedRoute>} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminVerifications /></ProtectedRoute>} />
    <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['admin']}><AdminCoupons /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
