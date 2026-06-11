// Helpers to tell an uploaded video file from an embed (YouTube/Vimeo) URL.
// Used by the studio detail panel and the admin uploader.

const FILE_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;

/** True when the url points at a playable file (storage upload or direct .mp4). */
export function isFileVideo(url?: string | null): boolean {
  if (!url) return false;
  if (FILE_EXT.test(url)) return true;
  // Supabase Storage public object urls
  if (url.includes("/storage/v1/object/public/")) return true;
  return false;
}

/** True when the url should be embedded in an iframe (YouTube, Vimeo, etc.). */
export function isEmbedVideo(url?: string | null): boolean {
  return !!url && !isFileVideo(url);
}
