import { useEffect, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  onComplete: () => void;
}

export const SuccessScreen = ({ onComplete }: SuccessScreenProps) => {
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Stagger the animations
    const checkTimer = setTimeout(() => setShowCheckmark(true), 200);
    const textTimer = setTimeout(() => setShowText(true), 700);
    const buttonTimer = setTimeout(() => setShowButton(true), 1200);
    
    // Auto-advance after 3.5 seconds (gives time for button to appear)
    const completeTimer = setTimeout(() => {
      try {
        onComplete();
      } catch (error) {
        console.error("Error in onComplete:", error);
      }
    }, 3500);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(textTimer);
      clearTimeout(buttonTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleContinue = () => {
    try {
      onComplete();
    } catch (error) {
      console.error("Error in manual continue:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center">
        {/* Animated checkmark circle */}
        <div 
          className={`
            relative w-28 h-28 rounded-full bg-primary flex items-center justify-center
            transition-all duration-500 ease-out
            ${showCheckmark 
              ? "scale-100 opacity-100" 
              : "scale-50 opacity-0"
            }
          `}
        >
          {/* Outer ring animation */}
          <div 
            className={`
              absolute inset-0 rounded-full border-4 border-primary/30
              transition-all duration-700 ease-out
              ${showCheckmark ? "scale-150 opacity-0" : "scale-100 opacity-100"}
            `}
          />
          
          {/* Checkmark icon */}
          <Check 
            className={`
              w-14 h-14 text-primary-foreground
              transition-all duration-300 ease-out delay-200
              ${showCheckmark ? "scale-100 opacity-100" : "scale-0 opacity-0"}
            `}
            strokeWidth={3}
          />
        </div>

        {/* Success text */}
        <h1 
          className={`
            mt-8 text-3xl lg:text-4xl font-bold text-foreground
            transition-all duration-500 ease-out
            ${showText 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
            }
          `}
        >
          Great work!
        </h1>

        {/* Subtitle */}
        <p 
          className={`
            mt-3 text-muted-foreground text-lg
            transition-all duration-500 ease-out delay-100
            ${showText 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
            }
          `}
        >
          Your request has been submitted
        </p>

        {/* Manual continue button (fallback) */}
        <div 
          className={`
            mt-8 transition-all duration-500 ease-out
            ${showButton 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
            }
          `}
        >
          <Button 
            onClick={handleContinue}
            size="lg"
            className="gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
