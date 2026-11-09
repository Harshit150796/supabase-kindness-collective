import { ResponsivePhoto } from '@/components/ResponsivePhoto';
import { useState } from "react";
import { Camera, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FundraiserImageFallback, orderedFundraiserImages, transformedFundraiserImage } from "@/lib/fundraiserImages";

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
  category?: string | null;
}

export function FundraiserGallery({
  images,
  isOwner,
  onAddPhotos,
  fundraiserTitle,
  coverPhotoUrl,
  category,
}: FundraiserGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Sort images: primary first, then by display_order
  const sortedImages = orderedFundraiserImages(images) as FundraiserImage[];

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
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/30">
        <img aria-hidden="true" alt="" src={transformedFundraiserImage(coverPhotoUrl, 160) ?? coverPhotoUrl} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
        <img
          src={transformedFundraiserImage(coverPhotoUrl, 960) ?? coverPhotoUrl}
          srcSet={[
            [480, transformedFundraiserImage(coverPhotoUrl, 480)],
            [768, transformedFundraiserImage(coverPhotoUrl, 768)],
            [1200, transformedFundraiserImage(coverPhotoUrl, 1200)],
            [1600, transformedFundraiserImage(coverPhotoUrl, 1600)],
          ].filter((entry): entry is [number, string] => typeof entry[1] === 'string').map(([width, url]) => `${url} ${width}w`).join(', ') || undefined}
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) calc(100vw - 2rem), min(760px, calc(100vw - 28rem))"
          width={1200}
          height={900}
          alt={fundraiserTitle}
          className="relative w-full h-full object-contain"
          loading="eager"
          decoding="async"
        />
          
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

    // Visitor view - branded category fallback
    return (
      <div className="aspect-[4/3] w-full"><FundraiserImageFallback category={category} /></div>
    );
  }

  // Single image
  if (sortedImages.length === 1) {
    return (
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/30">
        <img aria-hidden="true" alt="" src={transformedFundraiserImage(sortedImages[0].image_url, 160) ?? sortedImages[0].image_url} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
        <ResponsivePhoto sizes="(max-width: 1023px) calc(100vw - 2rem), 760px" width={1200} height={900} loading="eager"
          src={sortedImages[0].image_url}
          alt={fundraiserTitle}
          className="relative w-full h-full object-contain"
        />
        
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
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/30">
        <img aria-hidden="true" alt="" src={transformedFundraiserImage(sortedImages[activeIndex].image_url, 160) ?? sortedImages[activeIndex].image_url} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
        <ResponsivePhoto sizes="(max-width: 1023px) calc(100vw - 2rem), 760px" width={1200} height={900} loading="eager"
          src={sortedImages[activeIndex].image_url}
          alt={`${fundraiserTitle} - Photo ${activeIndex + 1}`}
          className="relative w-full h-full object-contain transition-opacity duration-300"
        />

        {/* Navigation arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/85 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/85 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
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
      <div className="flex gap-2 overflow-x-auto bg-background pt-3">
        {sortedImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-16 w-16 shrink-0 rounded-lg overflow-hidden transition-all",
              index === activeIndex
                ? "ring-2 ring-inset ring-primary"
                : "opacity-70 hover:opacity-100"
            )}
          >
            <img
              src={transformedFundraiserImage(image.image_url, 160) ?? image.image_url}
              alt={`Thumbnail ${index + 1}`} width={64} height={64} loading="lazy" decoding="async"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
