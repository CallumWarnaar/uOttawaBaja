/* =========================================================================
   ROUGH RIDER RACING — site behaviour v2
   Libraries (vendored in assets/vendor): GSAP + ScrollTrigger + SplitText, Lenis.
   Every effect is opt-in via data-attributes and degrades to static content
   when JS is off, libraries fail to load, or the visitor prefers reduced motion.
   ========================================================================= */
(function () {
  'use strict';

  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const motion = !reduce && hasGSAP;
  html.classList.remove('no-js');
  html.classList.add('js', 'js-ready');
  html.classList.toggle('motion', motion);
  html.classList.toggle('reduce-motion', !motion);

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const desktop = () => window.matchMedia('(min-width: 861px)').matches;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
  }

  /* ---------------------------------------------------------------------
     Smooth scroll (Lenis) — drives ScrollTrigger from the GSAP ticker
     --------------------------------------------------------------------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // In-page anchor links go through Lenis
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -80 }); }
    }));
  }
  const scrollLock = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; };
  window.RRR = { scrollLock }; // shared with page scripts (roster.js)

  /* ---------------------------------------------------------------------
     Splash screen (first visit per session) + page wipes
     --------------------------------------------------------------------- */
  const splash = $('.splash');
  const wipe = $('.wipe');
  let introPlayed = false;

  function playIntro() {
    if (introPlayed) return; introPlayed = true;
    if (!motion) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    const has = (sel) => $$(sel);
    const lines = has('.hero__title .line > span');
    if (lines.length) tl.fromTo(lines, { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0.05);
    const bits = has('.hero .kicker, .hero__lead, .hero .btn-row, .hero__meta');
    if (bits.length) tl.from(bits, { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, 0.35);
    if (has('.hero__number').length) tl.from('.hero__number', { opacity: 0, x: 120, duration: 1.8 }, 0.1);
    if (has('.hero__media img').length) tl.from('.hero__media img', { scale: 1.18, duration: 2.2, ease: 'power3.out' }, 0);
    tl.from('.site-header__inner', { yPercent: -100, opacity: 0, duration: 1, clearProps: 'transform' }, 0.2);
  }

  function runSplash() {
    if (!splash || !html.classList.contains('show-splash') || !motion) {
      html.classList.remove('show-splash');
      if (splash) splash.hidden = true;
      return false;
    }
    splash.hidden = false;
    scrollLock(true);
    const rpm = $('.splash__rpm', splash);
    const gauge = { v: 0 };
    const tl = gsap.timeline({
      onComplete() {
        splash.hidden = true; html.classList.remove('show-splash');
        store.set('rrr-splash', '1'); scrollLock(false); ScrollTrigger.refresh();
      },
    });
    tl.from('.splash__crest', { scale: 0.6, opacity: 0, duration: 0.9, ease: 'back.out(1.6)' })
      .from('.splash__title', { yPercent: 40, opacity: 0, duration: 0.7, ease: 'expo.out' }, '-=0.5')
      .from('.splash__sub, .splash__gauge', { opacity: 0, duration: 0.5 }, '-=0.3')
      // "Throttle" gauge: 0 → 100 %
      .to(gauge, {
        v: 1, duration: 1.6, ease: 'power2.inOut',
        onUpdate() { if (rpm) rpm.textContent = `${String(Math.round(gauge.v * 100)).padStart(3, '0')}% THR`; },
      }, '-=0.1')
      .to('.splash__bar i', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, '<')
      .fromTo('.splash__panel--2', { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' }, '+=0.15')
      .fromTo('.splash__panel--1', { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' }, '-=0.55')
      .set('.splash__inner', { opacity: 0 })
      .set(splash, { backgroundColor: 'transparent' })
      .to('.splash__panel', { yPercent: -100, duration: 0.8, ease: 'expo.inOut', stagger: 0.08 })
      .add(playIntro, '-=0.6');
    return true;
  }

  function runEnterWipe() {
    if (!wipe || !html.classList.contains('is-entering')) return false;
    if (!motion) { html.classList.remove('is-entering'); return false; }
    const tl = gsap.timeline({ onComplete: () => { html.classList.remove('is-entering'); gsap.set('.wipe__panel', { clearProps: 'all' }); } });
    tl.set('.wipe__panel', { y: 0, yPercent: 0 })
      .to('.wipe__crest', { opacity: 0, duration: 0.2 })
      .to('.wipe__panel--1', { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, 0.05)
      .to('.wipe__panel--2', { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, 0.14)
      .add(playIntro, 0.35);
    return true;
  }

  // Leaving: wipe in, then navigate
  if (motion && wipe) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (a.target === '_blank' || a.hasAttribute('download') || url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      if (!/\.html?$|\/$/.test(url.pathname)) return;
      e.preventDefault();
      store.set('rrr-wipe', '1');
      closeMenu(true);
      gsap.timeline({ onComplete: () => { location.href = url.href; } })
        .set('.wipe__panel', { y: 0, yPercent: 100 })
        .to('.wipe__panel--2', { yPercent: 0, duration: 0.55, ease: 'expo.inOut' })
        .to('.wipe__panel--1', { yPercent: 0, duration: 0.55, ease: 'expo.inOut' }, 0.08)
        .to('.wipe__crest', { opacity: 1, duration: 0.2 }, 0.4);
    });
    window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set('.wipe__panel', { y: 0, yPercent: 100 }); });
  }

  /* ---------------------------------------------------------------------
     Header: hide on scroll down, show on up, progress bar
     --------------------------------------------------------------------- */
  const header = $('.site-header');
  const progress = $('.progress');
  let lastY = 0;
  function onScroll(y) {
    if (!header) return;
    header.classList.toggle('is-scrolled', y > 40);
    if (!html.classList.contains('menu-open')) {
      const hide = y > lastY && y > 300;
      header.classList.toggle('is-hidden', hide);
      html.classList.toggle('header-hidden', hide); // lets the on-page nav slide up with it
    }
    lastY = y;
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  }
  if (lenis) lenis.on('scroll', (l) => onScroll(l.scroll));
  else window.addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  /* ---------------------------------------------------------------------
     Full-screen menu
     --------------------------------------------------------------------- */
  const menu = $('#menu');
  const toggle = $('.menu-toggle');
  let menuTl = null;
  function openMenu() {
    if (!menu) return;
    html.classList.add('menu-open'); toggle.setAttribute('aria-expanded', 'true');
    toggle.querySelector('.menu-toggle__text').textContent = 'Close';
    menu.style.visibility = 'visible'; menu.removeAttribute('inert');
    scrollLock(true);
    if (motion) {
      menuTl && menuTl.kill();
      menuTl = gsap.timeline()
        .fromTo(menu, { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 0.8, ease: 'expo.inOut' })
        .fromTo('.menu__link', { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0.35)
        .from('.menu__preview, .menu__foot', { opacity: 0, y: 20, duration: 0.6 }, 0.5);
    } else { menu.style.clipPath = 'none'; }
    setTimeout(() => $('.menu__link', menu)?.focus(), 350);
  }
  function closeMenu(instant) {
    if (!menu || !html.classList.contains('menu-open')) return;
    html.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.menu-toggle__text').textContent = 'Menu';
    menu.setAttribute('inert', '');
    scrollLock(false);
    const done = () => { menu.style.visibility = 'hidden'; };
    if (motion && !instant) {
      menuTl && menuTl.kill();
      gsap.to(menu, { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)', duration: 0.7, ease: 'expo.inOut', onComplete: done });
    } else done();
    toggle.focus({ preventScroll: true });
  }
  if (menu && toggle) {
    menu.setAttribute('inert', '');
    toggle.addEventListener('click', () => (html.classList.contains('menu-open') ? closeMenu() : openMenu()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    const imgs = $$('.menu__preview img', menu);
    $$('.menu__link', menu).forEach((a, i) => {
      a.addEventListener('mouseenter', () => imgs.forEach((im, j) => im.classList.toggle('is-active', j === i)));
      a.addEventListener('focus', () => imgs.forEach((im, j) => im.classList.toggle('is-active', j === i)));
    });
  }

  /* ---------------------------------------------------------------------
     Marquees (text, photos, logos) — speed reacts to scroll velocity
     --------------------------------------------------------------------- */
  $$('[data-marquee]').forEach((el) => {
    const track = $('.marquee__track', el);
    const group = $('.marquee__group', el);
    if (!track || !group) return;
    // Make sure one group is wider than the viewport, then duplicate it once
    let guard = 0;
    while (group.scrollWidth < innerWidth * 1.1 && guard++ < 8) group.innerHTML += group.innerHTML;
    const clone = group.cloneNode(true); clone.setAttribute('aria-hidden', 'true');
    $$('a, button', clone).forEach((n) => n.setAttribute('tabindex', '-1'));
    track.appendChild(clone);
    if (!motion) return;
    const dir = parseFloat(el.dataset.marquee) || 1;
    const speed = parseFloat(el.dataset.speed) || 40; // seconds per loop
    const tween = gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: speed, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top',
      onUpdate(self) {
        const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
        gsap.to(tween, { timeScale: (1 + v) * (self.direction || 1), duration: 0.3, overwrite: true });
        gsap.to(tween, { timeScale: self.direction || 1, duration: 1.2, delay: 0.3, overwrite: false });
      },
    });
  });

  /* ---------------------------------------------------------------------
     Scroll animations
     --------------------------------------------------------------------- */
  if (motion) {
    // Split headings into masked lines/chars
    $$('[data-split]').forEach((el) => {
      if (!window.SplitText) return;
      const type = el.dataset.split || 'lines';
      const split = SplitText.create(el, { type: type === 'chars' ? 'lines,chars' : 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.from(type === 'chars' ? split.chars : split.lines, {
        yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: type === 'chars' ? 0.018 : 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%' },
        // drop the masks once revealed so tight line-heights don't clip glyph tops
        onComplete: () => split.revert(),
      });
    });

    // Generic reveals
    $$('[data-reveal]').forEach((el) => {
      const kind = el.dataset.reveal;
      const delay = (parseFloat(el.dataset.delay) || 0) * 0.1;
      const st = { trigger: el, start: 'top 88%' };
      if (kind === 'clip') {
        gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', delay, scrollTrigger: st });
        const img = $('img', el);
        if (img) gsap.from(img, { scale: 1.35, duration: 1.8, ease: 'expo.out', delay, scrollTrigger: st });
      } else if (kind === 'stagger') {
        gsap.set(el, { opacity: 1 });
        gsap.fromTo(el.children, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.1, delay, scrollTrigger: st, clearProps: 'transform' });
      } else if (kind === 'left' || kind === 'right') {
        gsap.fromTo(el, { x: kind === 'left' ? -80 : 80, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay, scrollTrigger: st, clearProps: 'transform' });
      } else {
        gsap.fromTo(el, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay, scrollTrigger: st, clearProps: 'transform' });
      }
    });

    // Parallax
    $$('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 0.2;
      gsap.fromTo(el, { yPercent: -amt * 50 }, { yPercent: amt * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.frame img, .band img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.closest('.frame, .band'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.hero').forEach((hero) => {
      const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to($('.hero__media', hero), { yPercent: 18, ease: 'none', scrollTrigger: st });
      gsap.to($('.hero__content', hero), { yPercent: -18, opacity: 0.1, ease: 'none', scrollTrigger: st });
      const num = $('.hero__number', hero);
      if (num) gsap.to(num, { xPercent: -25, ease: 'none', scrollTrigger: st });
    });
    $$('.band__text').forEach((t) => {
      gsap.fromTo(t, { scale: 0.75, opacity: 0.2 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: t.closest('.band'), start: 'top 85%', end: 'center center', scrub: true } });
    });
    $$('.section-index').forEach((n) => {
      gsap.fromTo(n, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: n.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Word-by-word brighten
    $$('.scrub-text').forEach((el) => {
      const walk = (node) => {
        Array.from(node.childNodes).forEach((c) => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach((w) => {
              if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
              const s = document.createElement('span'); s.className = 'word'; s.textContent = w; frag.appendChild(s);
            });
            c.replaceWith(frag);
          } else if (c.nodeType === 1) walk(c);
        });
      };
      walk(el);
      gsap.to($$('.word', el), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });

    // Timeline progress line
    $$('.timeline').forEach((tl) => {
      const fill = document.createElement('span'); fill.className = 'timeline__fill'; tl.prepend(fill);
      gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 70%', end: 'bottom 60%', scrub: true } });
    });

    // Budget bars
    $$('.bars__fill').forEach((b) => gsap.from(b, { scaleX: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 92%' } }));

    // Horizontal track: pin + scrub sideways on desktop
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      $$('[data-htrack]').forEach((sec) => {
        const inner = $('.htrack__inner', sec);
        if (!inner) return;
        const dist = () => Math.max(0, inner.scrollWidth - innerWidth);
        gsap.to(inner, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Counters: <span data-count="50260" data-prefix="$" data-suffix="+">
     --------------------------------------------------------------------- */
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    const fmt = (v) => (el.dataset.prefix || '') + v.toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (!motion) { el.firstChild ? (el.firstChild.textContent = fmt(end)) : (el.textContent = fmt(end)); return; }
    const o = { v: 0 };
    const textNode = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : el.insertBefore(document.createTextNode(''), el.firstChild);
    textNode.textContent = fmt(0);
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => { textNode.textContent = fmt(o.v); } });
  });

  /* ---------------------------------------------------------------------
     Countdown: <div data-countdown="ISO date" data-countdown-done="text">
     --------------------------------------------------------------------- */
  $$('[data-countdown]').forEach((el) => {
    const target = new Date(el.dataset.countdown).getTime();
    const f = (u) => el.querySelector(`[data-unit="${u}"]`);
    const d = f('d'), h = f('h'), m = f('m'), s = f('s');
    let id = null;
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { el.innerHTML = `<p class="countdown__done">${el.dataset.countdownDone || 'Race weekend'}</p>`; clearInterval(id); return; }
      const t = Math.floor(diff / 1000);
      d.textContent = String(Math.floor(t / 86400)).padStart(2, '0');
      h.textContent = String(Math.floor((t % 86400) / 3600)).padStart(2, '0');
      m.textContent = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
      s.textContent = String(t % 60).padStart(2, '0');
    }
    tick(); id = setInterval(tick, 1000);
  });

  /* ---------------------------------------------------------------------
     On-page nav highlighting
     --------------------------------------------------------------------- */
  const opLinks = $$('.onpage-nav a[href^="#"]');
  if (opLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(opLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { opLinks.forEach((a) => a.classList.remove('is-active')); map.get(e.target.id)?.classList.add('is-active'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const t = document.getElementById(id); if (t) io.observe(t); });
  }

  /* ---------------------------------------------------------------------
     Gallery: filters + lightbox
     --------------------------------------------------------------------- */
  const gallery = $('[data-gallery]');
  if (gallery) {
    const items = $$('.gallery__item', gallery);
    $$('[data-filter]').forEach((btn) => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      items.forEach((it) => { it.hidden = f !== 'all' && !(it.dataset.tags || '').split(' ').includes(f); });
      if (hasGSAP) ScrollTrigger.refresh();
    }));
    const lb = $('.lightbox');
    if (lb) {
      const img = $('img', lb), count = $('.lightbox__count', lb);
      let idx = 0; let lastFocus = null;
      const visible = () => items.filter((i) => !i.hidden);
      const show = (i) => {
        const v = visible(); idx = (i + v.length) % v.length;
        const src = v[idx].querySelector('img');
        img.src = src.currentSrc || src.src; img.alt = src.alt; count.textContent = `${idx + 1} / ${v.length}`;
      };
      const open = (i) => { lastFocus = document.activeElement; lb.hidden = false; scrollLock(true); show(i); $('.lightbox__close', lb).focus(); };
      const close = () => { lb.hidden = true; scrollLock(false); lastFocus && lastFocus.focus(); };
      items.forEach((it) => it.addEventListener('click', () => open(visible().indexOf(it))));
      $('.lightbox__close', lb).addEventListener('click', close);
      $('.lightbox__prev', lb).addEventListener('click', () => show(idx - 1));
      $('.lightbox__next', lb).addEventListener('click', () => show(idx + 1));
      lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
      document.addEventListener('keydown', (e) => {
        if (lb.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(idx - 1);
        if (e.key === 'ArrowRight') show(idx + 1);
      });
    }
  }

  /* ---------------------------------------------------------------------
     TECH: interactive car with hotspots
     Markup: [data-car] > .car-canvas > .hotspot[data-system][style="--x;--y"]
             .system-data > article#sys-<name>
     Desktop + motion: the stage pins and scrolling steps through systems,
     with the "camera" zooming toward the active hotspot.
     Add ?edit to the URL to click/drag and print hotspot coordinates.
     --------------------------------------------------------------------- */
  const car = $('[data-car]');
  if (car) {
    const canvas = $('.car-canvas', car);
    const spots = $$('.hotspot', car);
    const panel = $('.system-panel', car);
    const body = $('.system-panel__body', panel);
    const countEl = $('.system-panel__index', panel);
    const bar = $('.stage-progress', car);
    const overview = $('#sys-overview', car);
    const steps = [overview, ...spots.map((s) => $('#sys-' + s.dataset.system, car))];
    let active = -1; let pinST = null;
    if (bar) bar.innerHTML = steps.map(() => '<i></i>').join('');

    function setActive(i, opts = {}) {
      i = Math.max(0, Math.min(steps.length - 1, i));
      if (i === active && !opts.force) return;
      active = i;
      const art = steps[i];
      if (art && body) {
        body.innerHTML = art.innerHTML;
        if (motion) gsap.from(body.children, { y: 24, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'expo.out' });
      }
      if (countEl) countEl.textContent = i === 0 ? 'Overview' : `${String(i).padStart(2, '0')} / ${String(spots.length).padStart(2, '0')}`;
      spots.forEach((s, j) => { s.classList.toggle('is-active', j === i - 1); s.setAttribute('aria-pressed', String(j === i - 1)); });
      car.classList.toggle('show-labels', i === 0);
      if (bar) $$('i', bar).forEach((b, j) => b.classList.toggle('is-on', j <= i));
      // Camera
      if (motion && canvas) {
        if (i === 0) gsap.to(canvas, { scale: 1, xPercent: 0, yPercent: 0, duration: 1.1, ease: 'expo.inOut' });
        else {
          const s = spots[i - 1];
          const x = parseFloat(getComputedStyle(s).getPropertyValue('--x')); const y = parseFloat(getComputedStyle(s).getPropertyValue('--y'));
          const z = parseFloat(s.dataset.zoom) || 1.45;
          gsap.to(canvas, { scale: z, xPercent: -(x - 50) * z * 0.55, yPercent: -(y - 50) * z * 0.55, duration: 1.1, ease: 'expo.inOut' });
        }
      }
    }
    const goTo = (i) => {
      if (pinST && lenis) {
        const n = steps.length; const p = (i + 0.5) / n;
        lenis.scrollTo(pinST.start + (pinST.end - pinST.start) * p, { duration: 1.2 });
      } else setActive(i);
    };
    spots.forEach((s, j) => s.addEventListener('click', () => { if (!html.classList.contains('is-editing')) goTo(j + 1); }));
    $('[data-car-prev]', car)?.addEventListener('click', () => goTo(active - 1));
    $('[data-car-next]', car)?.addEventListener('click', () => goTo(active + 1));
    car.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') goTo(active + 1); if (e.key === 'ArrowLeft') goTo(active - 1); });
    setActive(0, { force: true });

    const editing = /[?&]edit\b/.test(location.search);
    if (motion && !editing) {
      gsap.matchMedia().add('(min-width: 1100px)', () => {
        pinST = ScrollTrigger.create({
          trigger: $('.car-stage', car), start: 'top top', end: () => `+=${steps.length * innerHeight * 0.7}`, pin: true, anticipatePin: 1,
          onUpdate: (self) => setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length))),
        });
        return () => { pinST = null; };
      });
    }

    if (editing && canvas) {
      html.classList.add('is-editing');
      const hud = document.createElement('div'); hud.className = 'edit-hud';
      hud.innerHTML = '<b>HOTSPOT EDIT MODE</b><br>Click the render to get a coordinate, or drag a hotspot.<br><span data-out>—</span>';
      document.body.appendChild(hud);
      const out = $('[data-out]', hud);
      const pct = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width * 100).toFixed(1), ((e.clientY - r.top) / r.height * 100).toFixed(1)]; };
      const report = (name, x, y) => {
        const txt = `style="--x:${x}%; --y:${y}%"`;
        out.innerHTML = `${name ? `<b>${name}</b>: ` : ''}${txt}`;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => { out.innerHTML += '<br><small>copied to clipboard</small>'; }).catch(() => {});
        console.log(name || 'point', txt);
      };
      canvas.addEventListener('click', (e) => {
        if (e.target.closest('.hotspot')) return;
        const [x, y] = pct(e);
        const d = document.createElement('span'); d.className = 'edit-dot'; d.style.left = x + '%'; d.style.top = y + '%'; canvas.appendChild(d);
        report('', x, y);
      });
      spots.forEach((s) => {
        s.addEventListener('pointerdown', (e) => {
          e.preventDefault(); s.setPointerCapture(e.pointerId);
          const move = (ev) => { const [x, y] = pct(ev); s.style.setProperty('--x', x + '%'); s.style.setProperty('--y', y + '%'); report(s.dataset.system, x, y); };
          const up = () => { s.removeEventListener('pointermove', move); s.removeEventListener('pointerup', up); };
          s.addEventListener('pointermove', move); s.addEventListener('pointerup', up);
        });
      });
    }
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  const splashRan = runSplash();
  const wipeRan = !splashRan && runEnterWipe();
  if (!splashRan && !wipeRan) playIntro();

  if (hasGSAP) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
