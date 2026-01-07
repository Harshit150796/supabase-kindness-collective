import { useState, useRef } from "react";
import { ImagePlus, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface MediaStepProps {
  coverPhoto: File | null;
  setCoverPhoto: (file: File | null) => void;
  coverPhotoPreview: string;
  setCoverPhotoPreview: (url: string) => void;
}

export const MediaStep = ({
  coverPhoto,
  setCoverPhoto,
  coverPhotoPreview,
  setCoverPhotoPreview,
}: MediaStepProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return false;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) {
      return;
    }
    
    setCoverPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setCoverPhoto(null);
    setCoverPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 stagger-children">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Add a cover photo</h2>
        <p className="text-muted-foreground">
          Cover media helps tell your story. If you find a better photo later, you can always change it.
        </p>
      </div>

      {/* Upload Area */}
      {!coverPhotoPreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed 
            transition-all duration-300 ease-out
            flex flex-col items-center justify-center
            min-h-[280px] lg:min-h-[320px]
            ${isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-border/60 hover:border-primary/50 hover:bg-secondary/50"
            }
          `}
        >
          {/* Animated icon */}
          <div 
            className={`
              relative mb-4 transition-transform duration-300
              ${isDragging ? "scale-110" : ""}
            `}
          >
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
              <ImagePlus className="w-10 h-10 text-muted-foreground" />
            </div>
            {/* Plus badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Upload className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>

          <p className="text-foreground font-semibold text-lg mb-1">
            {isDragging ? "Drop your photo here" : "Upload a photo"}
          </p>
          <p className="text-muted-foreground text-sm">
            or drag and drop
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        /* Image Preview */
        <div className="relative rounded-2xl overflow-hidden animate-scale-in">
          <img
            src={coverPhotoPreview}
            alt="Cover preview"
            className="w-full h-[280px] lg:h-[320px] object-cover"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white/90 backdrop-blur-sm text-foreground font-medium rounded-full hover:bg-white transition-colors text-sm"
              >
                Change photo
              </button>
              <button
                onClick={handleRemove}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Tips */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border/30">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> Use a bright, clear photo that shows who will benefit from the coupons. Personal photos help donors connect with your story.
        </p>
      </div>
    </div>
  );
};
