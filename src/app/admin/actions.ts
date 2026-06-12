"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import type { MediaKind } from "@/lib/types";

const MEDIA_KINDS: MediaKind[] = ["image", "video"];

export interface ResourceInput {
  id?: string;
  title: string;
  prompt: string;
  word: string;
  mediaUrl: string;
  mediaKind: MediaKind;
  enabled: boolean;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function guard() {
  const user = await getAdminUser();
  if (!user) throw new Error("Not authorized");
  return user;
}

function validate(input: ResourceInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!input.prompt.trim()) return "Prompt is required.";
  if (!input.word.trim()) return "Unlock word is required.";
  if (!input.mediaUrl.trim()) return "Media is required — upload a file or paste a URL.";
  if (!MEDIA_KINDS.includes(input.mediaKind)) return "Invalid media kind.";
  return null;
}

function toRow(input: ResourceInput) {
  return {
    title: input.title.trim(),
    prompt: input.prompt.trim(),
    word: input.word.trim().toUpperCase(),
    media_url: input.mediaUrl.trim() || null,
    media_kind: input.mediaKind,
    enabled: input.enabled,
  };
}

export async function saveResource(input: ResourceInput): Promise<ActionResult> {
  try {
    await guard();
    const err = validate(input);
    if (err) return { ok: false, error: err };

    const supabase = await createClient();
    const row = toRow(input);
    const res = input.id
      ? await supabase.from("resources").update(row).eq("id", input.id)
      : await supabase.from("resources").insert(row);
    if (res.error) return { ok: false, error: res.error.message };

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteResource(id: string): Promise<ActionResult> {
  try {
    await guard();
    const supabase = await createClient();
    // best-effort: drop the uploaded media file from storage before the row goes
    const { data: row } = await supabase
      .from("resources")
      .select("media_url")
      .eq("id", id)
      .maybeSingle();
    const path = storagePathFromUrl(row?.media_url ?? null);
    if (path) await supabase.storage.from("videos").remove([path]);

    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Extract the storage object path from a public `videos` bucket URL, else null. */
function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/videos/";
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

export async function toggleResource(id: string, enabled: boolean): Promise<ActionResult> {
  try {
    await guard();
    const supabase = await createClient();
    const { error } = await supabase.from("resources").update({ enabled }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
