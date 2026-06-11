"use client";

import { createClient } from "./client";
import { isSupabaseConfigured } from "./config";

/** Storage bucket that holds uploaded videos. */
export const VIDEO_BUCKET = "videos";

/** Hard ceiling so a single upload can't balloon storage / bandwidth costs. */
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Cheap, synchronous pre-flight check.
 * Returns a user-facing error message, or null when the file is acceptable.
 */
export function validateVideoFile(file: File): string | null {
  if (!file.type.startsWith("video/")) return "Please choose a video file.";
  if (file.size > MAX_VIDEO_BYTES) return "Video must be under 100MB.";
  return null;
}

/** Shape returned by Supabase's createSignedUploadUrl (typed locally to avoid `any`). */
interface SignedUploadUrl {
  signedUrl: string;
  token: string;
  path: string;
}

/**
 * Derive a safe storage path. Random UUID keeps names collision-free and
 * non-guessable; we only keep a sanitized extension from the original name.
 */
function buildPath(file: File): string {
  const raw = file.name.split(".").pop() ?? "";
  // Keep it short and filesystem/URL-safe; fall back to mp4 when missing.
  const ext = raw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "mp4";
  return `${crypto.randomUUID()}.${ext}`;
}

/**
 * PUT the file to a pre-signed URL via XHR so we can surface real upload
 * progress (fetch can't report request-body progress in browsers).
 */
function putWithProgress(
  signedUrl: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable && e.total > 0) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed: network error."));
    xhr.onabort = () => reject(new Error("Upload aborted."));

    xhr.send(file);
  });
}

/**
 * Upload a video to the `videos` bucket.
 *
 * Preferred path uses a signed upload URL + XHR for real progress events.
 * If signed URLs aren't available (older supabase-js / RLS), we fall back to
 * the SDK's upload(), which can't report progress, so we jump straight to 100%.
 */
export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; path: string }> {
  if (!isSupabaseConfigured) throw new Error("Supabase isn't configured.");

  const invalid = validateVideoFile(file);
  if (invalid) throw new Error(invalid);

  const supabase = createClient();
  const path = buildPath(file);
  const bucket = supabase.storage.from(VIDEO_BUCKET);

  // Prefer signed upload URL for real progress; fall back to SDK upload.
  let signed: SignedUploadUrl | null = null;
  if (typeof bucket.createSignedUploadUrl === "function") {
    try {
      const { data, error } = await bucket.createSignedUploadUrl(path);
      if (error) throw error;
      signed = data;
    } catch {
      // Swallow and fall back to the plain SDK upload below.
      signed = null;
    }
  }

  if (signed) {
    await putWithProgress(signed.signedUrl, file, onProgress);
  } else {
    const { error } = await bucket.upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    onProgress?.(100);
  }

  const url = bucket.getPublicUrl(path).data.publicUrl;
  return { url, path };
}
