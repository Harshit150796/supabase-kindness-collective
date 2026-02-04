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
  coverPhotoUrl?: string | null;
}

export function FundraiserGallery({
  images,
  isOwner,
  onAddPhotos,
  fundraiserTitle,
  coverPhotoUrl,
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

  // No images in fundraiser_images table - check for legacy fallback
  if (images.length === 0) {
    // Check for legacy cover_photo_url fallback
    if (coverPhotoUrl) {
      return (
        <div className="relative w-full h-64 lg:h-80">
          <img
            src={coverPhotoUrl}
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

    // Owner view - interactive dashed upload zone
    if (isOwner) {
      return (
        <div className="w-full max-w-4xl mx-auto px-4 lg:px-8 py-6">
          <div 
            onClick={onAddPhotos}
            className="w-full h-52 lg:h-60 border-2 border-dashed border-muted-foreground/40 
                 rounded-2xl bg-gradient-to-br from-muted/30 via-muted/40 to-muted/30
                 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer group
                 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
          >
            {/* Subtle decorative background circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-primary/5" />
            </div>

            <div className="flex flex-col items-center gap-3 text-center px-8 relative z-10">
              {/* Camera icon in circle */}
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20
                   flex items-center justify-center group-hover:scale-105 group-hover:bg-primary/15 
                   transition-all duration-300">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              
              {/* Text content */}
              <div className="space-y-1">
                <p className="text-foreground font-medium text-base">
                  Add photos to tell your story
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Upload up to 3 images to help donors connect with your cause
                </p>
              </div>
              
              {/* Upload button */}
              <Button 
                size="default" 
                className="gap-2 rounded-full px-6 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPhotos?.();
                }}
              >
                <Plus className="w-4 h-4" />
                Add Photos
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Visitor view - minimal placeholder
    return (
      <div className="w-full h-28 lg:h-32 flex items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2.5 text-muted-foreground/70">
          <Camera className="w-5 h-5" />
          <span className="text-sm">Photos coming soon</span>
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
