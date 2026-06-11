// Server-side data access for resources. Resolves the live Universe by taking
// the static cluster scaffold, filtering to flag-enabled clusters, and layering
// Supabase rows on top when configured. Degrades to static data otherwise.

import { isClusterEnabled } from "./flags";
import { STATIC_UNIVERSE } from "./universe";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type { Cluster, ResourceCard, ResourceRow, Universe } from "./types";

function rowToCard(row: ResourceRow): ResourceCard {
  return {
    id: row.id,
    cluster: row.cluster,
    type: row.type,
    title: row.title,
    sub: row.sub,
    meta: row.meta,
    word: row.word,
    url: row.url ?? undefined,
    videoUrl: row.video_url ?? undefined,
  };
}

async function fetchRows(opts: { onlyEnabled: boolean }): Promise<ResourceRow[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    let query = supabase.from("resources").select("*").order("sort", { ascending: true });
    if (opts.onlyEnabled) query = query.eq("enabled", true);
    const { data, error } = await query;
    if (error) throw error;
    return (data as ResourceRow[]) ?? [];
  } catch (err) {
    // Table missing / network issue — fall back to static silently.
    console.warn("[data] Supabase fetch failed, using static content:", err);
    return null;
  }
}

/** Public universe for the home page — flag-filtered, Supabase-overridden. */
export async function getUniverse(): Promise<Universe> {
  const rows = await fetchRows({ onlyEnabled: true });
  const byCluster = new Map<string, ResourceCard[]>();
  if (rows) {
    for (const row of rows) {
      const list = byCluster.get(row.cluster) ?? [];
      list.push(rowToCard(row));
      byCluster.set(row.cluster, list);
    }
  }

  const clusters: Cluster[] = STATIC_UNIVERSE.clusters
    .filter((c) => isClusterEnabled(c.id))
    .map((c) => {
      const dbCards = byCluster.get(c.id);
      // Use DB cards when present for this cluster; else keep static seed.
      return dbCards && dbCards.length > 0 ? { ...c, cards: dbCards } : c;
    });

  return { ...STATIC_UNIVERSE, clusters };
}

/** All rows for the admin table (includes disabled). Null if not configured. */
export async function getAllResources(): Promise<ResourceRow[] | null> {
  return fetchRows({ onlyEnabled: false });
}
