import { useState } from "react";
import { Sparkles, Image, Video, Bold, Italic, Link, List, HelpCircle } from "lucide-react";

interface StoryStepProps {
  story: string;
  setStory: (story: string) => void;
  isLongTerm: boolean | null;
  setIsLongTerm: (value: boolean | null) => void;
  category: string;
}

export const StoryStep = ({
  story,
  setStory,
  isLongTerm,
  setIsLongTerm,
  category,
}: StoryStepProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const wordCount = story.trim() ? story.trim().split(/\s+/).length : 0;
  const minWords = 50;
  const progress = Math.min((wordCount / minWords) * 100, 100);

  const getPlaceholder = () => {
    switch (category) {
      case "food":
        return "Share why you need food assistance. Tell donors about your situation, your family, and how coupons will help you...";
      case "healthcare":
        return "Explain your healthcare needs. Share your medical situation and how coupon assistance will make a difference...";
      case "education":
        return "Describe your educational goals. Tell donors about your learning journey and how coupons will help...";
      default:
        return "Introduce yourself and share why you need coupon assistance. The more detail you provide, the more donors can connect with your story...";
    }
  };

  return (
    <div className="space-y-6 stagger-children">
      {/* Toolbar - Decorative */}
      <div className="flex items-center gap-1 p-2 bg-secondary/50 rounded-xl border border-border/30">
        {[Image, Video, Bold, Italic, Link, List].map((Icon, index) => (
          <button
            key={index}
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={getPlaceholder()}
          className={`
            w-full min-h-[200px] lg:min-h-[240px] p-4 rounded-xl
            bg-background border-2 resize-none
            text-foreground placeholder:text-muted-foreground/60
            transition-all duration-300 ease-out
            focus:outline-none
            ${isFocused 
              ? "border-primary ring-4 ring-primary/10" 
              : "border-border/60 hover:border-border"
            }
          `}
        />
        
        {/* Word counter */}
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {wordCount} words
        </div>
      </div>

      {/* Strengthen your story card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-2">Strengthen your story</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {wordCount >= minWords 
                    ? "Great! Your story is detailed enough" 
                    : `${minWords - wordCount} more words needed`
                  }
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    progress >= 100 ? "bg-primary" : "bg-gold"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Long-term toggle */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">Is your need long-term?</span>
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-foreground text-background text-xs rounded-lg shadow-xl z-10 animate-fade-in">
                  If you need ongoing support, we'll encourage donors to give monthly coupons.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                </div>
              )}
            </button>
          </div>

          {/* Pill toggle */}
          <div className="flex items-center gap-1 p-1 bg-background rounded-full border border-border/50">
            {[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setIsLongTerm(value)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${isLongTerm === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
