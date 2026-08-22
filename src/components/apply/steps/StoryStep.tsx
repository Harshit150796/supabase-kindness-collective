import { useState, useRef } from "react";
import { Sparkles, HelpCircle, ImagePlus, Upload, Camera, Video, Folder } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaTray } from "./MediaTray";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_MEDIA_ITEMS,
  MAX_VIDEO_SECONDS,
  MAX_VIDEO_SIZE,
  MediaItem,
  readVideoMeta,
  uploadMediaFile,
} from "@/lib/mediaUpload";

interface StoryStepProps {
  story: string;
  setStory: (story: string) => void;
  isLongTerm: boolean | null;
  setIsLongTerm: (value: boolean | null) => void;
  category: string;
  media: MediaItem[];
  setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  userId?: string | null;
}

const PickerTile = ({
  icon,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-secondary/30 px-2 py-4
      transition-all duration-200 active:scale-[0.97] hover:border-primary/40 hover:bg-primary/5"
  >
    <span className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm">
      {icon}
    </span>
    <span className="text-sm font-medium text-foreground leading-tight text-center">{label}</span>
    {sublabel && <span className="text-xs text-muted-foreground leading-none">{sublabel}</span>}
  </button>
);

const readImagePreview = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

export const StoryStep = ({
  story,
  setStory,
  isLongTerm,
  setIsLongTerm,
  category,
  media,
  setMedia,
  userId,
}: StoryStepProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const photoCaptureRef = useRef<HTMLInputElement>(null);
  const videoCaptureRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const storyText = story || "";
  const wordCount = storyText.trim() ? storyText.trim().split(/\s+/).length : 0;
  const minWords = 50;
  const progress = Math.min((wordCount / minWords) * 100, 100);

  const patchItem = (id: string, patch: Partial<MediaItem>) =>
    setMedia((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const startUpload = async (item: MediaItem) => {
    if (!userId) {
      patchItem(item.id, { status: "ready", progress: 0 });
      return;
    }
    patchItem(item.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const { path, publicUrl } = await uploadMediaFile(item.file, userId, (percent) =>
        patchItem(item.id, { progress: percent })
      );
      patchItem(item.id, { status: "done", progress: 100, storagePath: path, publicUrl });
    } catch (err: any) {
      patchItem(item.id, { status: "error", error: err?.message || "Upload failed" });
      toast({
        title: "Upload failed",
        description: `${item.file.name} couldn't be uploaded. Tap retry to try again.`,
        variant: "destructive",
      });
    }
  };

  const handleFiles = async (files: File[]) => {
    const remaining = MAX_MEDIA_ITEMS - media.length;
    if (remaining <= 0) {
      toast({
        title: "Limit reached",
        description: `You can add up to ${MAX_MEDIA_ITEMS} photos or videos.`,
        variant: "destructive",
      });
      return;
    }

    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      toast({
        title: "Some files skipped",
        description: `Only ${remaining} more ${remaining === 1 ? "item" : "items"} can be added.`,
      });
    }

    for (const file of selected) {
      const isVideo = file.type.startsWith("video/") || ALLOWED_VIDEO_TYPES.includes(file.type);
      const isImage = file.type.startsWith("image/") || ALLOWED_IMAGE_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        toast({
          title: "Unsupported file",
          description: `${file.name} isn't a photo or video we can use.`,
          variant: "destructive",
        });
        continue;
      }

      const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > limit) {
        toast({
          title: "File too large",
          description: isVideo
            ? "Please choose a video smaller than 100MB."
            : "Please choose an image smaller than 10MB.",
          variant: "destructive",
        });
        continue;
      }

      let previewUrl = "";
      let durationSec: number | undefined;

      if (isVideo) {
        try {
          const meta = await readVideoMeta(file);
          previewUrl = meta.poster;
          durationSec = meta.durationSec;
          if (durationSec && durationSec > MAX_VIDEO_SECONDS + 1) {
            toast({
              title: "Video too long",
              description: `Please keep videos under ${MAX_VIDEO_SECONDS} seconds.`,
              variant: "destructive",
            });
            continue;
          }
        } catch {
          toast({
            title: "Preview unavailable",
            description: "We added your video, but couldn't create a thumbnail.",
          });
        }
      } else {
        previewUrl = await readImagePreview(file);
      }

      const item: MediaItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        kind: isVideo ? "video" : "image",
        previewUrl,
        durationSec,
        status: userId ? "uploading" : "ready",
        progress: 0,
      };

      setMedia((prev) => [...prev, item]);
      void startUpload(item);
    }
  };

  const openPicker = () => {
    if (isMobile) {
      setPickerOpen(true);
    } else {
      libraryRef.current?.click();
    }
  };

  const choose = (ref: React.RefObject<HTMLInputElement>) => {
    setPickerOpen(false);
    // let the sheet close before the native chooser opens
    setTimeout(() => ref.current?.click(), 120);
  };

  const handleRemove = (id: string) => {
    setMedia((prev) => prev.filter((item) => item.id !== id));
    [photoCaptureRef, videoCaptureRef, libraryRef].forEach((r) => {
      if (r.current) r.current.value = "";
    });
  };

  const handleSetCover = (id: string) =>
    setMedia((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });

  const handleRetry = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (item) void startUpload(item);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) void handleFiles(files);
    e.target.value = "";
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

      {/* Required photos or videos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Add photos or videos</h3>
          <span className="text-xs font-medium text-primary">Required</span>
        </div>

        {media.length === 0 ? (
          <button
            type="button"
            onClick={openPicker}
            className="w-full text-left cursor-pointer rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-secondary/40 transition-all duration-300 flex items-center gap-4 p-4"
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
              <p className="text-foreground font-medium">Upload photos or videos</p>
              <p className="text-sm text-muted-foreground">
                Add up to {MAX_MEDIA_ITEMS} — the first one becomes your cover
              </p>
            </div>
          </button>
        ) : (
          <MediaTray
            items={media}
            onAdd={openPicker}
            onRemove={handleRemove}
            onSetCover={handleSetCover}
            onRetry={handleRetry}
          />
        )}

        {/* Hidden inputs: direct camera photo, camera video, and files/gallery */}
        <input
          ref={photoCaptureRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onInputChange}
          className="hidden"
        />
        <input
          ref={videoCaptureRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={onInputChange}
          className="hidden"
        />
        <input
          ref={libraryRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onInputChange}
          className="hidden"
        />

        {isMobile ? (
          <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>Choose an action</DrawerTitle>
              </DrawerHeader>
              <div className="grid grid-cols-3 gap-2 px-4 pb-8">
                <PickerTile
                  icon={<Camera className="w-7 h-7" />}
                  label="Camera"
                  onClick={() => choose(photoCaptureRef)}
                />
                <PickerTile
                  icon={<Video className="w-7 h-7" />}
                  label="Camera"
                  sublabel="Camcorder"
                  onClick={() => choose(videoCaptureRef)}
                />
                <PickerTile
                  icon={<Folder className="w-7 h-7" />}
                  label="Files"
                  onClick={() => choose(libraryRef)}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Choose an action</DialogTitle>
              </DialogHeader>
              <PickerTile
                icon={<Folder className="w-7 h-7" />}
                label="Choose from Files"
                onClick={() => choose(libraryRef)}
              />
            </DialogContent>
          </Dialog>
        )}

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
