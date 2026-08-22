import { Check, Play, Plus, RotateCcw, Star, X, AlertCircle } from "lucide-react";
import {
  MAX_MEDIA_ITEMS,
  MediaItem,
  formatBytes,
  formatDuration,
} from "@/lib/mediaUpload";

const UploadRing = ({ progress }: { progress: number }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="relative w-11 h-11">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="3"
          className="stroke-background/40"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
        {Math.round(progress)}%
      </span>
    </div>
  );
};

interface MediaTrayProps {
  items: MediaItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
  onRetry: (id: string) => void;
}

export const MediaTray = ({ items, onAdd, onRemove, onSetCover, onRetry }: MediaTrayProps) => {
  const cover = items[0];
  const uploading = items.filter((i) => i.status === "uploading").length;
  const failed = items.filter((i) => i.status === "error").length;
  const settled = items.filter((i) => i.status === "done" || i.status === "ready").length;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Cover preview */}
      <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border/50">
        {cover.previewUrl ? (
          <img
            src={cover.previewUrl}
            alt="Cover preview"
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center text-muted-foreground text-sm">
            {cover.kind === "video" ? "Video attached" : "Photo attached"}
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground">
            <Star className="w-3.5 h-3.5 text-gold" />
            Cover
          </span>
          {cover.kind === "video" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground">
              <Play className="w-3 h-3" />
              {cover.durationSec ? formatDuration(cover.durationSec) : "Video"}
            </span>
          )}
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {items.length} of {MAX_MEDIA_ITEMS} added
        </span>
        <span
          className={
            failed
              ? "text-destructive font-medium"
              : uploading
                ? "text-muted-foreground"
                : "text-primary font-medium"
          }
        >
          {failed
            ? `${failed} failed — tap retry`
            : uploading
              ? `Uploading ${uploading}…`
              : `${settled} ready`}
        </span>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`group relative aspect-square rounded-xl overflow-hidden border bg-muted/30 ${
              index === 0 ? "border-primary/60 ring-2 ring-primary/20" : "border-border/60"
            }`}
          >
            <button
              type="button"
              onClick={() => onSetCover(item.id)}
              aria-label={index === 0 ? "Cover media" : "Make this the cover"}
              className="absolute inset-0"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-muted-foreground" />
                </span>
              )}
            </button>

            {/* Status overlay */}
            {item.status === "uploading" && (
              <div className="absolute inset-0 bg-foreground/55 flex items-center justify-center pointer-events-none">
                <UploadRing progress={item.progress} />
              </div>
            )}
            {item.status === "error" && (
              <button
                type="button"
                onClick={() => onRetry(item.id)}
                className="absolute inset-0 bg-destructive/70 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-destructive-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
            )}
            {(item.status === "done" || item.status === "ready") && (
              <span
                className={`absolute bottom-1 left-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${
                  item.status === "done" ? "bg-primary" : "bg-background/90"
                }`}
                title={item.status === "done" ? "Uploaded" : "Ready to upload"}
              >
                {item.status === "done" ? (
                  <Check className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <Check className="w-3 h-3 text-primary" />
                )}
              </span>
            )}

            {item.kind === "video" && item.durationSec ? (
              <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1 text-[10px] font-medium text-foreground">
                {formatDuration(item.durationSec)}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove media ${index + 1}`}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center
                shadow-sm hover:bg-background transition-colors"
            >
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        ))}

        {items.length < MAX_MEDIA_ITEMS && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add more media"
            className="aspect-square rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1
              text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Add</span>
          </button>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Tap a thumbnail to make it the cover. Photos up to {formatBytes(10 * 1024 * 1024)}, videos up
          to {formatBytes(100 * 1024 * 1024)} and 90 seconds.
        </span>
      </p>
    </div>
  );
};
