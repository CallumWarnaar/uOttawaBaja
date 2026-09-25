/* =========================================================================
   Full roster: renders RRR_ROSTER (roster-data.js) as a sortable, filterable
   grid, and opens a profile drawer per person at roster.html#person-id.
   ========================================================================= */
(function () {
  'use strict';
  const people = window.RRR_ROSTER || [];
  const teams = window.RRR_TEAMS || [];
  const grid = document.querySelector('[data-roster-grid]');
  if (!grid) return;

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  const sortSel = $('[data-roster-sort]');
  const filterBox = $('[data-roster-filters]');
  const countEl = $('[data-roster-count]');
  let sortBy = store.get('rrr-roster-sort') === 'seniority' ? 'seniority' : 'alpha';
  let team = 'All';
  let visible = [];

  const byName = (a, b) => (a.sortName || a.name).localeCompare(b.sortName || b.name, 'en-CA', { sensitivity: 'base' });
  const sorters = {
    alpha: (a, b) => (a.placeholder ? 1 : 0) - (b.placeholder ? 1 : 0) || byName(a, b),
    seniority: (a, b) =>
      (a.joined ?? Infinity) - (b.joined ?? Infinity) ||
      (a.rank ?? 2) - (b.rank ?? 2) ||
      (a.placeholder ? 1 : 0) - (b.placeholder ? 1 : 0) ||
      byName(a, b),
  };

  function photo(p, cls) {
    const box = el('div', cls);
    if (p.photo) box.style.backgroundImage = `url('${p.photo}')`;
    else { const i = el('span', 'member__initials', p.placeholder ? '?' : initials(p.name)); i.setAttribute('aria-hidden', 'true'); box.append(i); }
    return box;
  }

  /* ---- Grid ---- */
  function render() {
    visible = people.filter((p) => team === 'All' || (p.roles || []).some((r) => r.team === team)).sort(sorters[sortBy]);
    grid.textContent = '';
    visible.forEach((p) => {
      const a = el('a', 'member roster-card' + (p.placeholder ? ' todo' : ''));
      a.href = '#' + p.id;
      const role = (p.roles || [])[0] || {};
      a.setAttribute('aria-label', `${p.name}, ${(p.roles || []).map((r) => r.title).join(', ')}. Open profile`);
      a.append(photo(p, 'member__photo'));
      a.append(el('p', 'member__name', p.name));
      a.append(el('p', 'member__role', role.title || ''));
      const tags = el('p', 'roster-card__teams');
      (p.roles || []).forEach((r) => tags.append(el('span', '', r.team)));
      a.append(tags);
      grid.append(a);
    });
    const real = visible.filter((p) => !p.placeholder).length;
    countEl.textContent = `${visible.length} ${visible.length === 1 ? 'person' : 'people'}` + (real < visible.length ? ` · ${visible.length - real} placeholder${visible.length - real === 1 ? '' : 's'}` : '') + (sortBy === 'seniority' ? ' · most senior first' : ' · A–Z');
  }

  /* ---- Controls ---- */
  ['All', ...teams].forEach((t) => {
    const n = t === 'All' ? people.length : people.filter((p) => (p.roles || []).some((r) => r.team === t)).length;
    if (!n) return;
    const b = el('button', 'roster-chip');
    b.type = 'button';
    b.dataset.team = t;
    b.setAttribute('aria-pressed', String(t === team));
    b.append(t, el('small', '', String(n)));
    b.addEventListener('click', () => {
      team = t;
      filterBox.querySelectorAll('.roster-chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
    filterBox.append(b);
  });
  sortSel.value = sortBy;
  sortSel.addEventListener('change', () => { sortBy = sortSel.value; store.set('rrr-roster-sort', sortBy); render(); });

  /* ---- Profile drawer ---- */
  const drawer = $('[data-profile]');
  const body = $('[data-profile-body]');
  const panel = $('.profile__panel', drawer);
  let current = null;
  let lastFocus = null;

  function field(label, value) {
    const d = el('div', 'profile__fact');
    d.append(el('dt', '', label), el('dd', value ? '' : 'is-empty', value || 'To be added'));
    return d;
  }
  function section(title, content, emptyText) {
    const s = el('section', 'profile__section');
    s.append(el('h3', '', title));
    if (content) s.append(content); else s.append(el('p', 'profile__empty', emptyText));
    return s;
  }

  function fill(p) {
    body.textContent = '';
    const head = el('header', 'profile__head');
    head.append(photo(p, 'member__photo profile__photo'));
    const id = el('div', 'profile__id');
    const h = el('h2', 'profile__name', p.name); h.id = 'profile-name';
    id.append(h);
    (p.roles || []).forEach((r) => {
      const line = el('p', 'profile__role');
      line.append(el('span', 'tag', r.team), ' ', r.title);
      id.append(line);
    });
    head.append(id);
    body.append(head);

    const facts = el('dl', 'profile__facts');
    facts.append(
      field('Program', p.program),
      field('Year', p.year),
      field('Joined', p.joined ? `${p.joined}–${String(p.joined + 1).slice(-2)} season` : ''),
      field('Graduating', p.grad),
    );
    body.append(facts);

    let about = null;
    if (p.about) { about = el('div', 'profile__about'); p.about.split(/\n\s*\n/).forEach((para) => about.append(el('p', '', para.trim()))); }
    body.append(section('About me', about, 'About me coming soon.'));

    let focus = null;
    if (p.focus && p.focus.length) { focus = el('ul', 'profile__tags'); p.focus.forEach((f) => focus.append(el('li', '', f))); }
    body.append(section('Focus areas', focus, 'Skills and focus areas coming soon.'));

    let hl = null;
    if (p.highlights && p.highlights.length) { hl = el('ul', 'check-list'); p.highlights.forEach((x) => hl.append(el('li', '', x))); }
    body.append(section('On the car', hl, 'Design and build highlights coming soon.'));

    if (p.seeking) body.append(section('Looking for', el('p', '', p.seeking)));

    const L = p.links || {};
    const row = el('div', 'btn-row profile__links');
    [['linkedin', 'LinkedIn'], ['portfolio', 'Portfolio'], ['resume', 'Résumé']].forEach(([k, label]) => {
      if (!L[k]) return;
      const a = el('a', 'btn btn--sm', label + ' ↗'); a.href = L[k]; a.target = '_blank'; a.rel = 'noopener'; row.append(a);
    });
    if (L.email) { const a = el('a', 'btn btn--sm btn--ghost', L.email); a.href = 'mailto:' + L.email; row.append(a); }
    if (!row.children.length) {
      const a = el('a', 'btn btn--sm btn--ghost', 'Contact via baja@uottawa.ca');
      a.href = 'mailto:baja@uottawa.ca?subject=' + encodeURIComponent('Connecting with ' + p.name);
      row.append(a);
    }
    body.append(row);
    if (p.placeholder) body.append(el('p', 'todo-note', 'Placeholder entry: replace it in assets/js/roster-data.js'));
  }

  function open(id, focusPanel = true) {
    const p = people.find((x) => x.id === id);
    if (!p) return close(false);
    const wasOpen = !drawer.hidden;
    current = p;
    fill(p);
    if (!wasOpen) { lastFocus = document.activeElement; drawer.hidden = false; window.RRR?.scrollLock(true); requestAnimationFrame(() => drawer.classList.add('is-open')); }
    panel.scrollTop = 0;
    if (focusPanel) panel.focus({ preventScroll: true });
    document.title = `${p.name} | Rough Rider Racing`;
  }
  const baseTitle = document.title;
  function close(clearHash = true) {
    if (drawer.hidden) return;
    drawer.classList.remove('is-open');
    drawer.hidden = true;
    window.RRR?.scrollLock(false);
    document.title = baseTitle;
    if (clearHash && location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (current) { const card = grid.querySelector(`a[href="#${CSS.escape(current.id)}"]`); (card || lastFocus)?.focus({ preventScroll: true }); }
    current = null;
  }
  function step(d) {
    if (!current) return;
    const list = visible.length ? visible : people;
    const i = list.indexOf(current);
    const next = list[(i + d + list.length) % list.length];
    history.replaceState(null, '', '#' + next.id);
    open(next.id);
  }

  drawer.querySelectorAll('[data-profile-close]').forEach((b) => b.addEventListener('click', () => close()));
  $('[data-profile-prev]', drawer).addEventListener('click', () => step(-1));
  $('[data-profile-next]', drawer).addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (drawer.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') { // keep focus inside the drawer
      const f = [...drawer.querySelectorAll('a[href], button')].filter((x) => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    history.pushState(null, '', '#' + id);
    open(id);
  });
  const fromHash = () => { const id = decodeURIComponent(location.hash.slice(1)); if (id) open(id); else close(false); };
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('popstate', fromHash);

  render();
  if (location.hash) fromHash();
})();
