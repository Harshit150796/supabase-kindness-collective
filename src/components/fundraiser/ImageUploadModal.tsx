import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, Loader2, Star, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FundraiserImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  fundraiserId: string;
  existingImages: FundraiserImage[];
  onImagesUpdated: () => void;
}

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUploadModal({
  open,
  onClose,
  fundraiserId,
  existingImages,
  onImagesUpdated,
}: ImageUploadModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localImages, setLocalImages] = useState<FundraiserImage[]>(existingImages);
  const [dragOver, setDragOver] = useState(false);

  const remainingSlots = MAX_IMAGES - localImages.length;

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        continue;
      }

      await uploadImage(file);
    }
  }, [remainingSlots, toast]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${fundraiserId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("fundraiser-covers")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("fundraiser-covers")
        .getPublicUrl(fileName);

      const newOrder = localImages.length;
      const isPrimary = localImages.length === 0;

      const { data, error: insertError } = await supabase
        .from("fundraiser_images")
        .insert({
          fundraiser_id: fundraiserId,
          image_url: publicUrl,
          display_order: newOrder,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setLocalImages((prev) => [...prev, data]);
      onImagesUpdated();

      toast({
        title: "Image uploaded",
        description: "Your photo has been added successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      // First, unset all as primary
      await supabase
        .from("fundraiser_images")
        .update({ is_primary: false })
        .eq("fundraiser_id", fundraiserId);

      // Then set the selected one as primary
      await supabase
        .from("fundraiser_images")
        .update({ is_primary: true })
        .eq("id", imageId);

      setLocalImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        }))
      );
      onImagesUpdated();

      toast({
        title: "Cover photo updated",
        description: "This image will be shown as the main photo",
      });
    } catch (error) {
      console.error("Error setting primary:", error);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Delete from database
      await supabase.from("fundraiser_images").delete().eq("id", imageId);

      // Try to delete from storage (extract path from URL)
      const urlParts = imageUrl.split("/fundraiser-covers/");
      if (urlParts[1]) {
        await supabase.storage.from("fundraiser-covers").remove([urlParts[1]]);
      }

      const deletedImage = localImages.find((img) => img.id === imageId);
      const wasDeleted = deletedImage?.is_primary;
      
      setLocalImages((prev) => {
        const remaining = prev.filter((img) => img.id !== imageId);
        // If we deleted the primary, make the first remaining one primary
        if (wasDeleted && remaining.length > 0) {
          remaining[0].is_primary = true;
          supabase
            .from("fundraiser_images")
            .update({ is_primary: true })
            .eq("id", remaining[0].id);
        }
        return remaining;
      });
      
      onImagesUpdated();

      toast({
        title: "Image removed",
        description: "The photo has been deleted",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Delete failed",
        description: "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Photos</DialogTitle>
          <DialogDescription>
            Add up to {MAX_IMAGES} photos to your fundraiser. The first photo will be your cover image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing images grid */}
          {localImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {localImages.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                    image.is_primary ? "border-primary" : "border-border"
                  )}
                >
                  <img
                    src={image.image_url}
                    alt="Fundraiser"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary badge */}
                  {image.is_primary && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Cover
                    </div>
                  )}

                  {/* Action buttons overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs"
                        onClick={() => handleSetPrimary(image.id)}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set Cover
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteImage(image.id, image.image_url)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {remainingSlots > 0 && (
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={uploading}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Drop photos here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {remainingSlots} photo{remainingSlots !== 1 ? "s" : ""} remaining • Max 5MB each
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Max reached message */}
          {remainingSlots === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Maximum of {MAX_IMAGES} photos reached. Remove a photo to add more.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
