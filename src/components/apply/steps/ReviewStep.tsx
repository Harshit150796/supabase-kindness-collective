import { ImagePlus, Pencil, FileText, Target, User } from "lucide-react";

interface ReviewStepProps {
  coverPhotoPreview: string;
  title: string;
  story: string;
  category: string;
  beneficiaryType: string;
  monthlyGoal: string;
  onEditMedia: () => void;
  onEditTitle: () => void;
  onEditStory: () => void;
  onEditDetails: () => void;
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    food: "Food & Groceries",
    healthcare: "Healthcare & Medical",
    education: "Education & School",
    housing: "Housing & Utilities",
    childcare: "Childcare",
    other: "Other Essentials",
  };
  return labels[category] || category;
};

const getBeneficiaryLabel = (type: string): string => {
  const labels: Record<string, string> = {
    myself: "Myself",
    family: "My Family",
    organization: "An Organization",
  };
  return labels[type] || type;
};

export const ReviewStep = ({
  coverPhotoPreview,
  title,
  story,
  category,
  beneficiaryType,
  monthlyGoal,
  onEditMedia,
  onEditTitle,
  onEditStory,
  onEditDetails,
}: ReviewStepProps) => {
  return (
    <div className="space-y-6 stagger-children">
      {/* Media Section */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Cover Photo</span>
          </div>
          <button
            type="button"
            onClick={onEditMedia}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4">
          {coverPhotoPreview ? (
            <img
              src={coverPhotoPreview}
              alt="Cover"
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <div 
              onClick={onEditMedia}
              className="w-full h-40 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all"
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Add a cover photo</span>
            </div>
          )}
        </div>
      </div>

      {/* Title Section */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Title</span>
          </div>
          <button
            type="button"
            onClick={onEditTitle}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="p-4">
          {title ? (
            <p className="text-foreground font-medium">{title}</p>
          ) : (
            <p className="text-muted-foreground italic">No title set</p>
          )}
        </div>
      </div>

      {/* Story Section */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Story</span>
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
        <div className="p-4">
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
          <span className="font-medium">Almost there!</span> Review your request above and click "Submit Request" when you're ready.
        </p>
      </div>
    </div>
  );
};
