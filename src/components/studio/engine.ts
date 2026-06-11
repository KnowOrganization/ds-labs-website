// Spatial world engine: pan (drag+inertia), zoom (wheel/pinch), clamp,
// warp-to-cluster, minimap, search, and card-open centring. Ported from the
// design prototype (js/world.js) and made data-driven + framework-agnostic.
import { gsap } from "gsap";
import type { ResourceCard, Universe } from "@/lib/types";
import { isFileVideo, videoPoster } from "@/lib/video";
import { initBackground, type Background, type WorldState } from "./background";

interface LaidCard {
  card: ResourceCard;
  clusterColor: string;
  clusterLabel: string;
  clusterKicker: string;
  x: number;
  y: number;
  w: number;
  el: HTMLButtonElement;
}

export interface StudioEngine {
  goHome: () => void;
  warpTo: (id: string) => void;
  centerOnCard: (card: ResourceCard) => void;
  clearActive: () => void;
  destroy: () => void;
}

export interface StudioOptions {
  root: HTMLElement;
  universe: Universe;
  onOpenCard: (card: ResourceCard) => void;
  onCloseCard: () => void;
}

export function initStudio(opts: StudioOptions): StudioEngine {
  const { root, universe: U, onOpenCard, onCloseCard } = opts;
  const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T | null;

  const world = $("#world") as HTMLElement;
  const viewport = $("#viewport") as HTMLElement;

  const S: WorldState = { x: 0, y: 0, scale: 0.62 };
  const SMIN = 0.26;
  const SMAX = 1.25;
  const laid: LaidCard[] = [];
  const cardEls = new Map<string, LaidCard>();

  /* ---------------- layout ---------------- */
  const layout = new Map<string, { x: number; y: number; w: number }>();
  U.clusters.forEach((cl) => {
    const n = cl.cards.length;
    const cols = n <= 4 ? 2 : 3;
    // taller rows when a cluster shows video thumbnails so cards don't overlap
    const hasMedia = cl.cards.some((c) => c.type === "video" && c.videoUrl);
    const cellW = 286, cellH = hasMedia ? 326 : 188, gx = 24, gy = 24;
    const gw = cols * cellW + (cols - 1) * gx;
    const startX = cl.anchor.x - gw / 2;
    const startY = cl.anchor.y + 104;
    cl.cards.forEach((c, i) => {
      const r = Math.floor(i / cols), col = i % cols;
      layout.set(c.id, {
        x: startX + col * (cellW + gx),
        y: startY + r * (cellH + gy) + (col % 2 ? 16 : 0),
        w: cellW,
      });
    });
  });

  /* ---------------- build DOM (idempotent — StrictMode re-mounts) ---------------- */
  world.innerHTML = "";
  U.clusters.forEach((cl) => {
    const lab = document.createElement("div");
    lab.className = "cluster-label";
    lab.style.left = cl.anchor.x + "px";
    lab.style.top = cl.anchor.y + "px";
    lab.style.setProperty("--accent", cl.color);
    lab.innerHTML = `<span class="kick">${esc(cl.kicker)}</span><span class="big">${esc(cl.label)}</span><span class="blurb">${esc(cl.blurb)}</span>`;
    world.appendChild(lab);
  });
  U.clusters.forEach((cl) => {
    cl.cards.forEach((c) => {
      const pos = layout.get(c.id)!;
      const el = document.createElement("button");
      el.className = "node";
      el.style.left = pos.x + "px";
      el.style.top = pos.y + "px";
      el.style.width = pos.w + "px";
      el.style.setProperty("--accent", cl.color);
      const arrow = c.type === "video" ? "▷" : "↗";
      const media = mediaHtml(c);
      if (media) el.classList.add("has-media");
      el.innerHTML = `
        ${media}
        <span class="node-meta"><span class="dot"></span>${esc(c.meta)}</span>
        <span class="node-title">${esc(c.title)}</span>
        <span class="node-sub">${esc(c.sub)}</span>
        <span class="node-foot"><span class="word">💬 “${esc(c.word)}”</span><span class="arrow">${arrow}</span></span>`;
      el.addEventListener("click", () => {
        if (!dragMoved) onOpenCard(c);
      });
      // hover-preview for uploaded video files
      const vid = el.querySelector("video");
      if (vid) {
        el.addEventListener("pointerenter", () => {
          vid.loop = true;
          void vid.play().catch(() => {});
        });
        el.addEventListener("pointerleave", () => {
          vid.pause();
          try { vid.currentTime = 0.1; } catch { /* not seekable yet */ }
        });
      }
      world.appendChild(el);
      const lc: LaidCard = {
        card: c, clusterColor: cl.color, clusterLabel: cl.label, clusterKicker: cl.kicker,
        x: pos.x, y: pos.y, w: pos.w, el,
      };
      laid.push(lc);
      cardEls.set(c.id, lc);
    });
  });
  // brand centre node
  const brand = document.createElement("div");
  brand.className = "brand-node";
  brand.style.left = U.brand.x + "px";
  brand.style.top = U.brand.y + "px";
  brand.innerHTML = `
    <div class="bn-inner">
      <span class="bn-kick">DS&nbsp;LABS</span>
      <div class="bn-title">
        <span class="mask"><span class="ln">Resource</span></span>
        <span class="mask"><span class="ln">Studio</span></span>
      </div>
      <p class="bn-sub">A quiet galaxy of prompts &amp; videos from the feed.<br>Drag to roam — tap a star to open it.</p>
    </div>`;
  world.appendChild(brand);

  /* ---------------- transform ---------------- */
  let prevVW = window.innerWidth, prevVH = window.innerHeight;
  function apply() {
    world.style.transform = `translate3d(${S.x}px,${S.y}px,0) scale(${S.scale})`;
    updateMinimap();
  }
  function clamp() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const ww = U.world.w * S.scale, wh = U.world.h * S.scale;
    const m = Math.min(vw, vh) * 0.45;
    if (ww <= vw) S.x = (vw - ww) / 2;
    else S.x = Math.min(m, Math.max(vw - ww - m, S.x));
    if (wh <= vh) S.y = (vh - wh) / 2;
    else S.y = Math.min(m, Math.max(vh - wh - m, S.y));
  }
  function centreOn(wx: number, wy: number, scale?: number, animate?: boolean) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const tScale = Math.max(SMIN, Math.min(SMAX, scale ?? S.scale));
    const target = { scale: tScale, x: vw / 2 - wx * tScale, y: vh / 2 - wy * tScale };
    if (animate) {
      gsap.to(S, {
        x: target.x, y: target.y, scale: target.scale, duration: 1.1,
        ease: "power3.inOut", onUpdate: () => { clamp(); apply(); },
      });
    } else {
      Object.assign(S, target); clamp(); apply();
    }
  }

  /* ---------------- pan / inertia ---------------- */
  let dragging = false, dragMoved = false, lastX = 0, lastY = 0, vX = 0, vY = 0;
  let inertiaRaf: number | null = null;
  function onDown(e: PointerEvent) {
    if ((e.target as Element).closest(".minimap, .detail, .warp-bar, .topbar, .controls")) return;
    dragging = true; dragMoved = false;
    gsap.killTweensOf(S);
    if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
    lastX = e.clientX; lastY = e.clientY; vX = vY = 0;
    viewport.classList.add("grabbing");
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved = true;
    S.x += dx; S.y += dy; vX = dx; vY = dy;
    lastX = e.clientX; lastY = e.clientY;
    clamp(); apply();
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("grabbing");
    function decay() {
      vX *= 0.92; vY *= 0.92;
      S.x += vX; S.y += vY;
      clamp(); apply();
      if (Math.abs(vX) > 0.2 || Math.abs(vY) > 0.2) inertiaRaf = requestAnimationFrame(decay);
    }
    if (Math.abs(vX) > 1 || Math.abs(vY) > 1) decay();
  }

  /* ---------------- zoom ---------------- */
  function zoomAt(sx: number, sy: number, factor: number) {
    const ns = Math.max(SMIN, Math.min(SMAX, S.scale * factor));
    const wx = (sx - S.x) / S.scale, wy = (sy - S.y) / S.scale;
    S.scale = ns;
    S.x = sx - wx * ns; S.y = sy - wy * ns;
    clamp(); apply();
  }
  function onWheel(e: WheelEvent) {
    if ((e.target as Element).closest(".detail, .minimap")) return;
    e.preventDefault();
    gsap.killTweensOf(S);
    const f = e.deltaY < 0 ? 1.12 : 0.89;
    zoomAt(e.clientX, e.clientY, f);
  }

  /* ---------------- pinch ---------------- */
  let pinchD = 0, pinchMid: { x: number; y: number } | null = null;
  const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const mid = (t: TouchList) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
  function touchStart(e: TouchEvent) {
    if (e.touches.length === 2) { dragging = false; pinchD = dist(e.touches); pinchMid = mid(e.touches); }
  }
  function touchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = dist(e.touches);
      if (pinchD && pinchMid) zoomAt(pinchMid.x, pinchMid.y, d / pinchD);
      pinchD = d; pinchMid = mid(e.touches);
    }
  }

  /* ---------------- minimap ---------------- */
  const mini = $(".minimap") as HTMLElement | null;
  const miniView = $(".minimap .mini-view") as HTMLElement | null;
  const MW = 168, MH = MW * (U.world.h / U.world.w);
  if (mini) {
    mini.style.setProperty("--mh", MH + "px");
    mini.querySelectorAll(".mini-dot").forEach((d) => d.remove());
    U.clusters.forEach((cl) => {
      const d = document.createElement("span");
      d.className = "mini-dot";
      d.style.left = (cl.anchor.x / U.world.w) * MW + "px";
      d.style.top = (cl.anchor.y / U.world.h) * MH + "px";
      d.style.background = cl.color;
      d.title = cl.label;
      d.addEventListener("click", () => warpTo(cl.id));
      mini.appendChild(d);
    });
    mini.addEventListener("click", (e) => {
      if ((e.target as Element).classList.contains("mini-dot")) return;
      const r = mini.getBoundingClientRect();
      const wx = ((e.clientX - r.left) / MW) * U.world.w;
      const wy = ((e.clientY - r.top) / MH) * U.world.h;
      centreOn(wx, wy, Math.max(S.scale, 0.6), true);
    });
  }
  function updateMinimap() {
    if (!miniView) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const wx = -S.x / S.scale, wy = -S.y / S.scale;
    miniView.style.left = (wx / U.world.w) * MW + "px";
    miniView.style.top = (wy / U.world.h) * MH + "px";
    miniView.style.width = ((vw / S.scale) / U.world.w) * MW + "px";
    miniView.style.height = ((vh / S.scale) / U.world.h) * MH + "px";
  }

  /* ---------------- warp ---------------- */
  function warpTo(id: string) {
    const cl = U.clusters.find((c) => c.id === id);
    if (!cl) return;
    centreOn(cl.anchor.x, cl.anchor.y + 150, 0.78, true);
    root.querySelectorAll(".warp-bar button").forEach((b) =>
      b.classList.toggle("active", (b as HTMLElement).dataset.id === id));
  }
  function goHome() {
    centreOn(U.brand.x, U.brand.y, 0.62, true);
    root.querySelectorAll(".warp-bar button").forEach((b) => b.classList.remove("active"));
  }

  /* ---------------- card centring + active ---------------- */
  let activeEl: HTMLElement | null = null;
  function centerOnCard(card: ResourceCard) {
    const lc = cardEls.get(card.id);
    if (!lc) return;
    centreOn(lc.x + lc.w / 2, lc.y + 90, Math.max(S.scale, 0.7), true);
    if (activeEl) activeEl.classList.remove("is-open");
    lc.el.classList.add("is-open");
    activeEl = lc.el;
  }
  function clearActive() {
    if (activeEl) activeEl.classList.remove("is-open");
    activeEl = null;
  }

  /* ---------------- search ---------------- */
  const search = $("#search") as HTMLInputElement | null;
  const searchCount = $("#search-count") as HTMLElement | null;
  function runSearch(q: string): LaidCard | null {
    q = q.trim().toLowerCase();
    if (!q) {
      laid.forEach((c) => c.el.classList.remove("dim", "hit"));
      if (searchCount) searchCount.textContent = "";
      return null;
    }
    let first: LaidCard | null = null, n = 0;
    laid.forEach((c) => {
      const hay = `${c.card.title} ${c.card.sub} ${c.card.meta} ${c.card.word} ${c.clusterLabel}`.toLowerCase();
      const hit = hay.includes(q);
      c.el.classList.toggle("dim", !hit);
      c.el.classList.toggle("hit", hit);
      if (hit) { n++; if (!first) first = c; }
    });
    if (searchCount) searchCount.textContent = n ? `${n} found` : "nothing — try “prompt”";
    return first;
  }
  function onSearchInput() {
    if (search) runSearch(search.value);
  }

  /* ---------------- keyboard ---------------- */
  function onKey(e: KeyboardEvent) {
    if (e.target === search) {
      if (e.key === "Enter") {
        const f = runSearch(search!.value);
        if (f) centreOn(f.x + f.w / 2, f.y + 90, 0.85, true);
      }
      if (e.key === "Escape") { search!.value = ""; runSearch(""); search!.blur(); }
      return;
    }
    if (e.key === "Escape") onCloseCard();
    if (e.key === "0" || e.key.toLowerCase() === "h") goHome();
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= U.clusters.length) warpTo(U.clusters[num - 1].id);
  }

  /* ---------------- warp chips ---------------- */
  const chips = $(".warp-bar .chips") as HTMLElement | null;
  if (chips) {
    chips.querySelectorAll("[data-id]").forEach((b) => b.remove());
    U.clusters.forEach((cl) => {
      const b = document.createElement("button");
      b.dataset.id = cl.id;
      b.style.setProperty("--accent", cl.color);
      b.innerHTML = `<span class="cdot"></span>${esc(cl.label)}`;
      b.addEventListener("click", () => warpTo(cl.id));
      chips.appendChild(b);
    });
  }

  /* ---------------- wire HUD controls ---------------- */
  const homeBtn = $(".home-btn") as HTMLElement | null;
  const overview = $(".overview-btn") as HTMLElement | null;
  homeBtn?.addEventListener("click", goHome);
  overview?.addEventListener("click", () => centreOn(U.world.w / 2, U.world.h / 2, SMIN + 0.02, true));
  search?.addEventListener("input", onSearchInput);

  /* ---------------- events ---------------- */
  viewport.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  viewport.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("touchstart", touchStart, { passive: false });
  viewport.addEventListener("touchmove", touchMove, { passive: false });
  window.addEventListener("keydown", onKey);
  function onResize() {
    const cwx = (prevVW / 2 - S.x) / S.scale;
    const cwy = (prevVH / 2 - S.y) / S.scale;
    prevVW = window.innerWidth; prevVH = window.innerHeight;
    centreOn(cwx, cwy, S.scale, false);
    bg?.resize();
  }
  window.addEventListener("resize", onResize);

  /* ---------------- background + boot ---------------- */
  let bg: Background | null = null;
  centreOn(U.brand.x, U.brand.y, 0.62, false);
  const bgCanvas = $("#bg-canvas") as HTMLCanvasElement | null;
  if (bgCanvas) {
    try {
      bg = initBackground(bgCanvas, brand, () => S);
      bg.start();
    } catch {
      // WebGL unavailable — studio still works without the orb.
      bg = null;
    }
  }

  // brand hero entrance + idle float (award-y: masked line reveal)
  const bnInner = brand.querySelector(".bn-inner") as HTMLElement | null;
  const bnKick = brand.querySelector(".bn-kick");
  const bnLines = brand.querySelectorAll(".bn-title .ln");
  const bnSub = brand.querySelector(".bn-sub");
  gsap.set([bnKick, bnSub], { y: 18, opacity: 0 });
  gsap.set(bnLines, { yPercent: 115 });
  const heroTl = gsap.timeline({ delay: 0.25 });
  heroTl
    .to(bnKick, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" })
    .to(bnLines, { yPercent: 0, duration: 1.05, stagger: 0.12, ease: "power4.out" }, "-=0.35")
    .to(bnSub, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "-=0.55");
  if (bnInner) {
    gsap.to(bnInner, { y: -10, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.2 });
  }

  // HUD entrance + hint
  gsap.fromTo(root.querySelectorAll(".fade-in"),
    { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power2.out", delay: 0.4 });
  const hint = $(".explore-hint") as HTMLElement | null;
  function killHint() {
    if (hint) gsap.to(hint, { opacity: 0, duration: 0.5 });
    window.removeEventListener("pointerdown", killHint);
    window.removeEventListener("wheel", killHint);
  }
  window.addEventListener("pointerdown", killHint);
  window.addEventListener("wheel", killHint);

  /* ---------------- destroy ---------------- */
  function destroy() {
    gsap.killTweensOf(S);
    if (bnInner) gsap.killTweensOf(bnInner);
    heroTl.kill();
    if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
    bg?.stop();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointerdown", killHint);
    window.removeEventListener("wheel", killHint);
    // remove engine-created DOM so a StrictMode re-mount rebuilds cleanly
    world.innerHTML = "";
    chips?.querySelectorAll("[data-id]").forEach((b) => b.remove());
    mini?.querySelectorAll(".mini-dot").forEach((d) => d.remove());
  }

  return { goHome, warpTo, centerOnCard, clearActive, destroy };
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/** Thumbnail markup for a video card: native <video> frame (uploads) or a
 *  YouTube poster <img> (embeds). Empty string for non-video / no source. */
function mediaHtml(c: ResourceCard): string {
  if (c.type !== "video" || !c.videoUrl) return "";
  const play = `<span class="node-play">▷</span>`;
  if (isFileVideo(c.videoUrl)) {
    // "#t=0.1" nudges the player to render the first frame as a poster
    return `<span class="node-media"><video src="${esc(c.videoUrl)}#t=0.1" muted playsinline preload="metadata"></video>${play}</span>`;
  }
  const poster = videoPoster(c.videoUrl);
  if (poster) {
    return `<span class="node-media"><img src="${esc(poster)}" alt="" loading="lazy" />${play}</span>`;
  }
  return `<span class="node-media node-media-blank">${play}</span>`;
}
