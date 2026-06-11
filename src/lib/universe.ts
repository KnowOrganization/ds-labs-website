// Static content model for the resource studio — the default/offline source of
// truth. Cluster metadata (label, color, anchor) lives here permanently; card
// content can be overridden at runtime by the Supabase `resources` table.

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
    cards: [
      { id: "prompts-closer", cluster: "prompts", type: "prompt", title: "The Cold-DM Closer", sub: "Slides into inboxes, not spam folders.", meta: "SALES · 9 prompts", word: "CLOSER" },
      { id: "prompts-thumb", cluster: "prompts", type: "prompt", title: "Thumbnail Brain", sub: "Hooks your scroll-thumb in one line.", meta: "YOUTUBE · 6 prompts", word: "THUMB" },
      { id: "prompts-gremlin", cluster: "prompts", type: "prompt", title: "Refactor Gremlin", sub: "Turns spaghetti code into linguine.", meta: "CODE · system prompt", word: "GREMLIN" },
      { id: "prompts-voice", cluster: "prompts", type: "prompt", title: "Brand Voice Cloner", sub: "Sounds like you — but caffeinated.", meta: "WRITING · 4 prompts", word: "VOICE" },
      { id: "prompts-notes", cluster: "prompts", type: "prompt", title: "Meeting → Money", sub: "Notes that turn into action items.", meta: "OPS · 5 prompts", word: "NOTES" },
      { id: "prompts-ideas", cluster: "prompts", type: "prompt", title: "The Idea Slot Machine", sub: "Pull the lever, get 20 angles.", meta: "CONTENT · 1 mega-prompt", word: "IDEAS" },
    ],
  },
  {
    id: "videos",
    label: "Videos",
    kicker: "WATCH & BUILD",
    color: "var(--c-tools)",
    anchor: { x: 3470, y: 700 },
    blurb: "Short builds and breakdowns from the feed.",
    cards: [
      { id: "videos-ship", cluster: "videos", type: "video", title: "Ship in 60 Seconds", sub: "From blank repo to live demo, fast.", meta: "BUILD · 4 min", word: "SHIP", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "videos-promptflow", cluster: "videos", type: "video", title: "Prompt Flow Teardown", sub: "How the viral prompt actually works.", meta: "PROMPTS · 7 min", word: "FLOW", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "videos-stack", cluster: "videos", type: "video", title: "My Whole Stack", sub: "Every tool behind the posts.", meta: "TOOLS · 9 min", word: "STACK", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "videos-edit", cluster: "videos", type: "video", title: "One Clip, Thirty Posts", sub: "The repurposing pipeline, shown.", meta: "CONTENT · 5 min", word: "REMIX", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ],
  },
  {
    id: "products",
    label: "Studio Products",
    kicker: "MADE BY DS LABS",
    color: "var(--c-products)",
    anchor: { x: 2300, y: 2750 },
    blurb: "The things we build and actually use.",
    cards: [
      { id: "products-deck", cluster: "products", type: "product", title: "PromptDeck", sub: "Our flagship prompt vault, organised.", meta: "SAAS · live", word: "DECK" },
      { id: "products-ship", cluster: "products", type: "product", title: "ShipKit", sub: "The boilerplate behind every demo.", meta: "STARTER · v3", word: "SHIP" },
      { id: "products-remix", cluster: "products", type: "product", title: "Reel Remix", sub: "One video → thirty posts. Quietly.", meta: "TOOL · beta", word: "REMIX" },
      { id: "products-metrics", cluster: "products", type: "product", title: "MemeMetrics", sub: "Analytics for chronically online brands.", meta: "SAAS · waitlist", word: "METRICS" },
    ],
  },
  {
    id: "notion",
    label: "Notion Templates",
    kicker: "DUPLICATE & GO",
    color: "var(--c-notion)",
    anchor: { x: 760, y: 1830 },
    blurb: "Dashboards and systems, one click away.",
    cards: [
      { id: "notion-os", cluster: "notion", type: "template", title: "The Creator OS", sub: "Your whole brand in a single page.", meta: "SYSTEM · free", word: "OS" },
      { id: "notion-cal", cluster: "notion", type: "template", title: "Content Calendar 3000", sub: "Post like you have a whole team.", meta: "PLANNER · free", word: "CAL" },
      { id: "notion-brain", cluster: "notion", type: "template", title: "Second Brain Lite", sub: "Finally find the thing you saved.", meta: "PKM · free", word: "BRAIN" },
      { id: "notion-portal", cluster: "notion", type: "template", title: "Client Portal Kit", sub: "Look expensive. Charge accordingly.", meta: "BUSINESS · pro", word: "PORTAL" },
      { id: "notion-launch", cluster: "notion", type: "template", title: "Launch Checklist", sub: "Don't forget the actual buy button.", meta: "OPS · free", word: "LAUNCH" },
    ],
  },
  {
    id: "tools",
    label: "Tools & Stacks",
    kicker: "THE TECH RADAR",
    color: "var(--c-tools)",
    anchor: { x: 3840, y: 1740 },
    blurb: "The stack behind the posts — no sponsored fluff.",
    cards: [
      { id: "tools-ide", cluster: "tools", type: "tool", title: "Vibe-Coding IDE", sub: "Ship before the coffee goes cold.", meta: "DEV · freemium", word: "IDE" },
      { id: "tools-vidgen", cluster: "tools", type: "tool", title: "One-Prompt Video", sub: "Text in, finished edit out.", meta: "VIDEO · paid", word: "VIDGEN" },
      { id: "tools-clone", cluster: "tools", type: "tool", title: "Voice Clone Studio", sub: "Your voice, zero recording shame.", meta: "AUDIO · freemium", word: "CLONE" },
      { id: "tools-inbox", cluster: "tools", type: "tool", title: "Inbox Autopilot", sub: "Replies while you doomscroll.", meta: "PRODUCTIVITY · paid", word: "INBOX" },
      { id: "tools-thumbai", cluster: "tools", type: "tool", title: "Auto-Thumbnail AI", sub: "Stop opening Canva at 2am.", meta: "DESIGN · freemium", word: "THUMBAI" },
      { id: "tools-scrape", cluster: "tools", type: "tool", title: "The Scrape Stack", sub: "Data goblin starter pack.", meta: "DATA · open source", word: "SCRAPE" },
    ],
  },
  {
    id: "code",
    label: "Code & Boilerplates",
    kicker: "CLONE & FORGET",
    color: "var(--c-code)",
    anchor: { x: 1200, y: 2640 },
    blurb: "Starter repos so you skip the boring setup.",
    cards: [
      { id: "code-saas", cluster: "code", type: "code", title: "SaaS Starter", sub: "Auth + payments, already wired up.", meta: "NEXT.JS · MIT", word: "SAAS" },
      { id: "code-landing", cluster: "code", type: "code", title: "Landing in 5", sub: "Copy, paste, flex. Done by lunch.", meta: "HTML · MIT", word: "LANDING" },
      { id: "code-api", cluster: "code", type: "code", title: "API Wrapper Pack", sub: "Stop reading the same docs twice.", meta: "TS · MIT", word: "API" },
      { id: "code-bot", cluster: "code", type: "code", title: "Discord Bot Kit", sub: "Mods are asleep — post boilerplate.", meta: "NODE · MIT", word: "BOT" },
      { id: "code-snippet", cluster: "code", type: "code", title: "Scraper Snippets", sub: "Grab the data, dodge the captcha.", meta: "PY · MIT", word: "SNIPPET" },
      { id: "code-edge", cluster: "code", type: "code", title: "Edge Function Pack", sub: "Serverless bits, batteries included.", meta: "TS · MIT", word: "EDGE" },
    ],
  },
  {
    id: "vault",
    label: "The Link Vault",
    kicker: "YOU COMMENTED — HERE IT IS",
    color: "var(--c-vault)",
    anchor: { x: 3380, y: 2660 },
    blurb: 'Every "comment for the link", finally searchable.',
    cards: [
      { id: "vault-link", cluster: "vault", type: "link", title: "That reel's link", sub: "The one you saved at 1am. Found it.", meta: "FROM @dslabs · jun", word: "LINK" },
      { id: "vault-viral", cluster: "vault", type: "link", title: "The viral prompt", sub: "847k saves can't all be wrong.", meta: "FROM @dslabs · may", word: "VIRAL" },
      { id: "vault-tues", cluster: "vault", type: "link", title: "Tool from Tuesday", sub: "Yes — that exact one.", meta: "FROM @dslabs · may", word: "TUES" },
      { id: "vault-course", cluster: "vault", type: "link", title: "The free course drop", sub: "Zero-dollar energy, full value.", meta: "FROM @dslabs · apr", word: "COURSE" },
      { id: "vault-dm", cluster: "vault", type: "link", title: "Template everyone DMd", sub: 'No more "link pls" in the replies.', meta: "FROM @dslabs · apr", word: "DM" },
      { id: "vault-hack", cluster: "vault", type: "link", title: "The 3am hack", sub: "Cursed, but it works.", meta: "FROM @dslabs · mar", word: "HACK" },
    ],
  },
];

export const STATIC_UNIVERSE: Universe = {
  world: WORLD,
  brand: BRAND,
  clusters: CLUSTERS,
};
