import { useEffect, useState } from "react";
import { ImagePlus, Pencil, FileText, Target, User, Sparkles, MapPin, Check } from "lucide-react";
import { getSuggestedTitles } from "@/lib/suggestedTitles";
import { Input } from "@/components/ui/input";

interface ReviewStepProps {
  coverPhotoPreview: string;
  title: string;
  setTitle: (title: string) => void;
  story: string;
  category: string;
  beneficiaryType: string;
  monthlyGoal: string;
  zipCode: string;
  setZipCode: (value: string) => void;
  locationLabel?: string | null;
  onEditStory: () => void;
  onEditDetails: () => void;
}


const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    food: "Food & Groceries",
    healthcare: "Healthcare & Medical",
    education: "Education & School",
    clothing: "Clothing",
    transportation: "Transportation",
    utilities: "Utilities",
    other: "Other Essentials",
  };
  return labels[category] || category;
};

const getBeneficiaryLabel = (type: string): string => {
  const labels: Record<string, string> = {
    yourself: "Myself",
    myself: "Myself",
    family: "My Family",
    organization: "Community Organization",
  };
  return labels[type] || type;
};

export const ReviewStep = ({
  coverPhotoPreview,
  title,
  setTitle,
  story,
  category,
  beneficiaryType,
  monthlyGoal,
  zipCode,
  setZipCode,
  locationLabel,
  onEditStory,
  onEditDetails,
}: ReviewStepProps) => {
  const suggestions = getSuggestedTitles(category);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityState = locationLabel && locationLabel.includes(",") ? locationLabel : null;

  // Pre-fill the title with the first suggestion the first time we land here
  useEffect(() => {
    if (!title.trim() && suggestions[0]) {
      setTitle(suggestions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 stagger-children">
      {/* Location */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Where will you use the coupons?</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="max-w-xs space-y-2">
            <label htmlFor="apply-zip" className="text-sm font-medium text-foreground">
              ZIP code
            </label>
            <Input
              id="apply-zip"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder="e.g. 78701"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="h-12 rounded-xl border-border/80 bg-card hover:border-primary/50 transition-colors input-focus-ring text-base tracking-widest"
            />
            {cityState && (
              <p className="text-sm font-medium text-primary flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                {cityState}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            So we can match retailers near you.{" "}
            <span className="font-medium text-foreground">United States (US)</span> — vouchers are
            redeemable at US retailers only.
          </p>
        </div>
      </div>

      {/* Title (editable) */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Title</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSuggestions((v) => !v)}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showSuggestions ? "Hide suggestions" : "Suggestions"}
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Enter a title for your request..."
              className="w-full px-4 py-3.5 pr-16 rounded-xl border-2 border-border/60 bg-background
                text-foreground font-medium placeholder:text-muted-foreground/60
                focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none
                transition-all duration-200"
            />
            <span className="absolute top-1/2 -translate-y-1/2 right-3 text-xs text-muted-foreground">
              {title.length}/80
            </span>
          </div>

          {showSuggestions && (
            <div className="flex flex-wrap gap-2 animate-fade-in">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  className={`px-3 py-2 rounded-full border text-sm transition-colors ${
                    title === s
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story + photo */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Story & photo</span>
          </div>
          <button
            type="button"
            onClick={onEditStory}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4 space-y-3">
          {coverPhotoPreview ? (
            <img
              src={coverPhotoPreview}
              alt="Cover"
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <div
              onClick={onEditStory}
              className="w-full h-24 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Add a photo (optional)</span>
            </div>
          )}
          {story ? (
            <p className="text-foreground text-sm line-clamp-4">{story}</p>
          ) : (
            <p className="text-muted-foreground italic">No story written</p>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Request Details</span>
          </div>
          <button
            type="button"
            onClick={onEditDetails}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">

            <span className="text-muted-foreground text-sm">Category</span>
            <span className="text-foreground font-medium text-sm">{getCategoryLabel(category)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Beneficiary</span>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium text-sm">{getBeneficiaryLabel(beneficiaryType)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Monthly Goal</span>
            <span className="text-foreground font-semibold">${monthlyGoal}</span>
          </div>
        </div>
      </div>

      {/* Ready message */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground">
          <span className="font-medium">Almost there!</span> Review your request above and submit when
          you're ready.
        </p>
      </div>
    </div>
  );
};
