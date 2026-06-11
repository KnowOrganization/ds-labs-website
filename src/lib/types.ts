// Shared domain types for the DS Labs resource studio.

export type ClusterId =
  | "prompts"
  | "videos"
  | "products"
  | "notion"
  | "tools"
  | "code"
  | "vault";

export type ResourceType =
  | "prompt"
  | "video"
  | "product"
  | "template"
  | "tool"
  | "code"
  | "link";

export interface ResourceCard {
  id: string;
  cluster: ClusterId;
  type: ResourceType;
  title: string;
  sub: string;
  /** mono meta line, e.g. "SALES · 9 prompts" */
  meta: string;
  /** the "comment WORD to unlock" keyword */
  word: string;
  /** primary outbound link (the unlock destination) */
  url?: string;
  /** video embed/source url — used when type === "video" */
  videoUrl?: string;
}

export interface Cluster {
  id: ClusterId;
  label: string;
  kicker: string;
  /** css color token, e.g. "var(--c-prompts)" */
  color: string;
  anchor: { x: number; y: number };
  blurb: string;
  cards: ResourceCard[];
}

export interface Universe {
  world: { w: number; h: number };
  brand: { x: number; y: number };
  clusters: Cluster[];
}

/** Row shape of the Supabase `resources` table. */
export interface ResourceRow {
  id: string;
  cluster: ClusterId;
  type: ResourceType;
  title: string;
  sub: string;
  meta: string;
  word: string;
  url: string | null;
  video_url: string | null;
  enabled: boolean;
  sort: number;
  created_at: string;
}
