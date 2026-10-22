import { lazy, Suspense } from "react";
import { loadApplyRecipient } from "@/lib/applyRoute";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SessionSecurityProvider } from "@/components/auth/SessionSecurityProvider";
import { GeoGuard } from "@/components/auth/GeoGuard";
import { AdminShell, AdminOnly } from "@/components/admin/AdminShell";
import { adminPage } from "./pages/admin/adminPages";
const Index = lazy(() => import("./pages/Index"));
import { PrivacyConsentBanner } from "./components/PrivacyConsentBanner";
import { VisitorAnalytics } from "./components/VisitorAnalytics";
import { CursorTrail } from './components/CursorTrail';
import { SiteMenuProvider } from './components/navigation/SiteMenuProvider';
import { signInPath } from './lib/serverActions';
import { PageChoreography } from './components/PageChoreography';

// All non-homepage routes are lazy-loaded so mobile users don't download
// the entire app on first paint.
const About = lazy(() => import("./pages/About"));
const ImpactLink = lazy(() => import("./pages/ImpactLink"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Terms = lazy(() => import("./pages/Terms"));
const Refunds = lazy(() => import("./pages/legal/Refunds"));
const Copyright = lazy(() => import("./pages/legal/Copyright"));
const HealthDataPrivacy = lazy(() => import("./pages/legal/HealthDataPrivacy"));
const Accessibility = lazy(() => import("./pages/legal/Accessibility"));
const FundraiserRules = lazy(() => import("./pages/legal/FundraiserRules"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DonationSuccess = lazy(() => import("./pages/DonationSuccess"));
const DonationCancelled = lazy(() => import("./pages/DonationCancelled"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Stories = lazy(() => import("./pages/Stories"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const ApplyRecipient = lazy(loadApplyRecipient);
// Shown only if the application isn't downloaded yet: an outline in the page's own colours, not a blank "Loading...".
const ApplyFallback = () => (
  <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] xl:grid-cols-[minmax(0,1fr)_32rem]" aria-busy="true" aria-label="Loading application">
    <div className="px-4 sm:px-8 lg:px-12 xl:px-16">
      <div className="flex h-16 items-center"><div className="h-9 w-44 rounded-lg bg-muted animate-pulse" /></div>
      <div className="mx-auto max-w-[46rem] pt-4 sm:pt-6 lg:pt-8">
        <div className="grid grid-cols-4 gap-3"><div className="h-[3px] rounded-full bg-primary" /><div className="h-[3px] rounded-full bg-border" /><div className="h-[3px] rounded-full bg-border" /><div className="h-[3px] rounded-full bg-border" /></div>
        <div className="mt-10 h-12 w-3/4 rounded-lg bg-muted animate-pulse" />
        <div className="mt-4 h-5 w-2/3 rounded bg-muted/70" />
        <div className="mt-12 grid gap-3 sm:grid-cols-3"><div className="h-28 rounded-2xl bg-muted/70 animate-pulse" /><div className="h-28 rounded-2xl bg-muted/70 animate-pulse" /><div className="h-28 rounded-2xl bg-muted/70 animate-pulse" /></div>
      </div>
    </div>
    <div className="hidden bg-primary-20 lg:block" />
  </div>
);
const PublicFundraiser = lazy(() => import("./pages/PublicFundraiser"));
const ProgressBarOverlay = lazy(() => import("./pages/overlays/ProgressBarOverlay"));
const DonationAlertOverlay = lazy(() => import("./pages/overlays/DonationAlertOverlay"));
const QRCodeOverlay = lazy(() => import("./pages/overlays/QRCodeOverlay"));
const MyFundraisers = lazy(() => import("./pages/MyFundraisers"));
const MyImpact = lazy(() => import("./pages/MyImpact"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const FundraiserDashboard = lazy(() => import("./pages/FundraiserDashboard"));
const FundraiserEdit = lazy(() => import("./pages/FundraiserEdit"));
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
const NeedPage = lazy(() => import("./pages/NeedPage"));
const Partners = lazy(() => import("./pages/Partners"));
const ADMIN_PAGES = [['/admin', adminPage('/admin')],['/admin/analytics', adminPage('/admin/analytics')],['/admin/fundraisers', adminPage('/admin/fundraisers')],['/admin/donations', adminPage('/admin/donations')],['/admin/donors', adminPage('/admin/donors')],['/admin/monthly', adminPage('/admin/monthly')],['/admin/verifications', adminPage('/admin/verifications')],['/admin/coupons', adminPage('/admin/coupons')],['/admin/procurement', adminPage('/admin/procurement')],['/admin/gold-coins', adminPage('/admin/gold-coins')],['/admin/partners', adminPage('/admin/partners')],['/admin/moderation', adminPage('/admin/moderation')],['/admin/contact', adminPage('/admin/contact')],['/admin/followups', adminPage('/admin/followups')],['/admin/tasks', adminPage('/admin/tasks')],['/admin/notifications', adminPage('/admin/notifications')],['/admin/content', adminPage('/admin/content')],['/admin/stories', adminPage('/admin/stories')],['/admin/testimonials', adminPage('/admin/testimonials')],['/admin/blog', adminPage('/admin/blog')],['/admin/faq', adminPage('/admin/faq')],['/admin/newsletters', adminPage('/admin/newsletters')],['/admin/team', adminPage('/admin/team')],['/admin/users', adminPage('/admin/users')],['/admin/audit', adminPage('/admin/audit')],['/admin/settings', adminPage('/admin/settings')]] as const;
const ADMIN_ONLY = new Set(['/admin/audit', '/admin/moderation', '/admin/users']);
const Messages = lazy(() => import("./pages/Messages"));
const TeamAccept = lazy(() => import("./pages/TeamAccept"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-dvh flex items-center justify-center bg-background">Loading...</div>
);

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, roles, loading, rolesLoaded } = useAuth();
  const location = useLocation();
  
  // Wait for roles too: previously `loading` cleared before roles arrived, so a refresh or
  // deep link to a role-gated page saw roles=[] and bounced to "/" (the admin "acts weird" bug).
  if (loading || (user && !rolesLoaded)) return <div className="min-h-dvh flex items-center justify-center bg-background">Loading...</div>;
  // Signing in brings people back to the page they asked for.
  if (!user) return <Navigate to={signInPath(`${location.pathname}${location.search}`)} replace />;
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
      <Route path="/refunds" element={<Refunds />} />
      <Route path="/copyright" element={<Copyright />} />
      <Route path="/health-data-privacy" element={<HealthDataPrivacy />} />
      <Route path="/accessibility" element={<Accessibility />} />
      <Route path="/fundraiser-rules" element={<FundraiserRules />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/help/:need" element={<NeedPage />} />
      <Route path="/partners" element={<Partners />} />
      <Route path="/story/:id" element={<StoryDetail />} />
      <Route path="/f/:slug" element={<PublicFundraiser />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/team/accept" element={<TeamAccept />} />
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
      <Route path="/apply" element={<GeoGuard><Suspense fallback={<ApplyFallback />}><ApplyRecipient /></Suspense></GeoGuard>} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/my-fundraisers" element={<GeoGuard><MyFundraisers /></GeoGuard>} />
      <Route path="/my-impact" element={<MyImpact />} />
      <Route path="/impact/:token" element={<ImpactLink />} />
      <Route path="/fundraiser/:id" element={<GeoGuard><FundraiserDashboard /></GeoGuard>} />
      <Route path="/fundraiser/:id/edit" element={<GeoGuard><FundraiserEdit /></GeoGuard>} />
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


      {/* Admin portal (US-only): one persistent frame; only the middle area changes. */}
      <Route path="/admin/fundraisers/manage" element={<Navigate to="/admin/fundraisers" replace />} />
      <Route path="/admin" element={<AdminShell />}>
        {ADMIN_PAGES.map(([path, Page]) => {
          const el = ADMIN_ONLY.has(path) ? <AdminOnly><Page /></AdminOnly> : <Page />;
          return path === '/admin' ? <Route key={path} index element={el} /> : <Route key={path} path={path.slice(7)} element={el} />;
        })}
      </Route>

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
                <SiteMenuProvider>
                  <AppRoutes />
                  <CursorTrail />
                  <PageChoreography />
                  <PrivacyConsentBanner />
                  <VisitorAnalytics />
                </SiteMenuProvider>
              </SessionSecurityProvider>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
