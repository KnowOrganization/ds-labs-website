/* DS Labs — directions controller: tab switching, lazy scene mounting,
   GSAP entrances, marquees, terminal typing. */
(function () {
  const gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---- shared resource data (rendered per theme) ---- */
  const RESOURCES = [
    { tag: 'PROMPTS', icon: '⌘', title: 'Prompt Templates', desc: 'Copy-paste prompts that actually ship. Tested on the models you use daily.', count: '48 packs' },
    { tag: 'SAAS', icon: '◆', title: 'SaaS & Tools', desc: 'The stack behind the posts. Tools we vouch for, no sponsored fluff.', count: '120+ tools' },
    { tag: 'NOTION', icon: '▦', title: 'Notion Templates', desc: 'Dashboards, trackers and second-brains. Duplicate in one click.', count: '32 templates' },
    { tag: 'CODE', icon: '</>', title: 'Code & Boilerplates', desc: 'Starter repos and snippets so you skip the boring setup.', count: '60 snippets' },
    { tag: 'ARCHIVE', icon: '#', title: 'The Link Vault', desc: 'Every "comment for the link" finally in one searchable place.', count: '300+ links' },
    { tag: 'DROPS', icon: '✦', title: 'Weekly Drops', desc: 'Fresh resources every week, straight from the feed to your stack.', count: 'new fridays' }
  ];

  function buildCards(container) {
    container.innerHTML = '';
    RESOURCES.forEach((r, i) => {
      const a = document.createElement('a');
      a.href = '#'; a.className = 'card'; a.setAttribute('data-card', '');
      a.innerHTML = `
        <span class="icon">${r.icon}</span>
        <span class="tag">${r.tag}</span>
        <h3>${r.title}</h3>
        <p>${r.desc}</p>
        <span class="count"><span>${r.count}</span><span aria-hidden="true">→</span></span>`;
      container.appendChild(a);
    });
  }

  /* ---- scenes ---- */
  const controllers = {};
  function ensureScene(dir) {
    if (controllers[dir]) return controllers[dir];
    const canvas = document.querySelector(`.dir[data-dir="${dir}"] .hero-canvas`);
    if (!canvas || !window.DSScenes || !window.DSScenes[dir]) return null;
    const ctrl = window.DSScenes[dir](canvas);
    controllers[dir] = ctrl;
    ctrl.resize();
    return ctrl;
  }

  /* ---- entrance animation per direction ---- */
  function animateIn(dir) {
    const root = document.querySelector(`.dir[data-dir="${dir}"]`);
    if (!root) return;
    const heroBits = root.querySelectorAll('.hero-inner [data-stagger]');
    gsap.killTweensOf(heroBits);
    gsap.fromTo(heroBits,
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08 }
    );
    // cards
    const cards = root.querySelectorAll('[data-card]');
    gsap.fromTo(cards,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.05,
        scrollTrigger: { trigger: root.querySelector('.res-grid'), start: 'top 80%' }
      }
    );
  }

  /* ---- terminal typing ---- */
  let typeTimer = null;
  function startTyping() {
    const el = document.querySelector('.dir[data-dir="terminal"] .type-target');
    if (!el) return;
    const full = el.getAttribute('data-text') || '';
    clearInterval(typeTimer);
    el.textContent = '';
    let i = 0;
    typeTimer = setInterval(() => {
      el.textContent = full.slice(0, ++i);
      if (i >= full.length) clearInterval(typeTimer);
    }, 55);
  }

  /* ---- marquee loop ---- */
  function initMarquees() {
    document.querySelectorAll('.marquee .track').forEach((track) => {
      const dir = track.getAttribute('data-mq-dir') === 'rev' ? 1 : -1;
      gsap.to(track, { xPercent: dir * -50, duration: 22, ease: 'none', repeat: -1 });
    });
  }

  /* ---- switching ---- */
  let current = null;
  function show(dir) {
    if (dir === current) return;
    const tgt = document.querySelector(`.dir[data-dir="${dir}"]`);
    if (!tgt) return;

    // stop previous scene
    if (current && controllers[current]) controllers[current].stop();

    document.querySelectorAll('.dir').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.target === dir));
    tgt.classList.add('active');
    window.scrollTo(0, 0);

    const ctrl = ensureScene(dir);
    if (ctrl) { ctrl.resize(); ctrl.start(); }

    // panel itself is always fully visible; entrance is handled on inner content
    gsap.set(tgt, { opacity: 1 });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    animateIn(dir);
    if (dir === 'terminal') startTyping();

    current = dir;
    history.replaceState(null, '', '#' + dir);
  }

  /* ---- resize ---- */
  let rT = null;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      Object.values(controllers).forEach(c => c.resize());
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 150);
  });

  /* ---- hide hint on scroll ---- */
  function initHint() {
    const hint = document.querySelector('.mouse-hint');
    if (!hint) return;
    if (matchMedia('(hover: none)').matches) hint.textContent = 'tap & drag — it reacts ✦';
    window.addEventListener('scroll', () => {
      hint.style.opacity = window.scrollY > 60 ? '0' : '1';
    }, { passive: true });
  }

  /* ---- boot ---- */
  function boot() {
    document.querySelectorAll('[data-cards]').forEach(buildCards);
    document.querySelectorAll('.tabs button').forEach(b => {
      b.addEventListener('click', () => show(b.dataset.target));
    });
    initMarquees();
    initHint();
    const initial = (location.hash || '').replace('#', '');
    show(['terminal', 'meme', 'minimal'].includes(initial) ? initial : 'terminal');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
