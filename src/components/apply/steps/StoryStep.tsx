import { PhotoGuidance, usePhotoCropper } from "@/components/photo/PhotoCropDialog";
import { useState, useRef } from "react";
import { ImagePlus, Camera, Video, Folder } from "lucide-react";
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
    className="flex flex-col items-center gap-2.5 rounded-2xl bg-muted/70 px-2 py-5
      transition-[background-color,transform] duration-200 active:scale-[0.97] hover:bg-muted"
  >
    <span className="text-primary">{icon}</span>
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
  category,
  media,
  setMedia,
  userId,
}: StoryStepProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const photoCaptureRef = useRef<HTMLInputElement>(null);
  const videoCaptureRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { cropFile, dialog: cropDialog } = usePhotoCropper();

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

    for (let file of selected) {
      if (file.type.startsWith("image/")) {
        const cropped = await cropFile(file);
        if (!cropped) continue;
        file = cropped;
      }
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
      case "meals":
        return "For example: I'm a single mom of two in Dayton. My hours were cut in March, and after rent there's little left for groceries...";
      case "healthcare":
        return "For example: I'm recovering from surgery and can't work for six weeks. Prescriptions and basics at the pharmacy add up fast...";
      case "education":
        return "For example: My daughter starts high school this fall and needs supplies and a laptop for homework...";
      default:
        return "For example: who you are, who lives with you, what changed, and how coupons at the stores you chose would help...";
    }
  };

  const [dragging, setDragging] = useState(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) void handleFiles(files);
  };
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop,
  };

  const toContinue = Math.max(0, 10 - wordCount);
  const guidance =
    toContinue > 0
      ? `${toContinue} more ${toContinue === 1 ? "word" : "words"} to continue`
      : wordCount < minWords
        ? `Enough to continue. Around ${minWords} words gives donors the full picture.`
        : "Great detail. Donors can see what's happening.";

  return (
    <div className="space-y-12">
      <section aria-labelledby="story-heading">
        <h2 id="story-heading" className="font-display text-[1.75rem] font-normal leading-tight text-foreground sm:text-[2rem]">What's happening?</h2>
        <p className="mt-1.5 max-w-[36rem] text-[15px] leading-relaxed text-muted-foreground">
          Say who you are and who lives with you, what changed, and how the stores you chose would help.
        </p>

        <div className={`mt-5 rounded-2xl bg-muted/60 transition-shadow ${isFocused ? "shadow-[inset_0_0_0_2px_hsl(var(--primary))]" : ""}`}>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={getPlaceholder()}
            aria-label="Your story"
            aria-describedby="story-guidance"
            className="block min-h-[240px] w-full resize-y rounded-2xl bg-transparent px-5 pb-3 pt-5 text-[17px] leading-[1.7] text-foreground outline-none placeholder:text-muted-foreground/60 lg:min-h-[280px]"
          />
          <div className="flex items-center gap-4 px-5 pb-4">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/80">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
          </div>
        </div>
        <p id="story-guidance" className="mt-2.5 text-sm text-muted-foreground" aria-live="polite">{guidance}</p>
      </section>

      <section aria-labelledby="media-heading" className="space-y-4">
        <div>
          <h2 id="media-heading" className="font-display text-[1.75rem] font-normal leading-tight text-foreground sm:text-[2rem]">Add photos or a video</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            At least one photo, so donors can see who they're helping. The first one becomes your cover.
          </p>
        </div>
        <PhotoGuidance />
        {cropDialog}

        {media.length === 0 ? (
          <button
            type="button"
            onClick={openPicker}
            {...dropProps}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl px-6 py-10 text-center outline-none transition-[background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              dragging ? "bg-[hsl(var(--primary-97))] shadow-[inset_0_0_0_2px_hsl(var(--primary))]" : "bg-muted/60 hover:bg-muted"
            }`}
          >
            <ImagePlus className="h-8 w-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-base font-medium text-foreground">{isMobile ? "Take or choose a photo" : "Choose photos or drop them here"}</span>
            <span className="text-sm text-muted-foreground">Up to {MAX_MEDIA_ITEMS}. Photos up to 10 MB, videos up to 90 seconds.</span>
          </button>
        ) : (
          <div {...dropProps} className={`rounded-2xl transition-shadow ${dragging ? "shadow-[0_0_0_2px_hsl(var(--primary))]" : ""}`}>
            <MediaTray
              items={media}
              onAdd={openPicker}
              onRemove={handleRemove}
              onSetCover={handleSetCover}
              onRetry={handleRetry}
            />
          </div>
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
                <DrawerTitle className="font-display text-2xl font-normal">Add a photo or video</DrawerTitle>
              </DrawerHeader>
              <div className="grid grid-cols-3 gap-2 px-4 pb-8">
                <PickerTile
                  icon={<Camera className="w-7 h-7" />}
                  label="Take photo"
                  onClick={() => choose(photoCaptureRef)}
                />
                <PickerTile
                  icon={<Video className="w-7 h-7" />}
                  label="Record video"
                  onClick={() => choose(videoCaptureRef)}
                />
                <PickerTile
                  icon={<Folder className="w-7 h-7" />}
                  label="Choose from library"
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
      </section>
    </div>
  );
};
