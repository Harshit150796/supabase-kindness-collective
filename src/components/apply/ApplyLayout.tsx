import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { ArrowLeft } from "lucide-react";

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
  direction?: "forward" | "backward";
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
  direction = "forward",
}: ApplyLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in">
      {/* Left Panel - Info Section with gradient and decorative elements */}
      <div className="lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/80 to-primary/5 p-6 lg:p-10 flex flex-col">
        {/* Decorative floating shapes */}
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-primary/5 float-slow" />
        <div className="absolute bottom-32 left-5 w-24 h-24 rounded-full bg-accent/10 float-slow-reverse" />
        <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-2xl" />
        <div className="absolute bottom-20 right-20 w-16 h-16 rounded-xl bg-primary/5 rotate-12 float-slow" />
        
        {/* Subtle dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="flex-1 relative z-10 stagger-children">
          {/* Logo */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 mb-10 lg:mb-14 group hover-lift"
          >
            <div className="relative">
              <img src={logo} alt="CouponDonation" className="w-11 h-11 transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold text-xl text-foreground">CouponDonation</span>
          </Link>

          {/* Step Indicator with animation */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold animate-scale-in">
              {step}
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              of {totalSteps}
            </p>
          </div>

          {/* Headline with gradient text option */}
          <h1 
            key={headline}
            className={`text-3xl lg:text-[2.5rem] font-bold text-foreground leading-tight mb-4 ${
              direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"
            }`}
          >
            {headline}
          </h1>

          {/* Subtext with fade animation */}
          {subtext && (
            <p 
              key={subtext}
              className={`text-muted-foreground text-lg leading-relaxed ${
                direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"
              }`}
              style={{ animationDelay: "0.1s" }}
            >
              {subtext}
            </p>
          )}
        </div>

        {/* Progress Bar - Desktop - Enhanced */}
        <div className="hidden lg:block mt-8 relative z-10">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-border/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-primary to-emerald-light rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Glowing edge */}
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="lg:w-[58%] bg-card flex flex-col min-h-[60vh] lg:min-h-screen shadow-[-10px_0_40px_-15px_rgba(0,0,0,0.05)]">
        {/* Sign In Link */}
        <div className="p-6 lg:p-10 flex justify-end">
          <Link 
            to="/auth" 
            className="text-primary hover:text-primary/80 font-medium transition-all hover:translate-x-1 inline-flex items-center gap-1"
          >
            Sign in
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Form Content with animation */}
        <div 
          key={step}
          className={`flex-1 px-6 lg:px-12 pb-6 ${
            direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`}
        >
          {children}
        </div>

        {/* Navigation Buttons - Enhanced */}
        <div className="p-6 lg:px-12 lg:py-8 border-t border-border/50 flex items-center justify-between bg-gradient-to-t from-secondary/30 to-transparent">
          <div>
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="w-12 h-12 rounded-xl border border-border/80 flex items-center justify-center hover:bg-secondary/80 hover:border-primary/30 transition-all duration-200 group press-effect"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}
          </div>
          
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className="bg-primary text-primary-foreground font-semibold px-10 py-3.5 rounded-full hover:bg-primary/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 press-effect"
          >
            {continueLabel}
          </button>
        </div>

        {/* Progress Bar - Mobile - Enhanced */}
        <div className="lg:hidden px-6 pb-6">
          <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-emerald-light rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
