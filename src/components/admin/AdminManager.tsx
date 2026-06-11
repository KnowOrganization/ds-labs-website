"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ResourceRow } from "@/lib/types";
import {
  saveResource,
  deleteResource,
  toggleResource,
  seedDefaults,
  type ResourceInput,
} from "@/app/admin/actions";

const CLUSTERS = ["prompts", "videos", "products", "notion", "tools", "code", "vault"];
const TYPES = ["prompt", "video", "product", "template", "tool", "code", "link"];

const EMPTY: ResourceInput = {
  cluster: "prompts",
  type: "prompt",
  title: "",
  sub: "",
  meta: "",
  word: "",
  url: "",
  videoUrl: "",
  enabled: true,
  sort: 0,
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
      cluster: row.cluster,
      type: row.type,
      title: row.title,
      sub: row.sub,
      meta: row.meta,
      word: row.word,
      url: row.url ?? "",
      videoUrl: row.video_url ?? "",
      enabled: row.enabled,
      sort: row.sort,
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

  return (
    <>
      {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

      <form className="editor-card" onSubmit={onSubmit}>
        <h2>{editingId ? "Edit resource" : "New resource"}</h2>
        <div className="grid-2">
          <div className="field">
            <label>Cluster</label>
            <select value={form.cluster} onChange={(e) => set("cluster", e.target.value)}>
              {CLUSTERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field span-2">
            <label>Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="field span-2">
            <label>Subtitle</label>
            <input value={form.sub} onChange={(e) => set("sub", e.target.value)} />
          </div>
          <div className="field">
            <label>Meta (e.g. SALES · 9 prompts)</label>
            <input value={form.meta} onChange={(e) => set("meta", e.target.value)} />
          </div>
          <div className="field">
            <label>Unlock word</label>
            <input value={form.word} onChange={(e) => set("word", e.target.value)} required />
          </div>
          <div className="field">
            <label>Link URL</label>
            <input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
          </div>
          <div className="field">
            <label>Video URL (embed)</label>
            <input
              value={form.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
            />
          </div>
          <div className="field">
            <label>Sort</label>
            <input
              type="number"
              value={form.sort}
              onChange={(e) => set("sort", Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Enabled</label>
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
            {pending ? "…" : editingId ? "Save changes" : "Create resource"}
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
          <div className="empty-state">
            No resources yet.{" "}
            <button
              className="btn-line"
              onClick={() => run(seedDefaults, "Seeded default prompts & videos.")}
              disabled={pending}
            >
              Seed prompts &amp; videos
            </button>
          </div>
        ) : (
          <table className="res-table">
            <thead>
              <tr>
                <th>Title</th>
                <th className="hide-sm">Cluster</th>
                <th className="hide-sm">Type</th>
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
                  <td className="hide-sm"><span className="badge">{row.cluster}</span></td>
                  <td className="hide-sm"><span className="badge">{row.type}</span></td>
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
