/* DS Labs Resource Studio — spatial world engine.
   Pan (drag), zoom (wheel/pinch), inertia, clamp, warp-to-cluster,
   minimap, search, and the card detail overlay. */
(function () {
  const gsap = window.gsap;
  const U = window.DS_UNIVERSE;
  const world = document.getElementById('world');
  const viewport = document.getElementById('viewport');

  const S = { x: 0, y: 0, scale: 0.62 };
  window.DSWorldState = S;
  const SMIN = 0.26, SMAX = 1.25;

  /* ---------------- card layout ---------------- */
  const allCards = [];
  function layout() {
    U.clusters.forEach((cl) => {
      const n = cl.cards.length;
      const cols = n <= 4 ? 2 : 3;
      const cellW = 286, cellH = 188, gx = 24, gy = 24;
      const gw = cols * cellW + (cols - 1) * gx;
      const startX = cl.anchor.x - gw / 2;
      const startY = cl.anchor.y + 104;
      cl.cards.forEach((c, i) => {
        const r = Math.floor(i / cols), col = i % cols;
        c.x = startX + col * (cellW + gx);
        c.y = startY + r * (cellH + gy) + (col % 2 ? 16 : 0);
        c.w = cellW;
        c.cluster = cl;
      });
    });
  }

  /* ---------------- build DOM ---------------- */
  function build() {
    // cluster labels
    U.clusters.forEach((cl) => {
      const lab = document.createElement('div');
      lab.className = 'cluster-label';
      lab.style.left = cl.anchor.x + 'px';
      lab.style.top = cl.anchor.y + 'px';
      lab.style.setProperty('--accent', cl.color);
      lab.innerHTML = `<span class="kick">${cl.kicker}</span><span class="big">${cl.label}</span><span class="blurb">${cl.blurb}</span>`;
      world.appendChild(lab);
    });
    // cards
    U.clusters.forEach((cl) => {
      cl.cards.forEach((c) => {
        const el = document.createElement('button');
        el.className = 'node';
        el.style.left = c.x + 'px';
        el.style.top = c.y + 'px';
        el.style.width = c.w + 'px';
        el.style.setProperty('--accent', cl.color);
        el.innerHTML = `
          <span class="node-meta"><span class="dot"></span>${c.meta}</span>
          <span class="node-title">${c.title}</span>
          <span class="node-sub">${c.sub}</span>
          <span class="node-foot"><span class="word">💬 “${c.word}”</span><span class="arrow">↗</span></span>`;
        el._card = c;
        el.addEventListener('click', (e) => { if (!dragMoved) openCard(c); });
        world.appendChild(el);
        c.el = el;
        allCards.push(c);
      });
    });
    // brand centre node
    const brand = document.createElement('div');
    brand.className = 'brand-node';
    brand.style.left = U.brand.x + 'px';
    brand.style.top = U.brand.y + 'px';
    brand.innerHTML = `
      <span class="bn-kick">DS LABS</span>
      <span class="bn-title">Resource<br>Studio</span>
      <span class="bn-sub">A quiet galaxy of prompts, tools &amp; templates from the feed. Drag to roam — tap a star to open it.</span>`;
    world.appendChild(brand);
  }

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
  function centreOn(wx, wy, scale, animate) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const target = {
      scale: Math.max(SMIN, Math.min(SMAX, scale || S.scale))
    };
    target.x = vw / 2 - wx * target.scale;
    target.y = vh / 2 - wy * target.scale;
    if (animate) {
      gsap.to(S, {
        x: target.x, y: target.y, scale: target.scale, duration: 1.1,
        ease: 'power3.inOut', onUpdate: () => { clamp(); apply(); }
      });
    } else {
      Object.assign(S, target); clamp(); apply();
    }
  }

  /* ---------------- pan / inertia ---------------- */
  let dragging = false, dragMoved = false, lastX = 0, lastY = 0, vX = 0, vY = 0, inertiaRaf = null;
  function onDown(e) {
    if (e.target.closest('.hud, .minimap, .detail, .warp-bar, .topbar')) return;
    dragging = true; dragMoved = false;
    gsap.killTweensOf(S);
    cancelAnimationFrame(inertiaRaf);
    lastX = e.clientX; lastY = e.clientY; vX = vY = 0;
    viewport.classList.add('grabbing');
  }
  function onMove(e) {
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
    viewport.classList.remove('grabbing');
    // inertia
    function decay() {
      vX *= 0.92; vY *= 0.92;
      S.x += vX; S.y += vY;
      clamp(); apply();
      if (Math.abs(vX) > 0.2 || Math.abs(vY) > 0.2) inertiaRaf = requestAnimationFrame(decay);
    }
    if (Math.abs(vX) > 1 || Math.abs(vY) > 1) decay();
  }

  /* ---------------- zoom ---------------- */
  function zoomAt(sx, sy, factor) {
    const ns = Math.max(SMIN, Math.min(SMAX, S.scale * factor));
    const wx = (sx - S.x) / S.scale, wy = (sy - S.y) / S.scale;
    S.scale = ns;
    S.x = sx - wx * ns; S.y = sy - wy * ns;
    clamp(); apply();
  }
  function onWheel(e) {
    if (e.target.closest('.detail, .minimap')) return;
    e.preventDefault();
    gsap.killTweensOf(S);
    const f = e.deltaY < 0 ? 1.12 : 0.89;
    zoomAt(e.clientX, e.clientY, f);
  }

  /* ---------------- pinch (touch) ---------------- */
  let pinchD = 0, pinchMid = null;
  function touchStart(e) {
    if (e.touches.length === 2) {
      dragging = false;
      pinchD = dist(e.touches);
      pinchMid = mid(e.touches);
    }
  }
  function touchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = dist(e.touches);
      if (pinchD) zoomAt(pinchMid.x, pinchMid.y, d / pinchD);
      pinchD = d; pinchMid = mid(e.touches);
    }
  }
  function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
  function mid(t) { return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 }; }

  /* ---------------- minimap ---------------- */
  const mini = document.querySelector('.minimap');
  const miniView = document.querySelector('.minimap .mini-view');
  const MW = 168, MH = MW * (U.world.h / U.world.w);
  function buildMinimap() {
    mini.style.setProperty('--mh', MH + 'px');
    U.clusters.forEach((cl) => {
      const d = document.createElement('span');
      d.className = 'mini-dot';
      d.style.left = (cl.anchor.x / U.world.w * MW) + 'px';
      d.style.top = (cl.anchor.y / U.world.h * MH) + 'px';
      d.style.background = cl.color;
      d.title = cl.label;
      d.addEventListener('click', () => warpTo(cl.id));
      mini.appendChild(d);
    });
    mini.addEventListener('click', (e) => {
      if (e.target.classList.contains('mini-dot')) return;
      const r = mini.getBoundingClientRect();
      const wx = (e.clientX - r.left) / MW * U.world.w;
      const wy = (e.clientY - r.top) / MH * U.world.h;
      centreOn(wx, wy, Math.max(S.scale, 0.6), true);
    });
  }
  function updateMinimap() {
    if (!miniView) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const wx = -S.x / S.scale, wy = -S.y / S.scale;
    miniView.style.left = (wx / U.world.w * MW) + 'px';
    miniView.style.top = (wy / U.world.h * MH) + 'px';
    miniView.style.width = (vw / S.scale / U.world.w * MW) + 'px';
    miniView.style.height = (vh / S.scale / U.world.h * MH) + 'px';
  }

  /* ---------------- warp ---------------- */
  function warpTo(id) {
    const cl = U.clusters.find((c) => c.id === id);
    if (!cl) return;
    // centre of the cluster block (label + cards)
    const cy = cl.anchor.y + 150;
    centreOn(cl.anchor.x, cy, 0.78, true);
    document.querySelectorAll('.warp-bar button').forEach((b) =>
      b.classList.toggle('active', b.dataset.id === id));
  }
  function goHome() {
    centreOn(U.brand.x, U.brand.y, 0.62, true);
    document.querySelectorAll('.warp-bar button').forEach((b) => b.classList.remove('active'));
  }

  /* ---------------- detail overlay ---------------- */
  const detail = document.querySelector('.detail');
  function openCard(c) {
    const cl = c.cluster;
    detail.style.setProperty('--accent', cl.color);
    detail.querySelector('.d-kick').textContent = cl.kicker;
    detail.querySelector('.d-title').textContent = c.title;
    detail.querySelector('.d-sub').textContent = c.sub;
    detail.querySelector('.d-meta').textContent = c.meta;
    detail.querySelector('.d-cluster').textContent = cl.label;
    detail.querySelector('.d-word').textContent = c.word;
    detail.classList.add('open');
    gsap.fromTo(detail.querySelector('.detail-panel'),
      { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    // gently centre the opened card
    centreOn(c.x + c.w / 2, c.y + 90, Math.max(S.scale, 0.7), true);
    if (c.el) { c.el.classList.add('is-open'); detail._active = c.el; }
  }
  function closeCard() {
    if (!detail.classList.contains('open')) return;
    gsap.to(detail.querySelector('.detail-panel'), {
      x: 40, opacity: 0, duration: 0.32, ease: 'power2.in',
      onComplete: () => detail.classList.remove('open')
    });
    if (detail._active) detail._active.classList.remove('is-open');
  }

  /* ---------------- search ---------------- */
  const search = document.getElementById('search');
  const searchCount = document.getElementById('search-count');
  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      allCards.forEach((c) => c.el.classList.remove('dim', 'hit'));
      searchCount.textContent = '';
      return null;
    }
    let first = null, n = 0;
    allCards.forEach((c) => {
      const hay = (c.title + ' ' + c.sub + ' ' + c.meta + ' ' + c.word + ' ' + c.cluster.label).toLowerCase();
      const hit = hay.includes(q);
      c.el.classList.toggle('dim', !hit);
      c.el.classList.toggle('hit', hit);
      if (hit) { n++; if (!first) first = c; }
    });
    searchCount.textContent = n ? `${n} found` : 'nothing — try “prompt”';
    return first;
  }

  /* ---------------- keyboard ---------------- */
  function onKey(e) {
    if (e.target === search) {
      if (e.key === 'Enter') { const f = runSearch(search.value); if (f) centreOn(f.x + f.w / 2, f.y + 90, 0.85, true); }
      if (e.key === 'Escape') { search.value = ''; runSearch(''); search.blur(); }
      return;
    }
    if (e.key === 'Escape') closeCard();
    if (e.key === '0' || e.key.toLowerCase() === 'h') goHome();
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= U.clusters.length) warpTo(U.clusters[num - 1].id);
  }

  /* ---------------- boot ---------------- */
  function boot() {
    layout();
    build();
    buildMinimap();

    // warp chips
    const bar = document.querySelector('.warp-bar .chips');
    U.clusters.forEach((cl) => {
      const b = document.createElement('button');
      b.dataset.id = cl.id;
      b.style.setProperty('--accent', cl.color);
      b.innerHTML = `<span class="cdot"></span>${cl.label}`;
      b.addEventListener('click', () => warpTo(cl.id));
      bar.appendChild(b);
    });
    document.querySelector('.home-btn').addEventListener('click', goHome);
    document.querySelector('.zoom-in').addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, 1.25));
    document.querySelector('.zoom-out').addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, 0.8));
    document.querySelector('.overview-btn').addEventListener('click', () => centreOn(U.world.w / 2, U.world.h / 2, SMIN + 0.02, true));
    detail.querySelector('.d-close').addEventListener('click', closeCard);
    detail.querySelector('.detail-scrim').addEventListener('click', closeCard);
    search.addEventListener('input', () => runSearch(search.value));

    // events
    viewport.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('touchstart', touchStart, { passive: false });
    viewport.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => {
      // keep whatever world-point was at the old screen centre, centred
      const cwx = (prevVW / 2 - S.x) / S.scale;
      const cwy = (prevVH / 2 - S.y) / S.scale;
      prevVW = window.innerWidth; prevVH = window.innerHeight;
      centreOn(cwx, cwy, S.scale, false);
      if (bg) bg.resize();
    });

    // background — position the world FIRST so the very first rendered frame
    // already shows the orb correctly centred behind the brand.
    var bg = null;
    centreOn(U.brand.x, U.brand.y, 0.62, false);
    const bgCanvas = document.getElementById('bg-canvas');
    if (window.DSBackground && bgCanvas) { bg = window.DSBackground.init(bgCanvas); if (bg) bg.start(); }

    // HUD entrance
    gsap.fromTo('.fade-in', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power2.out', delay: 0.5 });

    // hide hint on first interaction
    const hint = document.querySelector('.explore-hint');
    function killHint() { if (hint) { gsap.to(hint, { opacity: 0, duration: 0.5 }); } window.removeEventListener('pointerdown', killHint); window.removeEventListener('wheel', killHint); }
    window.addEventListener('pointerdown', killHint); window.addEventListener('wheel', killHint);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
