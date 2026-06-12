// Layout scaffold for the resource studio — cluster metadata only (label,
// color, anchor). Card content always comes from the Supabase `resources`
// table; there is no static card content.

import type { Cluster, Universe } from "./types";

export const WORLD = { w: 4600, h: 3200 };
export const BRAND = { x: 2300, y: 1550 };

// Cluster definitions keyed by id. Anchors chosen so the two live clusters
// (prompts + videos) frame the brand centre symmetrically.
export const CLUSTERS: Cluster[] = [
  {
    id: "prompts",
    label: "Prompts",
    kicker: "PROMPT LIBRARY",
    color: "var(--c-prompts)",
    anchor: { x: 1150, y: 700 },
    blurb: "Copy-paste prompts that actually ship.",
    cards: [],
  },
  {
    id: "videos",
    label: "Videos",
    kicker: "WATCH & BUILD",
    color: "var(--c-tools)",
    anchor: { x: 3470, y: 700 },
    blurb: "Short builds and breakdowns from the feed.",
    cards: [],
  },
  {
    id: "products",
    label: "Studio Products",
    kicker: "MADE BY DS LABS",
    color: "var(--c-products)",
    anchor: { x: 2300, y: 2750 },
    blurb: "The things we build and actually use.",
    cards: [],
  },
  {
    id: "notion",
    label: "Notion Templates",
    kicker: "DUPLICATE & GO",
    color: "var(--c-notion)",
    anchor: { x: 760, y: 1830 },
    blurb: "Dashboards and systems, one click away.",
    cards: [],
  },
  {
    id: "tools",
    label: "Tools & Stacks",
    kicker: "THE TECH RADAR",
    color: "var(--c-tools)",
    anchor: { x: 3840, y: 1740 },
    blurb: "The stack behind the posts — no sponsored fluff.",
    cards: [],
  },
  {
    id: "code",
    label: "Code & Boilerplates",
    kicker: "CLONE & FORGET",
    color: "var(--c-code)",
    anchor: { x: 1200, y: 2640 },
    blurb: "Starter repos so you skip the boring setup.",
    cards: [],
  },
  {
    id: "vault",
    label: "The Link Vault",
    kicker: "YOU COMMENTED — HERE IT IS",
    color: "var(--c-vault)",
    anchor: { x: 3380, y: 2660 },
    blurb: 'Every "comment for the link", finally searchable.',
    cards: [],
  },
];

export const STATIC_UNIVERSE: Universe = {
  world: WORLD,
  brand: BRAND,
  clusters: CLUSTERS,
};
