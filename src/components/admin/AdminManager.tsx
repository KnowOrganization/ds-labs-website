"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ResourceRow } from "@/lib/types";
import { inferKindFromUrl } from "@/lib/video";
import {
  saveResource,
  deleteResource,
  toggleResource,
  type ResourceInput,
} from "@/app/admin/actions";
import MediaUploader from "./MediaUploader";

const EMPTY: ResourceInput = {
  title: "",
  prompt: "",
  word: "",
  mediaUrl: "",
  mediaKind: "video",
  enabled: true,
};

export default function AdminManager({ rows }: { rows: ResourceRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ResourceInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  function set<K extends keyof ResourceInput>(key: K, value: ResourceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(EMPTY);
    setEditingId(null);
  }

  function edit(row: ResourceRow) {
    setEditingId(row.id);
    setForm({
      id: row.id,
      title: row.title,
      prompt: row.prompt,
      word: row.word,
      mediaUrl: row.media_url ?? "",
      mediaKind: row.media_kind,
      enabled: row.enabled,
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setMsg({ kind: "ok", text: okText });
        router.refresh();
      } else {
        setMsg({ kind: "error", text: res.error ?? "Something went wrong." });
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(() => saveResource(form), editingId ? "Saved." : "Created.");
    if (!editingId) reset();
  }

  function onMediaUrlChange(url: string) {
    set("mediaUrl", url);
    const kind = inferKindFromUrl(url);
    if (kind) set("mediaKind", kind);
  }

  return (
    <>
      {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

      <form className="editor-card" onSubmit={onSubmit}>
        <h2>{editingId ? "Edit drop" : "New drop"}</h2>
        <div className="grid-2">
          <div className="field span-2">
            <label>Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="field span-2">
            <label>Prompt</label>
            <textarea
              value={form.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              placeholder="Paste the full prompt that generated the media…"
              rows={7}
              required
            />
          </div>
          <div className="field span-2">
            <label>Media — the generated image or video</label>
            <MediaUploader
              value={form.mediaUrl}
              onUploaded={({ url, kind }) => {
                set("mediaUrl", url);
                set("mediaKind", kind);
              }}
            />
            <small style={{ color: "var(--faint)", fontSize: 11.5, marginTop: 6 }}>
              Upload a file, or paste a direct file / YouTube embed URL below.
              (Instagram links won&apos;t embed.)
            </small>
            <input
              value={form.mediaUrl}
              onChange={(e) => onMediaUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/embed/… or https://…/image.png"
              style={{ marginTop: 6 }}
            />
          </div>
          <div className="field">
            <label>Media kind</label>
            <select
              value={form.mediaKind}
              onChange={(e) => set("mediaKind", e.target.value as ResourceInput["mediaKind"])}
            >
              <option value="image">Image → Prompts cluster</option>
              <option value="video">Video → Videos cluster</option>
            </select>
          </div>
          <div className="field">
            <label>Unlock word</label>
            <input value={form.word} onChange={(e) => set("word", e.target.value)} required />
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={form.enabled ? "1" : "0"}
              onChange={(e) => set("enabled", e.target.value === "1")}
            >
              <option value="1">Live</option>
              <option value="0">Hidden</option>
            </select>
          </div>
        </div>
        <div className="editor-actions">
          <button className="btn-solid grow" type="submit" disabled={pending}>
            {pending ? "…" : editingId ? "Save changes" : "Create drop"}
          </button>
          {editingId && (
            <button type="button" className="btn-line" onClick={reset} disabled={pending}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap">
        {rows.length === 0 ? (
          <div className="empty-state">No drops yet — create one above.</div>
        ) : (
          <table className="res-table">
            <thead>
              <tr>
                <th>Title</th>
                <th className="hide-sm">Media</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="t-title">{row.title}</div>
                    <div className="t-sub">💬 {row.word}</div>
                  </td>
                  <td className="hide-sm"><span className="badge">{row.media_kind}</span></td>
                  <td>
                    <button
                      className={`badge ${row.enabled ? "on" : "off"}`}
                      onClick={() => run(() => toggleResource(row.id, !row.enabled), "Updated.")}
                      disabled={pending}
                      title="Toggle visibility"
                    >
                      {row.enabled ? "live" : "hidden"}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => edit(row)} title="Edit">
                        ✎
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          if (confirm(`Delete “${row.title}”?`))
                            run(() => deleteResource(row.id), "Deleted.");
                        }}
                        disabled={pending}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
