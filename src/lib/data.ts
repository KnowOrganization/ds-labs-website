// Server-side data access for resources. Resolves the live Universe by taking
// the static cluster scaffold, filtering to flag-enabled clusters, and filling
// cards from the Supabase `resources` table. No static card content.

import { isClusterEnabled } from "./flags";
import { STATIC_UNIVERSE } from "./universe";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type { Cluster, ResourceCard, ResourceRow, Universe } from "./types";

function rowToCard(row: ResourceRow): ResourceCard {
  // `??` guards keep the page alive if the DB migration hasn't run yet.
  return {
    id: row.id,
    cluster: row.media_kind === "image" ? "prompts" : "videos",
    title: row.title,
    prompt: row.prompt ?? "",
    word: row.word,
    mediaUrl: row.media_url ?? "",
    mediaKind: row.media_kind ?? "video",
  };
}

async function fetchRows(opts: { onlyEnabled: boolean }): Promise<ResourceRow[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    if (opts.onlyEnabled) query = query.eq("enabled", true);
    const { data, error } = await query;
    if (error) throw error;
    return (data as ResourceRow[]) ?? [];
  } catch (err) {
    // Table missing / network issue — render empty clusters.
    console.warn("[data] Supabase fetch failed:", err);
    return null;
  }
}

/** Public universe for the home page — flag-filtered, Supabase-fed. */
export async function getUniverse(): Promise<Universe> {
  const rows = await fetchRows({ onlyEnabled: true });
  const byCluster = new Map<string, ResourceCard[]>();
  if (rows) {
    for (const row of rows) {
      const card = rowToCard(row);
      const list = byCluster.get(card.cluster) ?? [];
      list.push(card);
      byCluster.set(card.cluster, list);
    }
  }

  const clusters: Cluster[] = STATIC_UNIVERSE.clusters
    .filter((c) => isClusterEnabled(c.id))
    .map((c) => ({ ...c, cards: byCluster.get(c.id) ?? [] }));

  return { ...STATIC_UNIVERSE, clusters };
}

/** All rows for the admin table (includes disabled). Null if not configured. */
export async function getAllResources(): Promise<ResourceRow[] | null> {
  return fetchRows({ onlyEnabled: false });
}
