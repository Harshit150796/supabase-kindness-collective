import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { StepProgress } from '@/components/apply/StepProgress';
import { PersonalInfoStep, PersonalInfoData } from '@/components/apply/PersonalInfoStep';
import { StoryStep, StoryData } from '@/components/apply/StoryStep';
import { ChoosePathStep, ApplicationPath } from '@/components/apply/ChoosePathStep';
import { CampaignStep, CampaignData } from '@/components/apply/CampaignStep';
import { CreateAccountStep, AccountData } from '@/components/apply/CreateAccountStep';
import { ApplicationSuccess } from '@/components/apply/ApplicationSuccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApplicationData {
  personalInfo?: PersonalInfoData;
  story?: StoryData;
  applicationPath?: ApplicationPath;
  campaign?: CampaignData;
}

const STORAGE_KEY = 'recipient_application_draft';

const Apply = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Determine total steps based on path selection
  const isFundraiser = applicationData.applicationPath === 'fundraiser';
  const totalSteps = isFundraiser ? 5 : 4;
  
  const steps = isFundraiser
    ? ['Personal Info', 'Your Story', 'Choose Path', 'Campaign', 'Account']
    : ['Personal Info', 'Your Story', 'Choose Path', 'Account'];

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setApplicationData(parsed);
      } catch (e) {
        console.error('Failed to parse saved application draft');
      }
    }
  }, []);

  // Save draft on data change
  useEffect(() => {
    if (Object.keys(applicationData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applicationData));
    }
  }, [applicationData]);

  const handlePersonalInfoNext = (data: PersonalInfoData) => {
    setApplicationData(prev => ({ ...prev, personalInfo: data }));
    setCurrentStep(2);
  };

  const handleStoryNext = (data: StoryData) => {
    setApplicationData(prev => ({ ...prev, story: data }));
    setCurrentStep(3);
  };

  const handlePathNext = (path: ApplicationPath) => {
    setApplicationData(prev => ({ ...prev, applicationPath: path }));
    if (path === 'fundraiser') {
      setCurrentStep(4);
    } else {
      // Skip campaign step for coupons path
      setCurrentStep(4); // Account step is 4 for coupons path
    }
  };

  const handleCampaignNext = (data: CampaignData) => {
    setApplicationData(prev => ({ ...prev, campaign: data }));
    setCurrentStep(5);
  };

  const handleAccountSubmit = async (data: AccountData) => {
    if (!applicationData.personalInfo || !applicationData.story || !applicationData.applicationPath) {
      toast.error('Missing application data. Please start over.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert application into database
      const { error } = await supabase
        .from('recipient_applications')
        .insert({
          full_name: applicationData.personalInfo.fullName,
          email: applicationData.personalInfo.email,
          phone: applicationData.personalInfo.phone || null,
          city: applicationData.personalInfo.city,
          country: applicationData.personalInfo.country,
          household_size: parseInt(applicationData.personalInfo.householdSize.replace('+', '')) || null,
          assistance_type: applicationData.story.assistanceType,
          story: applicationData.story.story,
          referral_source: applicationData.story.referralSource || null,
          application_type: applicationData.applicationPath,
          campaign_title: applicationData.campaign?.campaignTitle || null,
          funding_goal: applicationData.campaign?.fundingGoal || null,
          password_hash: data.password, // Will be hashed when creating actual account
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('An application with this email already exists.');
        } else {
          throw error;
        }
        return;
      }

      // Clear saved draft
      localStorage.removeItem(STORAGE_KEY);
      
      // Show success
      setIsComplete(true);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 5 && !isFundraiser) {
      // This shouldn't happen, but handle it
      setCurrentStep(3);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Determine which step component to render
  const renderStep = () => {
    if (isComplete) {
      return (
        <ApplicationSuccess 
          email={applicationData.personalInfo?.email || ''} 
          applicationType={applicationData.applicationPath || 'coupons'}
        />
      );
    }

    // For coupons path, step 4 is account creation
    // For fundraiser path, step 4 is campaign, step 5 is account
    const isAccountStep = isFundraiser ? currentStep === 5 : currentStep === 4;
    const isCampaignStep = isFundraiser && currentStep === 4;

    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            defaultValues={applicationData.personalInfo}
            onNext={handlePersonalInfoNext}
          />
        );
      case 2:
        return (
          <StoryStep
            defaultValues={applicationData.story}
            onNext={handleStoryNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <ChoosePathStep
            defaultValue={applicationData.applicationPath}
            onNext={handlePathNext}
            onBack={handleBack}
          />
        );
      case 4:
        if (isFundraiser) {
          return (
            <CampaignStep
              defaultValues={applicationData.campaign}
              applicantName={applicationData.personalInfo?.fullName || 'Guest'}
              onNext={handleCampaignNext}
              onBack={handleBack}
            />
          );
        }
        // Coupons path - account step
        return (
          <CreateAccountStep
            email={applicationData.personalInfo?.email || ''}
            isSubmitting={isSubmitting}
            onSubmit={handleAccountSubmit}
            onBack={handleBack}
          />
        );
      case 5:
        // Only fundraiser path reaches step 5
        return (
          <CreateAccountStep
            email={applicationData.personalInfo?.email || ''}
            isSubmitting={isSubmitting}
            onSubmit={handleAccountSubmit}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {!isComplete && (
              <StepProgress
                currentStep={currentStep}
                totalSteps={totalSteps}
                steps={steps}
              />
            )}
            
            <Card className="p-6 md:p-10">
              {renderStep()}
            </Card>

            {/* Trust indicators */}
            {!isComplete && (
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-primary">🔒</span>
                  <span>Secure & Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>15,000+ Families Helped</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">❤️</span>
                  <span>100% Goes to Recipients</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;
