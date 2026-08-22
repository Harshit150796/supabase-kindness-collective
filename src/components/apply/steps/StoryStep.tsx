import { useState, useRef } from "react";
import { Sparkles, HelpCircle, ImagePlus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface StoryStepProps {
  story: string;
  setStory: (story: string) => void;
  isLongTerm: boolean | null;
  setIsLongTerm: (value: boolean | null) => void;
  category: string;
  coverPhoto: File | null;
  setCoverPhoto: (file: File | null) => void;
  coverPhotoPreview: string;
  setCoverPhotoPreview: (url: string) => void;
}

export const StoryStep = ({
  story,
  setStory,
  isLongTerm,
  setIsLongTerm,
  category,
  coverPhoto,
  setCoverPhoto,
  coverPhotoPreview,
  setCoverPhotoPreview,
}: StoryStepProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const storyText = story || "";
  const wordCount = storyText.trim() ? storyText.trim().split(/\s+/).length : 0;
  const minWords = 50;
  const progress = Math.min((wordCount / minWords) * 100, 100);

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setCoverPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setCoverPhoto(null);
    setCoverPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={getPlaceholder()}
          className={`
            w-full min-h-[200px] lg:min-h-[220px] p-4 rounded-xl
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
                    : `${minWords - wordCount} more words needed`}
                </span>
              </div>
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

      {/* Optional photo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Add a photo</h3>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>

        {!coverPhotoPreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-secondary/40 transition-all duration-300 flex items-center gap-4 p-4"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Upload className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-medium">Upload a photo</p>
              <p className="text-sm text-muted-foreground">
                A bright, clear photo helps donors connect with your story
              </p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden animate-scale-in">
            <img
              src={coverPhotoPreview}
              alt="Cover preview"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-background/90 backdrop-blur-sm text-foreground font-medium rounded-full hover:bg-background transition-colors text-sm"
                >
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  aria-label="Remove photo"
                  className="w-9 h-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
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
