import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { prefetchWhenIdle } from "@/lib/idlePrefetch";
import { useNavigate } from "react-router-dom";
import { ApplyLayout } from "@/components/apply/ApplyLayout";
import { BasicsStep } from "@/components/apply/steps/BasicsStep";
import { GoalStep } from "@/components/apply/steps/GoalStep";
// Later steps and screens load separately so step 1 opens fast; they preload once step 1 shows.
const loadStory = () => import("@/components/apply/steps/StoryStep");
const loadReview = () => import("@/components/apply/steps/ReviewStep");
const loadAccount = () => import("@/components/apply/AccountDialog");
const loadSuccess = () => import("@/components/apply/SuccessScreen");
const loadShare = () => import("@/components/apply/ShareScreen");
const loadSignIn = () => import("@/components/apply/SignInPrompt");
const loadOtp = () => import("@/components/auth/OTPVerification");
const StoryStep = lazy(() => loadStory().then((m) => ({ default: m.StoryStep })));
const ReviewStep = lazy(() => loadReview().then((m) => ({ default: m.ReviewStep })));
const AccountDialog = lazy(() => loadAccount().then((m) => ({ default: m.AccountDialog })));
const SuccessScreen = lazy(() => loadSuccess().then((m) => ({ default: m.SuccessScreen })));
const ShareScreen = lazy(() => loadShare().then((m) => ({ default: m.ShareScreen })));
const SignInPrompt = lazy(() => loadSignIn().then((m) => ({ default: m.SignInPrompt })));
const OTPVerification = lazy(() => loadOtp().then((m) => ({ default: m.OTPVerification })));
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useZipLookup } from "@/lib/zipLookup";
import { cityState, needLabel } from "@/lib/helpNeeds";
import { findRetailer } from "@/components/landing/donate/retailers";
import { RequestPanel } from "@/components/apply/RequestPanel";
import { MediaItem, uploadMediaFile } from "@/lib/mediaUpload";
import {
  saveScopedDraft,
  loadScopedDraft,
  clearScopedDraft,
} from "@/lib/draftStorage";
import { markAgreement, recordAgreement } from "@/lib/legal";
import { pingSearchEngines } from "@/lib/searchPing";
import { SEO, breadcrumbJsonLd } from "@/components/SEO";


interface ApplicationData {
  country: string;
  zipCode: string;
  category: string;
  needs: string[];
  stores: string[];
  beneficiaryType: string;
  monthlyGoal: string;
  smartMatching: boolean;
  media: MediaItem[];

  story: string;
  title: string;
  titleSource: "suggested" | "custom";
}

const getDefaults = (): Omit<ApplicationData, "media"> => ({
  country: "us",
  zipCode: "",
  category: "",
  needs: [],
  stores: [],
  beneficiaryType: "",
  monthlyGoal: "",
  smartMatching: true,

  story: "",
  title: "",
  titleSource: "suggested" as const,
});

const stepConfig = [
  {
    headline: "Start your request",
    subtext: "Who it's for, what you need, and the stores where coupons would help most. The whole application takes about 3 minutes.",
  },
  {
    headline: "Tell your story",
    subtext: "A few honest sentences and a photo help donors understand what's happening.",
  },
  {
    headline: "Set your goal",
    subtext: "How much you need in total, and where you live.",
  },
  {
    headline: "Review your request",
    subtext: "This is how donors will see it. Check each part, then submit.",
  },
];

const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Writes the request; if the database doesn't have the needs and stores columns yet, saves without them. */
async function insertFundraiser(row: Record<string, unknown>, extras: Record<string, unknown>) {
  const first = await supabase.from("fundraisers").insert({ ...row, ...extras } as never).select().single();
  const missing = first.error && (first.error.code === "PGRST204" || first.error.code === "42703");
  if (!missing) return first;
  return supabase.from("fundraisers").insert(row as never).select().single();
}



type ScreenState = "form" | "otp" | "success" | "share" | "signin-prompt";

// Generate a unique slug from title
const generateUniqueSlug = (title: string): string => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
};

