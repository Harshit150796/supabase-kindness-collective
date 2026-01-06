import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface ApplyLayoutProps {
  step: number;
  totalSteps: number;
  headline: string;
  subtext?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  showBack?: boolean;
  progress: number;
}

export const ApplyLayout = ({
  step,
  totalSteps,
  headline,
  subtext,
  children,
  onBack,
  onContinue,
  continueDisabled = false,
  continueLabel = "Continue",
  showBack = true,
  progress,
}: ApplyLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Info Section */}
      <div className="lg:w-[40%] bg-secondary/50 p-6 lg:p-10 flex flex-col">
        <div className="flex-1">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8 lg:mb-12">
            <img src={logo} alt="CouponDonation" className="w-10 h-10" />
            <span className="font-bold text-xl text-foreground">CouponDonation</span>
          </Link>

          {/* Step Indicator */}
          <p className="text-muted-foreground text-sm mb-4">
            {step} of {totalSteps}
          </p>

          {/* Headline */}
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
            {headline}
          </h1>

          {/* Subtext */}
          {subtext && (
            <p className="text-muted-foreground text-lg">
              {subtext}
            </p>
          )}
        </div>

        {/* Progress Bar - Desktop */}
        <div className="hidden lg:block mt-8">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="lg:w-[60%] bg-card flex flex-col min-h-[60vh] lg:min-h-screen">
        {/* Sign In Link */}
        <div className="p-6 lg:p-10 flex justify-end">
          <Link 
            to="/auth" 
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Form Content */}
        <div className="flex-1 px-6 lg:px-10 pb-6">
          {children}
        </div>

        {/* Navigation Buttons */}
        <div className="p-6 lg:p-10 border-t border-border flex items-center justify-between">
          <div>
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="w-12 h-12 rounded-lg border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors"
                aria-label="Go back"
              >
                <svg 
                  className="w-5 h-5 text-foreground" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {continueLabel}
          </button>
        </div>

        {/* Progress Bar - Mobile */}
        <div className="lg:hidden px-6 pb-6">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
