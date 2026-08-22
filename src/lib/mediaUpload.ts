import { supabase } from "@/integrations/supabase/client";

export const MAX_MEDIA_ITEMS = 5;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_VIDEO_SECONDS = 90;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/3gpp",
];

export const MEDIA_BUCKET = "fundraiser-covers";

export type MediaStatus = "ready" | "uploading" | "done" | "error";

export interface MediaItem {
  id: string;
  file: File;
  kind: "image" | "video";
  previewUrl: string;
  durationSec?: number;
  status: MediaStatus;
  progress: number;
  storagePath?: string;
  publicUrl?: string;
  error?: string;
}

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/** Read a video's duration and grab a poster frame so the tray has a thumbnail. */
export const readVideoMeta = (
  file: File
): Promise<{ poster: string; durationSec: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
    video.src = url;

    let settled = false;
    const cleanup = () => URL.revokeObjectURL(url);

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const capture = () => {
      if (settled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no canvas context");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        settled = true;
        const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
        cleanup();
        resolve({ poster: canvas.toDataURL("image/jpeg", 0.85), durationSec });
      } catch (err) {
        fail(err as Error);
      }
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.1, video.duration || 0.1);
      } catch {
        capture();
      }
    };
    video.onseeked = capture;
    video.onerror = () => fail(new Error("Could not read video"));
    // Safety net: if seeking never fires, still resolve with what we have
    setTimeout(() => {
      if (!settled) capture();
    }, 4000);
  });

const extensionFor = (file: File): string => {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5 && !fromName.includes("/")) return fromName;
  return file.type.split("/")[1] || "bin";
};

/**
 * Upload one media file to storage, reporting real byte progress.
 * Uses the storage REST endpoint via XHR so we can observe upload progress
 * (supabase-js does not expose it), and falls back to the SDK if needed.
 */
export const uploadMediaFile = async (
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<{ path: string; publicUrl: string }> => {
  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extensionFor(file)}`;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const publicUrlOf = (p: string) =>
    supabase.storage.from(MEDIA_BUCKET).getPublicUrl(p).data.publicUrl;

  if (token) {
    const url = `${
      import.meta.env.VITE_SUPABASE_URL || "https://vbnbacowuoeeojjdrzzp.supabase.co"
    }/storage/v1/object/${MEDIA_BUCKET}/${path}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("x-upsert", "true");
      if (file.type) xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Network error while uploading"));
      xhr.send(file);
    });

    onProgress?.(100);
    return { path, publicUrl: publicUrlOf(path) };
  }

  // Fallback: SDK upload without granular progress
  onProgress?.(15);
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  onProgress?.(100);
  return { path, publicUrl: publicUrlOf(path) };
};
