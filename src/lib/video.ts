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