const ApplyRecipient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp, signIn, loading: authLoading } = useAuth();

  // Track the previous user ID to detect user changes
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => prefetchWhenIdle([loadStory, loadReview, loadAccount, loadOtp, loadSignIn, loadSuccess, loadShare]), []);

  // Determine if user is already authenticated
  const isAuthenticated = !!user && !authLoading;
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];

  // Always 4 steps — account creation happens in a popup, not as a step
  const totalSteps = 4;


  const [currentStep, setCurrentStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>("form");
  
  const [createdFundraiserId, setCreatedFundraiserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Form state
  const [country, setCountry] = useState("us");
  const [zipCode, setZipCode] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  // The first need is the fundraiser's main category (filters and older pages read it).
  const category = needs[0] ?? "";
  const [beneficiaryType, setBeneficiaryType] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [smartMatching, setSmartMatching] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const [story, setStory] = useState("");
  const [title, setTitle] = useState("");
  const [titleSource, setTitleSource] = useState<"suggested" | "custom">("suggested");
  // The final step's required confirmation (truth, consent for photos, Terms). Never saved in drafts.
  const [confirmed, setConfirmed] = useState(false);

  // Account state (only used for non-authenticated users)
  const [accountOpen, setAccountOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<"advance" | "submit">("advance");
  // Set while the account popup flow is running so an auth change doesn't wipe progress
  const preserveOnAuthRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Reset form to defaults
  const resetForm = () => {
    const defaults = getDefaults();
    setCountry(defaults.country);
    setZipCode(defaults.zipCode);
    setNeeds([]);
    setStores([]);
    setBeneficiaryType(defaults.beneficiaryType);
    setMonthlyGoal(defaults.monthlyGoal);
    setSmartMatching(defaults.smartMatching);
    setMedia([]);
    setStory(defaults.story);
    setTitle(defaults.title);
    setTitleSource(defaults.titleSource);
    setCurrentStep(1);
    setReached(1);
  };

  // Load saved data on mount and when user changes
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) return;

    const currentUserId = user?.id ?? null;

    // Detect user change (including logout)
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentUserId) {
      if (preserveOnAuthRef.current) {
        // They just signed up / signed in from the account popup mid-application:
        // keep everything they typed and migrate the anonymous draft to their account.
        prevUserIdRef.current = currentUserId;
        preserveOnAuthRef.current = false;
        clearScopedDraft(null);
        setInitialized(true);
        return;
      }
      // User changed - reset form and clear cover photo preview
      resetForm();
      setMedia([]);
    }

    prevUserIdRef.current = currentUserId;

    // Load draft for current user scope
    const saved = loadScopedDraft(currentUserId);
    if (saved) {
      setCountry((saved.country as string) || "us");
      setZipCode((saved.zipCode as string) || "");
      const savedNeeds = Array.isArray(saved.needs) ? (saved.needs as string[]) : saved.category ? [saved.category as string] : [];
      setNeeds(savedNeeds);
      setStores(Array.isArray(saved.stores) ? (saved.stores as string[]) : []);
      setBeneficiaryType((saved.beneficiaryType as string) || "");
      setMonthlyGoal((saved.monthlyGoal as string) || "");
      setSmartMatching(saved.smartMatching !== false);
      // Don't restore media for security - user must re-attach photos
      setStory((saved.story as string) || "");
      setTitle((saved.title as string) || "");
      setTitleSource((saved.titleSource as "suggested" | "custom") || "suggested");
    }

    setInitialized(true);
  }, [user?.id, authLoading]);

  // Save to storage when data changes (scoped to user)
  useEffect(() => {
    if (!initialized) return;

    const userId = user?.id ?? null;
    
    // Don't persist media for security
    saveScopedDraft(userId, {
      country,
      zipCode,
      category,
      needs,
      stores,
      beneficiaryType,
      monthlyGoal,
      smartMatching,
      story,
      title,
      titleSource,
    });
  }, [
    initialized,
    user?.id,
    country,
    zipCode,
    category,
    needs,
    stores,
    beneficiaryType,
    monthlyGoal,
    smartMatching,
    story,
    title,
    titleSource,
  ]);

  const zip = useZipLookup(zipCode);
  const place = zip.status === "found" ? cityState(zip.city, zip.stateCode) : null;
  const words = countWords(story || "");

  useEffect(() => {
    setReached((r) => Math.max(r, currentStep));
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  /** What still stops this step, in the words shown beside Continue; null when it can go on. */
  const blockedReason = (): string | null => {
    switch (currentStep) {
      case 1:
        if (!beneficiaryType) return "Choose who the request is for";
        if (!needs.length) return "Choose at least one need";
        if (!stores.length) return "Choose at least one store";
        return null;
      case 2: {
        if (words < 10) return `Write ${10 - words} more ${10 - words === 1 ? "word" : "words"}`;
        if (media.some((m) => m.status === "uploading")) return "Waiting for uploads to finish";
        const hasPhoto = media.some((m) => !m.file.type.startsWith("video/") && (m.status === "done" || m.status === "ready"));
        return hasPhoto ? null : "Add at least one photo";
      }
      case 3:
        if (!monthlyGoal || parseInt(monthlyGoal) <= 0) return "Enter your goal";
        return /^\d{5}$/.test(zipCode) ? null : "Enter your 5-digit ZIP code";
      case 4:
        if (!(title || "").trim()) return "Add a title";
        return confirmed ? null : "Tick the confirmation to submit";
      default:
        return "Not ready";
    }
  };
  const canContinue = () => blockedReason() === null;



  // Handler for authenticated user submission (skips account creation)
  const handleAuthenticatedSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!user) throw new Error("User not found");

      // Ensure user has recipient role
      await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'recipient' as const },
          { onConflict: 'user_id,role' }
        );

      // Create the fundraiser
      const fundraiserData = await createFundraiserForUser(user.id);
      setCreatedFundraiserId(fundraiserData.id);

      // Clear the draft for this user
      clearScopedDraft(user.id);

      toast({
        title: "Fundraiser created!",
        description: "Your fundraiser has been submitted successfully.",
      });

      setScreenState("success");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAccountDialog = (intent: "advance" | "submit") => {
    setAuthIntent(intent);
    setAccountOpen(true);
  };

  const handleContinue = () => {
    if (currentStep === 4) {
      if (isAuthenticated) {
        handleAuthenticatedSubmit();
      } else {
        openAccountDialog("submit");
      }
      return;
    }

    // Guests are asked to create an account right after the amount + ZIP step
    if (currentStep === 3 && !isAuthenticated) {
      openAccountDialog("advance");
      return;
    }

    if (currentStep < totalSteps) {
      setDirection("forward");
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection("backward");
      setCurrentStep(currentStep - 1);
    }
  };


  const goToStep = (step: number) => {
    setDirection(step > currentStep ? "forward" : "backward");
    setCurrentStep(step);
  };

  const handleGoogleAuth = async () => {
    markAgreement("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/recipient/dashboard`,
      },
    });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Helper function to create fundraiser for a user
  const createFundraiserForUser = async (userId: string) => {
    // Upload any media that hasn't reached storage yet (guest flow), keeping order
    const uploadedUrls: string[] = [];

    for (const item of media) {
      if (item.publicUrl) {
        uploadedUrls.push(item.publicUrl);
        continue;
      }
      try {
        const { publicUrl } = await uploadMediaFile(item.file, userId);
        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.error("Media upload error:", err);
        // Continue without this item rather than failing the whole submission
      }
    }

    const coverPhotoUrl = uploadedUrls[0] ?? null;


    const storeNames = stores.map((id) => findRetailer(id).name);
    const { data: fundraiserData, error: fundraiserError } = await insertFundraiser(
      {
        user_id: userId,
        title: title,
        story: story,
        category: category,
        beneficiary_type: beneficiaryType,
        monthly_goal: parseFloat(monthlyGoal),
        is_long_term: false,
        unique_slug: generateUniqueSlug(title),
        country: country,
        zip_code: zipCode,
        status: "active",
        cover_photo_url: coverPhotoUrl,
      },
      {
        help_categories: needs,
        preferred_brands: storeNames,
        similar_stores_ok: smartMatching,
        city: zip.status === "found" ? zip.city : null,
        state_code: zip.status === "found" ? zip.stateCode : null,
      },
    );

    if (fundraiserError) {
      console.error("Fundraiser creation error:", fundraiserError);
      throw fundraiserError;
    }

    // Keep a record that they confirmed the request and accepted the Terms when submitting.
    void recordAgreement(userId, "fundraiser-submit", fundraiserData.id);
    // Let Bing-powered search know a new request is live.
    pingSearchEngines((fundraiserData as { unique_slug?: string | null }).unique_slug);

    // Save the full gallery (cover first)
    if (uploadedUrls.length > 0) {
      const { error: imagesError } = await supabase.from("fundraiser_images").insert(
        uploadedUrls.map((url, index) => ({
          fundraiser_id: fundraiserData.id,
          image_url: url,
          display_order: index,
          is_primary: index === 0,
        }))
      );
      if (imagesError) console.error("Gallery save error:", imagesError);
    }


    // Also create the verification/application record for admin review
    await supabase.from("recipient_verifications").insert({
      user_id: userId,
      verification_type: beneficiaryType,
      notes: `Needs: ${needs.map(needLabel).join(", ")}. Stores: ${storeNames.join(", ")}${smartMatching ? " (other stores welcome)" : ""}. Goal: $${monthlyGoal} total. Location: ${place ?? zipCode}. Title: ${title}`,
      status: "pending",
    });

    return fundraiserData;
  };

  const handleAccountSubmit = async () => {
    preserveOnAuthRef.current = true;
    markAgreement("apply-account");
    await handleSendOTP();
  };

  const handleSendOTP = async () => {
    setIsSubmitting(true);
    
    try {
      // First check if email already exists
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-email-exists', {
        body: { email },
      });

      if (checkError) {
        console.error("Email check error:", checkError);
        // Continue anyway - will handle at signup
      } else if (checkData?.exists) {
        toast({
          title: "Account already exists",
          description: "Please sign in with your existing account to continue.",
        });
        setAccountOpen(false);
        setScreenState("signin-prompt");
        setIsSubmitting(false);
        return;
      }

      // Email doesn't exist, send OTP for new account
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email, purpose: 'signup' },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Verification code sent",
          description: `Check ${email} for your 6-digit code`,
        });
        setAccountOpen(false);
        setScreenState("otp");
      } else {
        throw new Error(data.error || "Failed to send verification code");
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPVerified = async () => {
    setIsSubmitting(true);

    try {
      // One generic account — both giving and receiving are enabled
      const { error: signUpError } = await signUp(
        email,
        password,
        fullName
      );


      if (signUpError) {
        // Check if it's a "user already exists" error
        if (signUpError.message?.includes('already registered') || 
            signUpError.message?.includes('already exists')) {
          toast({
            title: "Account already exists",
            description: "Please sign in with your existing account.",
          });
          setAccountOpen(false);
          setScreenState("signin-prompt");
          return;
        }
        throw signUpError;
      }

      // Sign in immediately after signup
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      // Get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Signed up mid-application: come straight back to the step they left
      if (authIntent === "advance") {
        setAccountOpen(false);
        setScreenState("form");
        setCurrentStep(3);
        setPassword("");
        toast({
          title: "You're signed in",
          description: "Everything you entered is saved — pick up where you left off.",
        });
        return;
      }

      if (currentUser) {
        const fundraiserData = await createFundraiserForUser(currentUser.id);
        setCreatedFundraiserId(fundraiserData.id);

        // Clear drafts after successful submission
        clearScopedDraft(currentUser.id);
        clearScopedDraft(null); // Also clear any anonymous draft
      }

      toast({
        title: "Application submitted!",
        description: "Your account has been created successfully.",
      });

      setScreenState("success");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
      setScreenState("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInAndContinue = async (signInPassword: string) => {
    setIsSubmitting(true);
    markAgreement("sign-in");
    preserveOnAuthRef.current = true;

    try {
      const { error } = await signIn(email, signInPassword);
      if (error) throw error;

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        // Ensure user has recipient role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert(
            { user_id: currentUser.id, role: 'recipient' as const },
            { onConflict: 'user_id,role' }
          );
        
        if (roleError) {
          console.error("Role upsert error:", roleError);
        }

        // Signed in mid-application: return to the step they left
        if (authIntent === "advance") {
          setAccountOpen(false);
          setScreenState("form");
          setCurrentStep(3);
          setPassword("");
          toast({
            title: "You're signed in",
            description: "Everything you entered is saved — pick up where you left off.",
          });
          return;
        }

        // Create the fundraiser for this existing user
        const fundraiserData = await createFundraiserForUser(currentUser.id);
        setCreatedFundraiserId(fundraiserData.id);

        // Clear drafts
        clearScopedDraft(currentUser.id);
        clearScopedDraft(null);

        toast({
          title: "Fundraiser created!",
          description: "Your fundraiser has been submitted successfully.",
        });

        setScreenState("success");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessContinue = () => {
    setScreenState("share");
  };

  const handleGoToDashboardWithShare = () => {
    if (createdFundraiserId) {
      navigate(`/fundraiser/${createdFundraiserId}?share=true`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoToDashboard = () => {
    if (createdFundraiserId) {
      navigate(`/fundraiser/${createdFundraiserId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const getStepConfig = (step: number) => stepConfig[step - 1] || stepConfig[0];

  const getContinueLabel = () => {
    if (currentStep === 4) return isSubmitting ? "Submitting" : "Submit request";
    return "Continue";
  };


  // Render OTP verification screen
  if (screenState === "otp") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <Suspense fallback={null}><OTPVerification
          email={email}
          onVerified={handleOTPVerified}
          onBack={() => setScreenState("form")}
        /></Suspense>
      </div>
    );
  }

  // Render sign-in prompt for existing users
  if (screenState === "signin-prompt") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <Suspense fallback={null}><SignInPrompt
          email={email}
          onSignIn={handleSignInAndContinue}
          onUseNewEmail={() => setScreenState("form")}
          isLoading={isSubmitting}
        /></Suspense>
      </div>
    );
  }

  // Render success screen
  if (screenState === "success") {
    return (
      <Suspense fallback={null}><SuccessScreen
        onComplete={handleSuccessContinue}
      /></Suspense>
    );
  }

  // Render share screen
  if (screenState === "share") {
    return (
      <Suspense fallback={null}><ShareScreen
        onGoToDashboard={handleGoToDashboardWithShare}
        onSkip={handleGoToDashboard}
      /></Suspense>
    );
  }

  const config = getStepConfig(currentStep);
  const reason = blockedReason();

  return (
    <>
      <SEO
        title="Ask for Help With Groceries, Bills and Essentials"
        description="Need help with groceries, medicine, rides or household basics? Start a free request in a few minutes. Donors give gift cards for the stores you choose."
        path="/apply"
        jsonLd={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Ask for help", path: "/apply" }])}
      />
      <ApplyLayout
        step={currentStep}
        reached={reached}
        onGoTo={(n) => { if (n < currentStep || reason === null) goToStep(n); }}
        headline={config.headline}
        subtext={config.subtext}
        showBack={currentStep > 1}
        continueDisabled={reason !== null}
        blockedReason={reason}
        busy={isSubmitting}
        onBack={handleBack}
        onContinue={handleContinue}
        direction={direction}
        continueLabel={getContinueLabel()}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        panel={
          <RequestPanel
            title={currentStep === 4 ? title : ""}
            beneficiaryType={beneficiaryType}
            needs={needs}
            stores={stores}
            goal={parseInt(monthlyGoal, 10) || 0}
            place={place ?? (zip.status === "unknown" ? `ZIP ${zipCode}` : null)}
            words={words}
            photos={media.filter((m) => m.kind !== "video").length}
            videos={media.filter((m) => m.kind === "video").length}
          />
        }
      >
        {currentStep === 1 && (
          <BasicsStep
            beneficiaryType={beneficiaryType}
            setBeneficiaryType={setBeneficiaryType}
            needs={needs}
            setNeeds={setNeeds}
            stores={stores}
            setStores={setStores}
            similarOk={smartMatching}
            setSimilarOk={setSmartMatching}
          />
        )}

        {currentStep === 2 && (
          <Suspense fallback={<div className="h-96" />}><StoryStep
            story={story}
            setStory={setStory}
            category={category}
            media={media}
            setMedia={setMedia}
            userId={user?.id ?? null}
          /></Suspense>
        )}

        {currentStep === 3 && (
          <GoalStep
            goalAmount={monthlyGoal}
            setGoalAmount={setMonthlyGoal}
            beneficiaryType={beneficiaryType}
            zipCode={zipCode}
            setZipCode={setZipCode}
            zip={zip}
          />
        )}

        {currentStep === 4 && (
          <Suspense fallback={<div className="h-96" />}><ReviewStep
            media={media}
            title={title}
            setTitle={setTitle}
            story={story}
            needs={needs}
            stores={stores}
            similarOk={smartMatching}
            beneficiaryType={beneficiaryType}
            goalAmount={monthlyGoal}
            zipCode={zipCode}
            place={place}
            onEditStory={() => goToStep(2)}
            onEditDetails={() => goToStep(1)}
            onEditLocation={() => goToStep(3)}
            confirmed={confirmed}
            setConfirmed={setConfirmed}
          /></Suspense>
        )}
      </ApplyLayout>

      {!isAuthenticated && (
        <Suspense fallback={null}><AccountDialog
          open={accountOpen}
          onOpenChange={(open) => {
            setAccountOpen(open);
            if (!open && authIntent === "advance" && currentStep === 3) {
              // Dismissed — let them keep going as a guest
              setDirection("forward");
              setCurrentStep(4);
            }
          }}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          onGoogleAuth={handleGoogleAuth}
          onSubmit={handleAccountSubmit}
          isLoading={isSubmitting}
          intent={authIntent}
          goalAmount={monthlyGoal}
          title={title}
        /></Suspense>
      )}

      {/* ShareModal removed - now handled by FundraiserDashboard */}
    </>
  );
};

export default ApplyRecipient;
