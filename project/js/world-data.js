/* DS Labs Resource Studio — the universe content model.
   A bounded spatial world; clusters are positioned, cards are auto-laid into
   a grid around each cluster anchor by world.js. */
window.DS_UNIVERSE = {
  world: { w: 4600, h: 3200 },
  brand: { x: 2300, y: 1550 },
  clusters: [
    {
      id: 'prompts', label: 'Prompts', kicker: 'PROMPT LIBRARY', color: 'var(--c-prompts)',
      anchor: { x: 1150, y: 700 },
      blurb: 'Copy-paste prompts that actually ship.',
      cards: [
        { title: 'The Cold-DM Closer', sub: 'Slides into inboxes, not spam folders.', meta: 'SALES · 9 prompts', word: 'CLOSER' },
        { title: 'Thumbnail Brain', sub: 'Hooks your scroll-thumb in one line.', meta: 'YOUTUBE · 6 prompts', word: 'THUMB' },
        { title: 'Refactor Gremlin', sub: 'Turns spaghetti code into linguine.', meta: 'CODE · system prompt', word: 'GREMLIN' },
        { title: 'Brand Voice Cloner', sub: 'Sounds like you — but caffeinated.', meta: 'WRITING · 4 prompts', word: 'VOICE' },
        { title: 'Meeting → Money', sub: 'Notes that turn into action items.', meta: 'OPS · 5 prompts', word: 'NOTES' },
        { title: 'The Idea Slot Machine', sub: 'Pull the lever, get 20 angles.', meta: 'CONTENT · 1 mega-prompt', word: 'IDEAS' }
      ]
    },
    {
      id: 'products', label: 'Studio Products', kicker: 'MADE BY DS LABS', color: 'var(--c-products)',
      anchor: { x: 3470, y: 700 },
      blurb: 'The things we build and actually use.',
      cards: [
        { title: 'PromptDeck', sub: 'Our flagship prompt vault, organised.', meta: 'SAAS · live', word: 'DECK' },
        { title: 'ShipKit', sub: 'The boilerplate behind every demo.', meta: 'STARTER · v3', word: 'SHIP' },
        { title: 'Reel Remix', sub: 'One video → thirty posts. Quietly.', meta: 'TOOL · beta', word: 'REMIX' },
        { title: 'MemeMetrics', sub: 'Analytics for chronically online brands.', meta: 'SAAS · waitlist', word: 'METRICS' }
      ]
    },
    {
      id: 'notion', label: 'Notion Templates', kicker: 'DUPLICATE & GO', color: 'var(--c-notion)',
      anchor: { x: 760, y: 1830 },
      blurb: 'Dashboards and systems, one click away.',
      cards: [
        { title: 'The Creator OS', sub: 'Your whole brand in a single page.', meta: 'SYSTEM · free', word: 'OS' },
        { title: 'Content Calendar 3000', sub: 'Post like you have a whole team.', meta: 'PLANNER · free', word: 'CAL' },
        { title: 'Second Brain Lite', sub: 'Finally find the thing you saved.', meta: 'PKM · free', word: 'BRAIN' },
        { title: 'Client Portal Kit', sub: 'Look expensive. Charge accordingly.', meta: 'BUSINESS · pro', word: 'PORTAL' },
        { title: 'Launch Checklist', sub: "Don't forget the actual buy button.", meta: 'OPS · free', word: 'LAUNCH' }
      ]
    },
    {
      id: 'tools', label: 'Tools & Stacks', kicker: 'THE TECH RADAR', color: 'var(--c-tools)',
      anchor: { x: 3840, y: 1740 },
      blurb: 'The stack behind the posts — no sponsored fluff.',
      cards: [
        { title: 'Vibe-Coding IDE', sub: 'Ship before the coffee goes cold.', meta: 'DEV · freemium', word: 'IDE' },
        { title: 'One-Prompt Video', sub: 'Text in, finished edit out.', meta: 'VIDEO · paid', word: 'VIDGEN' },
        { title: 'Voice Clone Studio', sub: 'Your voice, zero recording shame.', meta: 'AUDIO · freemium', word: 'CLONE' },
        { title: 'Inbox Autopilot', sub: 'Replies while you doomscroll.', meta: 'PRODUCTIVITY · paid', word: 'INBOX' },
        { title: 'Auto-Thumbnail AI', sub: 'Stop opening Canva at 2am.', meta: 'DESIGN · freemium', word: 'THUMBAI' },
        { title: 'The Scrape Stack', sub: 'Data goblin starter pack.', meta: 'DATA · open source', word: 'SCRAPE' }
      ]
    },
    {
      id: 'code', label: 'Code & Boilerplates', kicker: 'CLONE & FORGET', color: 'var(--c-code)',
      anchor: { x: 1200, y: 2640 },
      blurb: 'Starter repos so you skip the boring setup.',
      cards: [
        { title: 'SaaS Starter', sub: 'Auth + payments, already wired up.', meta: 'NEXT.JS · MIT', word: 'SAAS' },
        { title: 'Landing in 5', sub: 'Copy, paste, flex. Done by lunch.', meta: 'HTML · MIT', word: 'LANDING' },
        { title: 'API Wrapper Pack', sub: 'Stop reading the same docs twice.', meta: 'TS · MIT', word: 'API' },
        { title: 'Discord Bot Kit', sub: 'Mods are asleep — post boilerplate.', meta: 'NODE · MIT', word: 'BOT' },
        { title: 'Scraper Snippets', sub: 'Grab the data, dodge the captcha.', meta: 'PY · MIT', word: 'SNIPPET' },
        { title: 'Edge Function Pack', sub: 'Serverless bits, batteries included.', meta: 'TS · MIT', word: 'EDGE' }
      ]
    },
    {
      id: 'vault', label: 'The Link Vault', kicker: 'YOU COMMENTED — HERE IT IS', color: 'var(--c-vault)',
      anchor: { x: 3380, y: 2660 },
      blurb: 'Every "comment for the link", finally searchable.',
      cards: [
        { title: "That reel's link", sub: 'The one you saved at 1am. Found it.', meta: 'FROM @dslabs · jun', word: 'LINK' },
        { title: 'The viral prompt', sub: "847k saves can't all be wrong.", meta: 'FROM @dslabs · may', word: 'VIRAL' },
        { title: 'Tool from Tuesday', sub: 'Yes — that exact one.', meta: 'FROM @dslabs · may', word: 'TUES' },
        { title: 'The free course drop', sub: 'Zero-dollar energy, full value.', meta: 'FROM @dslabs · apr', word: 'COURSE' },
        { title: 'Template everyone DMd', sub: 'No more "link pls" in the replies.', meta: 'FROM @dslabs · apr', word: 'DM' },
        { title: 'The 3am hack', sub: 'Cursed, but it works.', meta: 'FROM @dslabs · mar', word: 'HACK' }
      ]
    }
  ]
};
