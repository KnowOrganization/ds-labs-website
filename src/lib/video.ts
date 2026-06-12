// Helpers to classify media urls: uploaded files vs embeds (YouTube), and
// image vs video. Used by the studio, the detail panel, and the admin form.

import type { MediaKind } from "./types";

const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;

/** True when the url points at a playable video file (storage upload or direct .mp4). */
export function isFileVideo(url?: string | null): boolean {
  if (!url) return false;
  if (VIDEO_EXT.test(url)) return true;
  // Supabase Storage public object urls — only when not clearly an image.
  if (url.includes("/storage/v1/object/public/") && !IMAGE_EXT.test(url)) return true;
  return false;
}

/** True when the url points at an image file. */
export function isImageUrl(url?: string | null): boolean {
  return !!url && IMAGE_EXT.test(url);
}

/** Best-effort media kind from a pasted url; null when ambiguous. */
export function inferKindFromUrl(url?: string | null): MediaKind | null {
  if (!url) return null;
  if (IMAGE_EXT.test(url)) return "image";
  if (VIDEO_EXT.test(url) || youtubeId(url)) return "video";
  if (url.includes("/storage/v1/object/public/")) return "video";
  return null;
}

/** Extract a YouTube video id from embed/watch/short urls, else null. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/** A poster image url for an embed video (YouTube only), else null. */
export function videoPoster(url?: string | null): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
