import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RecipientDashboard from "./pages/recipient/RecipientDashboard";
import DonationSuccess from "./pages/DonationSuccess";
import DonationCancelled from "./pages/DonationCancelled";

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
    <Route path="/auth" element={<Auth />} />
    <Route path="/donation-success" element={<DonationSuccess />} />
    <Route path="/donation-cancelled" element={<DonationCancelled />} />
    <Route path="/recipient" element={<ProtectedRoute allowedRoles={['recipient']}><RecipientDashboard /></ProtectedRoute>} />
    <Route path="/donor" element={<ProtectedRoute allowedRoles={['donor']}><RecipientDashboard /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><RecipientDashboard /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
