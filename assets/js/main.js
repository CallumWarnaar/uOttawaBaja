/* =========================================================
   Rough Rider Racing — site behaviour (framework pass)
   No dependencies. Each feature is opt-in via data-attributes,
   so pages that don't use a feature pay nothing for it.
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobile nav toggle ---- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- Mark current page in nav (fallback if aria-current not hard-coded) ---- */
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a[href]').forEach((a) => {
    if (a.getAttribute('href') === here && !a.hasAttribute('aria-current')) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---- Scroll reveal: add data-reveal to any element ---- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---- Slideshow: <div class="slideshow" data-slideshow data-interval="6000"> ---- */
  document.querySelectorAll('[data-slideshow]').forEach((root) => {
    const track = root.querySelector('.slideshow__track');
    const slides = Array.from(root.querySelectorAll('.slideshow__slide'));
    if (!track || slides.length < 2) return;

    let index = 0;
    let timer = null;
    const interval = parseInt(root.dataset.interval || '6000', 10);

    const dots = document.createElement('div');
    dots.className = 'slideshow__dots';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Go to slide ${i + 1}`);
      b.addEventListener('click', () => { go(i); restart(); });
      dots.appendChild(b);
    });
    root.appendChild(dots);

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, n) => s.setAttribute('aria-hidden', String(n !== index)));
      dots.querySelectorAll('button').forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
    }
    function restart() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => go(index + 1), interval);
    }

    root.querySelector('.slideshow__btn--prev')?.addEventListener('click', () => { go(index - 1); restart(); });
    root.querySelector('.slideshow__btn--next')?.addEventListener('click', () => { go(index + 1); restart(); });
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', restart);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(index - 1); restart(); }
      if (e.key === 'ArrowRight') { go(index + 1); restart(); }
    });

    go(0);
    restart();
  });

  /* ---- Countdown: <div data-countdown="2026-10-02T08:00:00-04:00" data-countdown-done="Race weekend!"> ---- */
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    const target = new Date(el.dataset.countdown).getTime();
    const fields = {
      d: el.querySelector('[data-unit="d"]'),
      h: el.querySelector('[data-unit="h"]'),
      m: el.querySelector('[data-unit="m"]'),
      s: el.querySelector('[data-unit="s"]'),
    };
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        el.innerHTML = `<p class="countdown__done">${el.dataset.countdownDone || 'Event underway'}</p>`;
        clearInterval(id);
        return;
      }
      const s = Math.floor(diff / 1000);
      if (fields.d) fields.d.textContent = Math.floor(s / 86400);
      if (fields.h) fields.h.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
      if (fields.m) fields.m.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      if (fields.s) fields.s.textContent = String(s % 60).padStart(2, '0');
    }
    const id = setInterval(tick, 1000);
    tick();
  });

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
