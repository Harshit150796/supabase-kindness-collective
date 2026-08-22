import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ApplyLayout } from "@/components/apply/ApplyLayout";
import { BasicsStep } from "@/components/apply/steps/BasicsStep";
import { GoalStep } from "@/components/apply/steps/GoalStep";
import { StoryStep } from "@/components/apply/steps/StoryStep";
import { ReviewStep } from "@/components/apply/steps/ReviewStep";
import { AccountStep } from "@/components/apply/steps/AccountStep";
import { SuccessScreen } from "@/components/apply/SuccessScreen";
import { ShareScreen } from "@/components/apply/ShareScreen";

import { SignInPrompt } from "@/components/apply/SignInPrompt";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useZipLocation } from "@/lib/zipLookup";
import { MediaItem, uploadMediaFile } from "@/lib/mediaUpload";
import {
  saveScopedDraft,
  loadScopedDraft,
  clearScopedDraft,
} from "@/lib/draftStorage";


interface ApplicationData {
  country: string;
  zipCode: string;
  category: string;
  beneficiaryType: string;
  monthlyGoal: string;
  smartMatching: boolean;
  media: MediaItem[];

  story: string;
  isLongTerm: boolean | null;
  title: string;
  titleSource: "suggested" | "custom";
}

const getDefaults = (): Omit<ApplicationData, "media"> => ({
  country: "us",
  zipCode: "",
  category: "",
  beneficiaryType: "",
  monthlyGoal: "",
  smartMatching: true,

  story: "",
  isLongTerm: null,
  title: "",
  titleSource: "suggested" as const,
});

