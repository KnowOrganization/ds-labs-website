// Shared domain types for the DS Labs resource studio.

export type ClusterId =
  | "prompts"
  | "videos"
  | "products"
  | "notion"
  | "tools"
  | "code"
  | "vault";

export type MediaKind = "image" | "video";

export interface ResourceCard {
  id: string;
  /** derived from mediaKind — image → prompts, video → videos */
  cluster: ClusterId;
  title: string;
  /** the showcased prompt that generated the media */
  prompt: string;
  /** the "comment WORD to unlock" keyword */
  word: string;
  /** generated content url — uploaded file or embed; "" when missing */
  mediaUrl: string;
  mediaKind: MediaKind;
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
  title: string;
  prompt: string;
  word: string;
  media_url: string | null;
  media_kind: MediaKind;
  enabled: boolean;
  created_at: string;
}
