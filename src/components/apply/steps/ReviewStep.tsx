import { useEffect, useState } from "react";
import { Camera, ImagePlus, Sparkles, Check, ShieldCheck } from "lucide-react";
import { getSuggestedTitles } from "@/lib/suggestedTitles";
import { Input } from "@/components/ui/input";
import { MediaItem, formatDuration } from "@/lib/mediaUpload";

interface ReviewStepProps {
  media: MediaItem[];
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

interface RowProps {
  label: string;
  onEdit?: () => void;
  children: React.ReactNode;
  align?: "center" | "start";
}

const Row = ({ label, onEdit, children, align = "center" }: RowProps) => (
  <div
    className={`group flex gap-4 px-4 py-3.5 transition-colors duration-200 hover:bg-secondary/40 ${
      align === "center" ? "items-center" : "items-start"
    }`}
  >
    <span className="w-20 sm:w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
    <div className="flex-1 min-w-0 text-sm text-foreground">{children}</div>
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-sm font-medium text-primary/70 hover:text-primary transition-colors duration-200 md:opacity-60 md:group-hover:opacity-100"
      >
        Edit
      </button>
    )}
  </div>
);

export const ReviewStep = ({
  media,
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
  const cover = media[0];
  const coverPhotoPreview = cover?.previewUrl || "";
  const extras = media.slice(1);
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
    <div className="space-y-5 stagger-children">
      {/* Cover photo hero */}
      {coverPhotoPreview ? (
        <button
          type="button"
          onClick={onEditStory}
          className="group relative block w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border/60 bg-muted/30 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.35)]"
        >
          <img
            src={coverPhotoPreview}
            alt="Your request cover photo"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent opacity-70" />
          <span
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur-sm px-3 py-1.5
              text-xs font-medium text-foreground shadow-sm transition-all duration-200
              opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
          >
            <Camera className="w-3.5 h-3.5" />
            Change photo
          </span>
          {media.length > 1 && (
            <span className="absolute top-3 left-3 rounded-full bg-background/85 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground">
              1 / {media.length}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onEditStory}
          className="group w-full aspect-[16/9] max-h-44 rounded-2xl border border-dashed border-border/70 bg-secondary/25
            flex flex-col items-center justify-center gap-2 transition-all duration-200
            hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <ImagePlus className="w-5 h-5 text-primary" />
          </span>
          <span className="text-sm font-medium text-foreground">Add a photo</span>
          <span className="text-xs text-muted-foreground">Required — it helps people connect</span>
        </button>
      )}

      {/* Extra media strip */}
      {extras.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {extras.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={onEditStory}
              className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-border/60 bg-muted/30"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={`Additional media ${index + 2}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                  Video
                </span>
              )}
              {item.kind === "video" && item.durationSec ? (
                <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1 text-[10px] font-medium text-foreground">
                  {formatDuration(item.durationSec)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Give your request a title..."
            aria-label="Request title"
            className="w-full bg-transparent text-xl lg:text-2xl font-semibold text-foreground leading-snug
              placeholder:text-muted-foreground/50 rounded-lg px-2 -mx-2 py-1.5
              border border-transparent hover:border-border/60 focus:border-primary/50
              focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all duration-200"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-0.5">
          <button
            type="button"
            onClick={() => setShowSuggestions((v) => !v)}
            className="text-xs font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1.5 transition-colors duration-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showSuggestions ? "Hide suggestions" : "Need ideas?"}
          </button>
          <span
            className={`text-xs tabular-nums transition-opacity duration-200 ${
              title.length > 60 ? "opacity-100 text-muted-foreground" : "opacity-0"
            }`}
          >
            {title.length}/80
          </span>
        </div>

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTitle(s)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all duration-200 ${
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

      {/* Summary card */}
      <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/50 bg-card">
        <Row label="Category" onEdit={onEditDetails}>
          <span className="font-medium">{getCategoryLabel(category)}</span>
        </Row>

        <Row label="Beneficiary" onEdit={onEditDetails}>
          <span className="font-medium">{getBeneficiaryLabel(beneficiaryType)}</span>
        </Row>

        <Row label="Monthly goal" onEdit={onEditDetails}>
          <span className="font-semibold">${monthlyGoal}</span>
        </Row>

        <Row label="Location">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Input
              id="apply-zip"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder="ZIP code"
              aria-label="ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="h-10 w-28 rounded-xl border-border/80 bg-background text-base tracking-widest
                hover:border-primary/50 focus-visible:ring-primary/20 transition-colors duration-200"
            />
            {/* Reserved space so the row never jumps when the city resolves */}
            <span className="min-h-5 flex items-center">
              {cityState && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary animate-fade-in">
                  <Check className="w-4 h-4" />
                  {cityState}
                </span>
              )}
            </span>
          </div>
        </Row>

        <Row label="Story" onEdit={onEditStory} align="start">
          {story ? (
            <p className="text-muted-foreground leading-relaxed line-clamp-2">{story}</p>
          ) : (
            <p className="text-muted-foreground/70 italic">No story written yet</p>
          )}
        </Row>
      </div>

      {/* Footnote */}
      <div className="flex items-start gap-2.5 px-1">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vouchers are redeemable at <span className="font-medium text-foreground">US</span> retailers
          only, so we use your ZIP code to match retailers near you. You can edit any detail after
          submitting.
        </p>
      </div>
    </div>
  );
};
