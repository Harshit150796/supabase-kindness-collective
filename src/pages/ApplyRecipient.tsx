import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ApplyLayout } from "@/components/apply/ApplyLayout";
import { LocationCategoryStep } from "@/components/apply/steps/LocationCategoryStep";
import { BeneficiaryStep } from "@/components/apply/steps/BeneficiaryStep";
import { GoalStep } from "@/components/apply/steps/GoalStep";
import { MediaStep } from "@/components/apply/steps/MediaStep";
import { StoryStep } from "@/components/apply/steps/StoryStep";
import { TitleStep } from "@/components/apply/steps/TitleStep";
import { ReviewStep } from "@/components/apply/steps/ReviewStep";
import { AccountStep } from "@/components/apply/steps/AccountStep";
import { SuccessScreen } from "@/components/apply/SuccessScreen";
import { ShareScreen } from "@/components/apply/ShareScreen";
import { ShareModal } from "@/components/apply/ShareModal";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ApplicationData {
  country: string;
  zipCode: string;
  category: string;
  beneficiaryType: string;
  monthlyGoal: string;
  smartMatching: boolean;
  coverPhoto: File | null;
  coverPhotoPreview: string;
  story: string;
  isLongTerm: boolean | null;
  title: string;
  titleSource: "suggested" | "custom";
}

const STORAGE_KEY = "recipient_application_data";

const loadFromStorage = (): Omit<ApplicationData, "coverPhoto"> => {
  const defaults = {
    country: "us",
    zipCode: "",
    category: "",
    beneficiaryType: "",
    monthlyGoal: "",
    smartMatching: true,
    coverPhotoPreview: "",
    story: "",
    isLongTerm: null,
    title: "",
    titleSource: "suggested" as const,
  };
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all string values are never undefined
      return {
        ...defaults,
        ...parsed,
        story: parsed.story || "",
        title: parsed.title || "",
        country: parsed.country || "us",
        zipCode: parsed.zipCode || "",
        category: parsed.category || "",
        beneficiaryType: parsed.beneficiaryType || "",
        monthlyGoal: parsed.monthlyGoal || "",
        coverPhotoPreview: parsed.coverPhotoPreview || "",
        titleSource: parsed.titleSource || "suggested",
      };
    }
  } catch (e) {
    console.error("Failed to load application data from storage");
  }
  return defaults;
};

const saveToStorage = (data: Omit<ApplicationData, "coverPhoto">) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save application data to storage");
  }
};

const stepConfig = [
  {
    headline: "Let's begin your coupon assistance journey",
    subtext: "We're here to guide you every step of the way.",
  },
  {
    headline: "Tell us who needs the coupons",
    subtext: "This helps us understand your needs better and personalize your experience.",
  },
  {
    headline: "Set your monthly goal",
    subtext: "Tell us how much assistance you need each month.",
  },
  {
    headline: "Add media",
    subtext: "Using a bright and clear photo helps donors connect to your story right away.",
  },
  {
    headline: "Tell donors your story",
    subtext: "",
  },
  {
    headline: "Give your request a title",
    subtext: "We've created a few titles from your story. Select one or write your own.",
  },
  {
    headline: "Review your request",
    subtext: "Let's make sure your request is complete.",
  },
  {
    headline: "Create your account",
    subtext: "Set up your account to submit your request.",
  },
];

