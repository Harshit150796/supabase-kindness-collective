import { useState } from "react";
import { Check, Pencil } from "lucide-react";

interface TitleStepProps {
  title: string;
  setTitle: (title: string) => void;
  titleSource: "suggested" | "custom";
  setTitleSource: (source: "suggested" | "custom") => void;
  category: string;
}

const getSuggestedTitles = (category: string): string[] => {
  switch (category) {
    case "food":
      return [
        "Help Feed My Family This Month",
        "Groceries for Those in Need",
        "Supporting Families with Food Coupons",
      ];
    case "healthcare":
      return [
        "Help Cover My Medical Expenses",
        "Healthcare Support Needed",
        "Medical Assistance Request",
      ];
    case "education":
      return [
        "School Supplies for My Children",
        "Education Support Needed",
        "Help with Learning Materials",
      ];
    case "housing":
      return [
        "Help with Essential Home Needs",
        "Housing Support Request",
        "Assistance for My Family's Home",
      ];
    case "childcare":
      return [
        "Childcare Support for Working Parents",
        "Help Care for My Children",
        "Support for My Family's Childcare",
      ];
    default:
      return [
        "Help My Family with Essential Needs",
        "Support for Daily Necessities",
        "Coupon Assistance Request",
      ];
  }
};

export const TitleStep = ({
  title,
  setTitle,
  titleSource,
  setTitleSource,
  category,
}: TitleStepProps) => {
  const [showCustomInput, setShowCustomInput] = useState(titleSource === "custom");
  const suggestedTitles = getSuggestedTitles(category);

  const handleSuggestedSelect = (suggestedTitle: string) => {
    setTitle(suggestedTitle);
    setTitleSource("suggested");
    setShowCustomInput(false);
  };

  const handleWriteOwn = () => {
    setShowCustomInput(true);
    setTitleSource("custom");
    if (suggestedTitles.includes(title)) {
      setTitle("");
    }
  };

  return (
    <div className="space-y-6 stagger-children">
      {/* Suggested titles header */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Suggested titles</h2>
        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
          BETA
        </span>
      </div>

      {/* Suggested title cards */}
      {!showCustomInput && (
        <div className="space-y-3">
          {suggestedTitles.map((suggestedTitle, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestedSelect(suggestedTitle)}
              className={`
                w-full p-4 rounded-xl border-2 text-left
                transition-all duration-200 ease-out
                group hover-lift
                ${title === suggestedTitle
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-primary/40 hover:bg-secondary/30"
                }
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground font-medium">{suggestedTitle}</span>
                <div 
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    transition-all duration-200
                    ${title === suggestedTitle
                      ? "border-primary bg-primary"
                      : "border-border/60 group-hover:border-primary/40"
                    }
                  `}
                >
                  {title === suggestedTitle && (
                    <Check className="w-4 h-4 text-primary-foreground animate-scale-in" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Write your own link/input */}
      {!showCustomInput ? (
        <button
          type="button"
          onClick={handleWriteOwn}
          className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
        >
          <Pencil className="w-4 h-4 transition-transform group-hover:rotate-12" />
          Or write your own
        </button>
      ) : (
        <div className="space-y-4 animate-slide-in-right">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Write your own title</h3>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                if (titleSource === "custom") {
                  setTitle("");
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View suggestions
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title for your request..."
              maxLength={80}
              className="w-full px-4 py-4 rounded-xl border-2 border-border/60 bg-background
                text-foreground placeholder:text-muted-foreground/60
                focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none
                transition-all duration-200"
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {title.length}/80
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            A good title is clear and specific about what you need help with.
          </p>
        </div>
      )}

      {/* Selected title preview */}
      {title && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-border/30 animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your title</p>
          <p className="text-foreground font-semibold">{title}</p>
        </div>
      )}
    </div>
  );
};
