import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ApplyLayout } from "@/components/apply/ApplyLayout";
import { LocationCategoryStep } from "@/components/apply/steps/LocationCategoryStep";
import { BeneficiaryStep } from "@/components/apply/steps/BeneficiaryStep";
import { GoalStep } from "@/components/apply/steps/GoalStep";
import { AuthModal } from "@/components/apply/AuthModal";
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
}

const STORAGE_KEY = "recipient_application_data";

const loadFromStorage = (): ApplicationData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load application data from storage");
  }
  return {
    country: "us",
    zipCode: "",
    category: "",
    beneficiaryType: "",
    monthlyGoal: "",
    smartMatching: true,
  };
};

const saveToStorage = (data: ApplicationData) => {
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
    subtext: "This information helps us understand your needs better.",
  },
  {
    headline: "Tell us how much you need monthly",
    subtext: "Set a goal that matches your needs.",
  },
];

const ApplyRecipient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [country, setCountry] = useState("us");
  const [zipCode, setZipCode] = useState("");
  const [category, setCategory] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [smartMatching, setSmartMatching] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    const saved = loadFromStorage();
    setCountry(saved.country);
    setZipCode(saved.zipCode);
    setCategory(saved.category);
    setBeneficiaryType(saved.beneficiaryType);
    setMonthlyGoal(saved.monthlyGoal);
    setSmartMatching(saved.smartMatching);
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
    });
  }, [country, zipCode, category, beneficiaryType, monthlyGoal, smartMatching]);

  const totalSteps = 4;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return country && zipCode && category;
      case 2:
        return beneficiaryType;
      case 3:
        return monthlyGoal && parseInt(monthlyGoal) > 0;
      default:
        return false;
    }
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      // Show auth modal
      setShowAuthModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAuthSubmit = async (email: string, password: string, fullName: string) => {
    setIsSubmitting(true);

    try {
      // Create account with recipient role
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: "recipient",
          },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // Add recipient role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: signUpData.user.id,
          role: "recipient",
        });

        if (roleError) {
          console.error("Role creation error:", roleError);
        }

        // Create recipient application/verification record
        const { error: verificationError } = await supabase
          .from("recipient_verifications")
          .insert({
            user_id: signUpData.user.id,
            verification_type: beneficiaryType,
            notes: `Category: ${category}, Monthly goal: $${monthlyGoal}, Smart matching: ${smartMatching}`,
            status: "pending",
          });

        if (verificationError) {
          console.error("Verification creation error:", verificationError);
        }

        // Clear storage
        localStorage.removeItem(STORAGE_KEY);

        toast({
          title: "Application submitted!",
          description: "Please check your email to verify your account.",
        });

        setShowAuthModal(false);
        navigate("/auth");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = stepConfig[currentStep - 1];

  return (
    <>
      <ApplyLayout
        step={currentStep}
        totalSteps={totalSteps}
        headline={config.headline}
        subtext={config.subtext}
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!canContinue()}
        showBack={currentStep > 1}
        progress={progress}
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
      </ApplyLayout>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onContinue={handleAuthSubmit}
        loading={isSubmitting}
      />
    </>
  );
};

export default ApplyRecipient;