type ScreenState = "form" | "otp" | "success" | "share";

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
  const { user, signUp, signIn } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>("form");
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdFundraiserId, setCreatedFundraiserId] = useState<string | null>(null);

  // Form state
  const [country, setCountry] = useState("us");
  const [zipCode, setZipCode] = useState("");
  const [category, setCategory] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [smartMatching, setSmartMatching] = useState(true);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState("");
  const [story, setStory] = useState("");
  const [isLongTerm, setIsLongTerm] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [titleSource, setTitleSource] = useState<"suggested" | "custom">("suggested");

  // Account step state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Load saved data on mount
  useEffect(() => {
    const saved = loadFromStorage();
    setCountry(saved.country);
    setZipCode(saved.zipCode);
    setCategory(saved.category);
    setBeneficiaryType(saved.beneficiaryType);
    setMonthlyGoal(saved.monthlyGoal);
    setSmartMatching(saved.smartMatching);
    setCoverPhotoPreview(saved.coverPhotoPreview);
    setStory(saved.story);
    setIsLongTerm(saved.isLongTerm);
    setTitle(saved.title);
    setTitleSource(saved.titleSource);
  }, []);

  // Save to storage when data changes
  useEffect(() => {
    saveToStorage({
      country,
      zipCode,
      category,
      beneficiaryType,
      monthlyGoal,
      smartMatching,
      coverPhotoPreview,
      story,
      isLongTerm,
      title,
      titleSource,
    });
  }, [country, zipCode, category, beneficiaryType, monthlyGoal, smartMatching, coverPhotoPreview, story, isLongTerm, title, titleSource]);

  const totalSteps = 8;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return country && zipCode && category;
      case 2:
        return beneficiaryType;
      case 3:
        return monthlyGoal && parseInt(monthlyGoal) > 0;
      case 4:
        return true; // Media is optional
      case 5:
        // Add null check before calling trim()
        const storyText = story || "";
        return storyText.trim().split(/\s+/).filter(Boolean).length >= 20;
      case 6:
        // Add null check before calling trim()
        const titleText = title || "";
        return titleText.trim().length > 0;
      case 7:
        return true; // Review step
      case 8:
        return email && password.length >= 8 && fullName;
      default:
        return false;
    }
  };

  const handleContinue = () => {
    if (currentStep < 8) {
      setDirection("forward");
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 8) {
      handleSendOTP();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection("backward");
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      // Skip media step
      setDirection("forward");
      setCurrentStep(5);
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

  const handleSendOTP = async () => {
    setIsSubmitting(true);
    
    try {
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
      const { error: signUpError, user: newUser } = await signUp(
        email,
        password,
        fullName,
        'recipient', // Primary role
        ['donor']    // Additional role - user can also donate
      );

      if (signUpError) throw signUpError;

      // Sign in immediately after signup
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      // Get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        // Create the fundraiser record in the new fundraisers table
        const { data: fundraiserData, error: fundraiserError } = await supabase
          .from("fundraisers")
          .insert({
            user_id: currentUser.id,
            title: title,
            story: story,
            category: category,
            beneficiary_type: beneficiaryType,
            monthly_goal: parseFloat(monthlyGoal),
            is_long_term: isLongTerm || false,
            unique_slug: generateUniqueSlug(title),
            country: country,
            zip_code: zipCode,
            status: "pending",
          })
          .select()
          .single();

        if (fundraiserError) {
          console.error("Fundraiser creation error:", fundraiserError);
        } else if (fundraiserData) {
          setCreatedFundraiserId(fundraiserData.id);
        }

        // Also create the verification/application record for admin review
        const { error: verificationError } = await supabase
          .from("recipient_verifications")
          .insert({
            user_id: currentUser.id,
            verification_type: beneficiaryType,
            notes: `Category: ${category}, Monthly goal: $${monthlyGoal}, Smart matching: ${smartMatching}, Title: ${title}, Long-term: ${isLongTerm}`,
            status: "pending",
          });

        if (verificationError) {
          console.error("Verification creation error:", verificationError);
        }
      }

      localStorage.removeItem(STORAGE_KEY);

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
      setScreenState("form"); // Go back to form on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackFromOTP = () => {
    setScreenState("form");
  };

  const handleSuccessComplete = () => {
    setScreenState("share");
  };

  const handleShareComplete = () => {
    // Navigate to the fundraiser dashboard if we have an ID, otherwise my-fundraisers
    if (createdFundraiserId) {
      navigate(`/fundraiser/${createdFundraiserId}`);
    } else {
      navigate("/my-fundraisers");
    }
  };

  // Render OTP verification screen
  if (screenState === "otp") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <OTPVerification
            email={email}
            onVerified={handleOTPVerified}
            onBack={handleBackFromOTP}
          />
        </div>
      </div>
    );
  }

  // Render success screen
  if (screenState === "success") {
    return <SuccessScreen onComplete={handleSuccessComplete} />;
  }

  // Render share screen
  if (screenState === "share") {
    const shareUrl = createdFundraiserId 
      ? `${window.location.origin}/fundraiser/${createdFundraiserId}`
      : `${window.location.origin}/my-fundraisers`;
    
    return (
      <>
        <ShareScreen
          onShare={() => setShowShareModal(true)}
          onSkip={handleShareComplete}
        />
        <ShareModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
          title={title || "My Coupon Request"}
        />
      </>
    );
  }

  const config = stepConfig[currentStep - 1];
  const isMediaStep = currentStep === 4;
  const isReviewStep = currentStep === 7;

  return (
    <ApplyLayout
      step={currentStep}
      totalSteps={totalSteps}
      headline={config.headline}
      subtext={config.subtext}
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!canContinue() || isSubmitting}
      continueLabel={currentStep === 8 ? (isSubmitting ? "Sending code..." : "Continue") : "Continue"}
      showBack={currentStep > 1}
      progress={progress}
      direction={direction}
      showSkip={isMediaStep}
      onSkip={handleSkip}
      hideStepIndicator={isReviewStep}
    >
      {currentStep === 1 && (
        <LocationCategoryStep
          country={country}
          setCountry={setCountry}
          zipCode={zipCode}
          setZipCode={setZipCode}
          category={category}
          setCategory={setCategory}
        />
      )}

      {currentStep === 2 && (
        <BeneficiaryStep
          beneficiaryType={beneficiaryType}
          setBeneficiaryType={setBeneficiaryType}
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
        <MediaStep
          coverPhoto={coverPhoto}
          setCoverPhoto={setCoverPhoto}
          coverPhotoPreview={coverPhotoPreview}
          setCoverPhotoPreview={setCoverPhotoPreview}
        />
      )}

      {currentStep === 5 && (
        <StoryStep
          story={story}
          setStory={setStory}
          isLongTerm={isLongTerm}
          setIsLongTerm={setIsLongTerm}
          category={category}
        />
      )}

      {currentStep === 6 && (
        <TitleStep
          title={title}
          setTitle={setTitle}
          titleSource={titleSource}
          setTitleSource={setTitleSource}
          category={category}
        />
      )}

      {currentStep === 7 && (
        <ReviewStep
          coverPhotoPreview={coverPhotoPreview}
          title={title}
          story={story}
          category={category}
          beneficiaryType={beneficiaryType}
          monthlyGoal={monthlyGoal}
          onEditMedia={() => goToStep(4)}
          onEditTitle={() => goToStep(6)}
          onEditStory={() => goToStep(5)}
          onEditDetails={() => goToStep(1)}
        />
      )}

      {currentStep === 8 && (
        <AccountStep
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          onGoogleAuth={handleGoogleAuth}
          isLoading={isSubmitting}
        />
      )}
    </ApplyLayout>
  );
};

export default ApplyRecipient;