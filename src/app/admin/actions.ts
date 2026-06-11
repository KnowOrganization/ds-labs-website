"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { CLUSTERS } from "@/lib/universe";
import type { ClusterId, ResourceType } from "@/lib/types";

const CLUSTER_IDS: ClusterId[] = [
  "prompts", "videos", "products", "notion", "tools", "code", "vault",
];
const TYPES: ResourceType[] = [
  "prompt", "video", "product", "template", "tool", "code", "link",
];

export interface ResourceInput {
  id?: string;
  cluster: string;
  type: string;
  title: string;
  sub: string;
  meta: string;
  word: string;
  url: string;
  videoUrl: string;
  enabled: boolean;
  sort: number;
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
  if (!input.word.trim()) return "Unlock word is required.";
  if (!CLUSTER_IDS.includes(input.cluster as ClusterId)) return "Invalid cluster.";
  if (!TYPES.includes(input.type as ResourceType)) return "Invalid type.";
  return null;
}

function toRow(input: ResourceInput) {
  return {
    cluster: input.cluster,
    type: input.type,
    title: input.title.trim(),
    sub: input.sub.trim(),
    meta: input.meta.trim(),
    word: input.word.trim().toUpperCase(),
    url: input.url.trim() || null,
    video_url: input.videoUrl.trim() || null,
    enabled: input.enabled,
    sort: Number.isFinite(input.sort) ? input.sort : 0,
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
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
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

/** One-click seed: insert the static prompts + videos cards if table is empty. */
export async function seedDefaults(): Promise<ActionResult> {
  try {
    await guard();
    const supabase = await createClient();
    const { count } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { ok: false, error: "Table already has rows." };

    const seed = CLUSTERS.filter((c) => c.id === "prompts" || c.id === "videos").flatMap(
      (c) =>
        c.cards.map((card, i) => ({
          cluster: card.cluster,
          type: card.type,
          title: card.title,
          sub: card.sub,
          meta: card.meta,
          word: card.word,
          url: card.url ?? null,
          video_url: card.videoUrl ?? null,
          enabled: true,
          sort: i,
        })),
    );
    const { error } = await supabase.from("resources").insert(seed);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