const stepConfig = [
  {
    headline: "Who are we helping?",
    subtext: "Two quick taps — no typing yet. The whole application takes about 3 minutes.",
  },
  {
    headline: "Tell donors your story",
    subtext: "A few sentences about your situation, plus a photo or short video so donors can connect.",
  },
  {
    headline: "How much do you need each month?",
    subtext: "Pick an amount that covers your monthly essentials.",
  },
  {
    headline: "Last details, then you're done",
    subtext: "Your ZIP code, a title, and a quick look at everything you've written.",
  },
  {
    headline: "Create your account",
    subtext: "Set up your account to submit your request.",
  },
];



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

  // Determine if user is already authenticated
  const isAuthenticated = !!user && !authLoading;
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];

  // Dynamic total steps: 4 for authenticated users (skip account creation), 5 for guests
  const totalSteps = isAuthenticated ? 4 : 5;


  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>("form");
  
  const [createdFundraiserId, setCreatedFundraiserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Form state
  const [country, setCountry] = useState("us");
  const [zipCode, setZipCode] = useState("");
  const [category, setCategory] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [smartMatching, setSmartMatching] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const [story, setStory] = useState("");
  const [isLongTerm, setIsLongTerm] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [titleSource, setTitleSource] = useState<"suggested" | "custom">("suggested");

  // Account step state (only used for non-authenticated users)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Reset form to defaults
  const resetForm = () => {
    const defaults = getDefaults();
    setCountry(defaults.country);
    setZipCode(defaults.zipCode);
    setCategory(defaults.category);
    setBeneficiaryType(defaults.beneficiaryType);
    setMonthlyGoal(defaults.monthlyGoal);
    setSmartMatching(defaults.smartMatching);
    setMedia([]);
    setStory(defaults.story);
    setIsLongTerm(defaults.isLongTerm);
    setTitle(defaults.title);
    setTitleSource(defaults.titleSource);
    setCurrentStep(1);
  };

  // Load saved data on mount and when user changes
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) return;

    const currentUserId = user?.id ?? null;

    // Detect user change (including logout)
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentUserId) {
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
      setCategory((saved.category as string) || "");
      setBeneficiaryType((saved.beneficiaryType as string) || "");
      setMonthlyGoal((saved.monthlyGoal as string) || "");
      setSmartMatching(saved.smartMatching !== false);
      // Don't restore media for security - user must re-attach photos
      setStory((saved.story as string) || "");
      setIsLongTerm(saved.isLongTerm as boolean | null);
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
      beneficiaryType,
      monthlyGoal,
      smartMatching,
      story,
      isLongTerm,
      title,
      titleSource,
    });
  }, [
    initialized,
    user?.id,
    country,
    zipCode,
    category,
    beneficiaryType,
    monthlyGoal,
    smartMatching,
    story,
    isLongTerm,
    title,
    titleSource,
  ]);

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const locationLabel = useZipLocation(zipCode, "us");

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return !!beneficiaryType && !!category;
      case 2: {
        const storyText = story || "";
        const enoughWords = storyText.trim().split(/\s+/).filter(Boolean).length >= 10;
        return (
          enoughWords &&
          media.length > 0 &&
          !media.some((m) => m.status === "uploading") &&
          media.some((m) => m.status === "done" || m.status === "ready")
        );
      }
      case 3:
        return monthlyGoal && parseInt(monthlyGoal) > 0;
      case 4:
        // Review step - also final step for authenticated users
        return /^\d{5}$/.test(zipCode) && (title || "").trim().length > 0;
      case 5:
        // Only reached by non-authenticated users
        return email && password.length >= 8 && fullName;
      default:
        return false;
    }
  };



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

  const handleContinue = () => {
    // For authenticated users, step 4 (review) is the final step - submit directly
    if (isAuthenticated && currentStep === 4) {
      handleAuthenticatedSubmit();
      return;
    }

    if (currentStep < totalSteps) {
      setDirection("forward");
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5 && !isAuthenticated) {
      handleSendOTP();
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


    const { data: fundraiserData, error: fundraiserError } = await supabase
      .from("fundraisers")
      .insert({
        user_id: userId,
        title: title,
        story: story,
        category: category,
        beneficiary_type: beneficiaryType,
        monthly_goal: parseFloat(monthlyGoal),
        is_long_term: isLongTerm || false,
        unique_slug: generateUniqueSlug(title),
        country: country,
        zip_code: zipCode,
        status: "active",
        cover_photo_url: coverPhotoUrl,
      })
      .select()
      .single();

    if (fundraiserError) {
      console.error("Fundraiser creation error:", fundraiserError);
      throw fundraiserError;
    }

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
      notes: `Category: ${category}, Monthly goal: $${monthlyGoal}, Smart matching: ${smartMatching}, Title: ${title}, Long-term: ${isLongTerm}`,
      status: "pending",
    });

    return fundraiserData;
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
        setScreenState("signin-prompt");
        setIsSubmitting(false);
        return;
      }

      // Email doesn't exist, send OTP for new account
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Verification code sent",
          description: `Check ${email} for your 6-digit code`,
        });
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
      // Use the unified signUp from useAuth with BOTH roles
      const { error: signUpError } = await signUp(
        email,
        password,
        fullName,
        'recipient',
        ['donor']
      );

      if (signUpError) {
        // Check if it's a "user already exists" error
        if (signUpError.message?.includes('already registered') || 
            signUpError.message?.includes('already exists')) {
          toast({
            title: "Account already exists",
            description: "Please sign in with your existing account.",
          });
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
      navigate("/recipient/dashboard");
    }
  };

  const handleGoToDashboard = () => {
    if (createdFundraiserId) {
      navigate(`/fundraiser/${createdFundraiserId}`);
    } else {
      navigate("/recipient/dashboard");
    }
  };

  // Get step config based on current step (adjust headline for authenticated users on review step)
  const getStepConfig = (step: number) => {
    if (isAuthenticated && step === 4) {
      return {
        headline: "Review and submit your request",
        subtext: "Let's make sure your request is complete.",
      };
    }
    return stepConfig[step - 1] || stepConfig[0];
  };

  const getContinueLabel = () => {
    if (isAuthenticated && currentStep === 4) {
      return isSubmitting ? "Submitting..." : "Submit Fundraiser";
    }
    if (currentStep === 5) {
      return isSubmitting ? "Sending code..." : "Continue";
    }
    return "Continue";
  };


  // Render OTP verification screen
  if (screenState === "otp") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <OTPVerification
          email={email}
          onVerified={handleOTPVerified}
          onBack={() => setScreenState("form")}
        />
      </div>
    );
  }

  // Render sign-in prompt for existing users
  if (screenState === "signin-prompt") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <SignInPrompt
          email={email}
          onSignIn={handleSignInAndContinue}
          onUseNewEmail={() => setScreenState("form")}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  // Render success screen
  if (screenState === "success") {
    return (
      <SuccessScreen
        onComplete={handleSuccessContinue}
      />
    );
  }

  // Render share screen
  if (screenState === "share") {
    return (
      <ShareScreen
        onGoToDashboard={handleGoToDashboardWithShare}
        onSkip={handleGoToDashboard}
      />
    );
  }

  const config = getStepConfig(currentStep);

  return (
    <>
      <ApplyLayout
        step={currentStep}
        totalSteps={totalSteps}
        headline={config.headline}
        subtext={config.subtext}
        showBack={currentStep > 1}
        continueDisabled={!canContinue()}
        onBack={handleBack}
        onContinue={handleContinue}
        progress={progress}
        continueLabel={getContinueLabel()}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
      >
        {currentStep === 1 && (
          <BasicsStep
            category={category}
            setCategory={setCategory}
            beneficiaryType={beneficiaryType}
            setBeneficiaryType={setBeneficiaryType}
          />
        )}

        {currentStep === 2 && (
          <StoryStep
            story={story}
            setStory={setStory}
            isLongTerm={isLongTerm}
            setIsLongTerm={setIsLongTerm}
            category={category}
            media={media}
            setMedia={setMedia}
            userId={user?.id ?? null}
          />
        )}

        {currentStep === 3 && (
          <GoalStep
            monthlyGoal={monthlyGoal}
            setMonthlyGoal={setMonthlyGoal}
            smartMatching={smartMatching}
            setSmartMatching={setSmartMatching}
            category={category}
          />
        )}

        {currentStep === 4 && (
          <ReviewStep
            media={media}
            title={title}
            setTitle={setTitle}
            story={story}
            category={category}
            beneficiaryType={beneficiaryType}
            monthlyGoal={monthlyGoal}
            zipCode={zipCode}
            setZipCode={setZipCode}
            locationLabel={locationLabel}
            onEditStory={() => goToStep(2)}
            onEditDetails={() => goToStep(1)}
          />
        )}



        {currentStep === 5 && !isAuthenticated && (
          <AccountStep
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            fullName={fullName}
            setFullName={setFullName}
            onGoogleAuth={handleGoogleAuth}
          />
        )}

      </ApplyLayout>

      {/* ShareModal removed - now handled by FundraiserDashboard */}
    </>
  );
};

export default ApplyRecipient;
