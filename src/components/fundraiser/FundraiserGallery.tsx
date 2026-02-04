import { useState } from "react";
import { Camera, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FundraiserImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface FundraiserGalleryProps {
  images: FundraiserImage[];
  isOwner: boolean;
  onAddPhotos?: () => void;
  fundraiserTitle: string;
}

export function FundraiserGallery({
  images,
  isOwner,
  onAddPhotos,
  fundraiserTitle,
}: FundraiserGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Sort images: primary first, then by display_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.display_order - b.display_order;
  });

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  // No images - show placeholder
  if (images.length === 0) {
    return (
      <div className="w-full h-64 lg:h-80 bg-muted/50 flex flex-col items-center justify-center relative">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          
          {isOwner ? (
            <>
              <div>
                <p className="text-muted-foreground font-medium">No photos yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Add up to 3 photos to help tell your story
                </p>
              </div>
              <Button onClick={onAddPhotos} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Photos
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">No photos yet</p>
          )}
        </div>
      </div>
    );
  }

  // Single image
  if (sortedImages.length === 1) {
    return (
      <div className="relative w-full h-64 lg:h-80">
        <img
          src={sortedImages[0].image_url}
          alt={fundraiserTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {isOwner && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 gap-1.5 backdrop-blur-sm"
            onClick={onAddPhotos}
          >
            <Camera className="w-4 h-4" />
            Manage Photos
          </Button>
        )}
      </div>
    );
  }

  // Multiple images - gallery with thumbnails
  return (
    <div className="relative">
      {/* Main image */}
      <div className="relative w-full h-64 lg:h-80 overflow-hidden">
        <img
          src={sortedImages[activeIndex].image_url}
          alt={`${fundraiserTitle} - Photo ${activeIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Navigation arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Image counter */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
          {activeIndex + 1} / {sortedImages.length}
        </div>

        {isOwner && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 gap-1.5 backdrop-blur-sm"
            onClick={onAddPhotos}
          >
            <Camera className="w-4 h-4" />
            Manage
          </Button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2 bg-background/90 backdrop-blur-sm p-2 rounded-xl border border-border shadow-lg">
        {sortedImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "w-12 h-12 rounded-lg overflow-hidden transition-all",
              index === activeIndex
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "opacity-70 hover:opacity-100"
            )}
          >
            <img
              src={image.image_url}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
