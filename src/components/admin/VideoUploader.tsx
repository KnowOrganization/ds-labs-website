"use client";

import { useRef, useState } from "react";
import { isFileVideo } from "@/lib/video";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateVideoFile, uploadVideo } from "@/lib/supabase/storage";
import styles from "./VideoUploader.module.css";

interface Props {
  value: string;
  onUploaded: (url: string) => void;
}

type Status = "idle" | "uploading" | "done" | "error";

export default function VideoUploader({ value, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const busy = status === "uploading";
  const hasFilePreview = isFileVideo(value);

  function openPicker() {
    if (busy) return;
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);

    const invalid = validateVideoFile(file);
    if (invalid) {
      setStatus("error");
      setError(invalid);
      return;
    }

    setStatus("uploading");
    setPct(0);
    try {
      const { url } = await uploadVideo(file, setPct);
      setStatus("done");
      onUploaded(url);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so picking the same file again re-triggers change.
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  }

  // Unconfigured: render a disabled, non-interactive zone.
  if (!isSupabaseConfigured) {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.zone} ${styles.disabled}`} aria-disabled="true">
          <span className={styles.icon}>🎬</span>
          <span className={styles.primary}>Add Supabase keys to enable uploads.</span>
        </div>
      </div>
    );
  }

  // Already-uploaded file: inline preview + replace affordance.
  if (hasFilePreview && status !== "uploading") {
    return (
      <div className={styles.wrap}>
        <div className={styles.previewWrap}>
          <video className={styles.preview} src={value} muted playsInline preload="metadata" />
          <div className={styles.previewMeta}>
            <span className={styles.previewLabel}>
              {status === "done" ? "✓ Uploaded" : "Uploaded video"}
            </span>
            <button type="button" className={styles.replace} onClick={openPicker}>
              Replace
            </button>
          </div>
        </div>
        {error && <span className={styles.error}>{error}</span>}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className={styles.input}
          onChange={onInputChange}
        />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div
        role="button"
        tabIndex={0}
        aria-busy={busy}
        className={`${styles.zone} ${dragging ? styles.dragging : ""} ${busy ? styles.busy : ""}`}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {status === "uploading" ? (
          <>
            <div className={styles.bar}>
              <div className={styles.fill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.statusRow}>
              <span>Uploading…</span>
              <span>{pct}%</span>
            </div>
          </>
        ) : status === "done" ? (
          <>
            <span className={styles.icon}>✓</span>
            <span className={styles.done}>Uploaded</span>
            <span className={styles.hint}>Click to replace</span>
          </>
        ) : (
          <>
            <span className={styles.icon}>🎬</span>
            <span className={styles.primary}>Drop a video or click to upload</span>
            <span className={styles.hint}>MP4, WebM, MOV · up to 100MB</span>
          </>
        )}
      </div>

      {error && <span className={styles.error}>{error}</span>}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className={styles.input}
        onChange={onInputChange}
      />
    </div>
  );
}
