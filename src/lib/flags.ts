// Feature-flag system — the single switchboard for what ships.
// Toggle clusters and features here; the data layer + UI read these.
// Each flag can be overridden by a NEXT_PUBLIC_FLAG_* env var (true/false).

import type { ClusterId } from "./types";

type ClusterFlags = Record<ClusterId, boolean>;

interface Flags {
  clusters: ClusterFlags;
  features: {
    search: boolean;
    minimap: boolean;
    follow: boolean;
    auth: boolean;
    admin: boolean;
  };
}

// Defaults: only prompts + videos are live right now. Flip to `true` to launch more.
const DEFAULTS: Flags = {
  clusters: {
    prompts: true,
    videos: true,
    products: false,
    notion: false,
    tools: false,
    code: false,
    vault: false,
  },
  features: {
    search: true,
    minimap: true,
    follow: true,
    auth: true,
    admin: true,
  },
};

function envOverride(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

function build(): Flags {
  const clusters = {} as ClusterFlags;
  (Object.keys(DEFAULTS.clusters) as ClusterId[]).forEach((id) => {
    clusters[id] = envOverride(
      `NEXT_PUBLIC_FLAG_CLUSTER_${id.toUpperCase()}`,
      DEFAULTS.clusters[id],
    );
  });

  const features = { ...DEFAULTS.features };
  (Object.keys(features) as (keyof Flags["features"])[]).forEach((f) => {
    features[f] = envOverride(`NEXT_PUBLIC_FLAG_${f.toUpperCase()}`, features[f]);
  });

  return { clusters, features };
}

export const flags: Flags = build();

export function isClusterEnabled(id: ClusterId): boolean {
  return flags.clusters[id] === true;
}
