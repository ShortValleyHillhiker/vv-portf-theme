// Runs once per page load. Each section below is independent; stack.md §6.
{
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const atBottom = () => innerHeight + scrollY >= root.scrollHeight - 2;
  const el = (tag, className, text) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  };

  /* ---------- Favicon: a square in the theme colour ---------- */
  const icon = document.querySelector('link[rel="icon"]');
  const paintFavicon = () => {
    const c = getComputedStyle(root).getPropertyValue('--c-favicon').trim();
    if (!icon || !c) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${c}"/></svg>`;
    icon.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  };

  /* ---------- Theme slider ----------
     Opening and dragging are CSS and the native range input; JS only applies the value. */
  const THEME_NAMES = ['Mörk', 'Röd', 'Blå', 'Gul', 'Ljus', 'Ljus/röd', 'Ljus/blå'];
  const themeOf = () => +(root.className.match(/\btheme-(\d)\b/)?.[1] ?? 6);

  const themeInput = document.querySelector('.hud-theme input');
  const themeChip = themeInput?.closest('.hud-theme');
  const applyTheme = n => {
    root.classList.replace('theme-' + themeOf(), 'theme-' + n);
    themeChip.style.setProperty('--index', themeInput.max - n);
    themeInput.value = n;
    themeInput.setAttribute('aria-valuetext', THEME_NAMES[n]);
    paintFavicon();
    try { localStorage.setItem('tema', n); } catch {}
  };

  if (themeInput) {
    themeInput.addEventListener('input', () => applyTheme(themeInput.valueAsNumber));
    applyTheme(themeOf());
  } else {
    paintFavicon();
  }

  /* ---------- Grid overlay toggle (state restored by the head script) ---------- */
  const gridBtn = document.querySelector('.hud-grid');
  if (gridBtn) {
    const sync = () => gridBtn.setAttribute('aria-pressed', root.hasAttribute('data-grid'));
    sync();
    gridBtn.addEventListener('click', () => {
      const on = root.toggleAttribute('data-grid');
      gridBtn.classList.add('is-toggled'); // bounce the icon only after a click
      try { sessionStorage.setItem('grid', on ? '1' : ''); } catch {}
      sync();
    });
  }

  /* ---------- No transitions while resizing ---------- */
  let resizeTimer;
  addEventListener('resize', () => {
    root.classList.add('is-resizing');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => root.classList.remove('is-resizing'), 200);
  }, { passive: true });

  /* ---------- Phone menu: one button, state in aria-expanded (CSS reads it) ---------- */
  const nav = document.getElementById('site-nav');
  const menuBtn = document.querySelector('.hud-menu');
  if (menuBtn) {
    const isOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';
    const setMenu = open => menuBtn.setAttribute('aria-expanded', open);
    menuBtn.addEventListener('click', () => setMenu(!isOpen()));
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) { setMenu(false); menuBtn.focus(); }
    });
    nav?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    matchMedia('(width <= 51.25em)').addEventListener('change', e => { if (!e.matches) setMenu(false); });
  }

  /* ---------- Nav: active item ---------- */
  const navLinks = new Map();
  for (const a of nav?.querySelectorAll('a[href*="#"]') ?? []) {
    const url = new URL(a.href);
    const section = url.pathname === location.pathname && document.getElementById(url.hash.slice(1));
    if (section) navLinks.set(section, a);
  }
  if (navLinks.size) {
    const sections = [...navLinks.keys()];
    const visible = new Set();
    const update = () => {
      const current = atBottom() ? sections.at(-1) : sections.find(s => visible.has(s));
      if (!current) return;
      for (const [s, a] of navLinks) {
        if (s === current) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      }
    };
    const io = new IntersectionObserver(entries => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
      update();
    }, { rootMargin: '-20% 0px -60% 0px' });
    sections.forEach(s => io.observe(s));

    let bottom = atBottom();
    addEventListener('scroll', () => {
      if (atBottom() !== bottom) { bottom = !bottom; update(); }
    }, { passive: true });
    navLinks.get(sections[0]).setAttribute('aria-current', 'location');
  }

  /* ---------- Message tabs (arrow keys, Home, End) ---------- */
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    // Bring the chosen tab to the middle of the strip, so its neighbours show on both sides.
    // Smoothly: through the strip's own Lenis (smooth.js, data-scroll-x) when it runs, else natively.
    const center = tab => {
      const left = list.scrollLeft + tab.getBoundingClientRect().left - list.getBoundingClientRect().left
        - (list.clientWidth - tab.offsetWidth) / 2;
      if (list.lenis) list.lenis.scrollTo(left);
      else list.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    const select = (tab, focus) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      }
      if (focus) tab.focus({ preventScroll: true });   // center() scrolls, smoothly
    };
    list.addEventListener('click', e => {
      const t = e.target.closest('[role="tab"]');
      if (t) { select(t); center(t); }
    });
    list.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (i < 0 || next === undefined) return;
      e.preventDefault();
      const tab = tabs[(next + tabs.length) % tabs.length];
      select(tab, true);
      center(tab);
    });
    select(tabs.find(t => t.getAttribute('aria-selected') === 'true') ?? tabs[0]);
  }

  /* ---------- Reveal: stagger items in as they enter, on arrival and on scroll ---------- */
  // Same targets as the CSS in 70-motion.css
  const REVEAL = '.reveal, [data-reveal-children] > :not([data-reveal-children])';
  const reveals = [...document.querySelectorAll(REVEAL)];

  const settle = el => {
    revealIO.unobserve(el);
    el.classList.add('revealed', 'settled');
  };
  // Reveal a group of elements that entered together, in reading order. The stagger index
  // starts at 0 for every group (capped in CSS by --reveal-max-steps), so a fast scroll
  // never builds up a queue of ever-longer delays.
  const reveal = elements => elements
    .filter(el => !el.classList.contains('revealed'))
    .map(el => [el, el.getBoundingClientRect()])
    .sort(([, a], [, b]) => a.top - b.top || a.left - b.left)
    .forEach(([el], i) => {
      for (const prev of reveals.slice(0, reveals.indexOf(el))) {
        if (!prev.classList.contains('revealed')) settle(prev);
      }
      revealIO.unobserve(el);
      el.style.setProperty('--i', i);
      el.classList.add('revealed');
    });

  const revealIO = new IntersectionObserver(entries => {
    // Scrolled past (e.g. a jump to an anchor): show at once, no animation
    for (const e of entries) if (!e.isIntersecting && e.boundingClientRect.top < 0) settle(e.target);
    reveal(entries.filter(e => e.isIntersecting).map(e => e.target));
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  const observeReveal = el => { reveals.push(el); revealIO.observe(el); };

  // The last part of the page can never rise above the observer's bottom 10% margin.
  // At the bottom, reveal whatever is on screen.
  const revealAtBottom = () => {
    if (atBottom()) reveal(reveals.filter(el => el.getBoundingClientRect().top < innerHeight));
  };

  /* ---------- Home intro: wait for it, let the visitor skip it ----------
     State lives in html[data-intro]: playing → skip → done (or "seen" from the head script).
     "done" releases the scroll lock and brings in the HUD (CSS); the event restarts Lenis. */
  const intro = document.querySelector('.intro');
  const introDone = new Promise(resolve => {
    if (!intro || root.dataset.intro !== 'playing') return resolve();
    const done = () => { root.dataset.intro = 'done'; dispatchEvent(new Event('intro-done')); resolve(); };
    const skipping = new AbortController();
    // Once the cover starts leaving on its own, a skip would only restart its exit
    intro.addEventListener('animationstart', e => { if (e.target === intro) skipping.abort(); });
    intro.addEventListener('animationend', e => {
      if (e.target !== intro) return; // a word ending, not the cover
      skipping.abort();
      done();
    });
    const skip = () => { skipping.abort(); root.dataset.intro = 'skip'; };
    for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
      addEventListener(type, skip, { once: true, passive: true, signal: skipping.signal });
    }
  });

  // Start the reveals once the page has arrived (head script: after the old page has faded
  // out) and the intro, if any, is over, so the first screen comes in as one sequence.
  const startReveals = () => {
    reveals.forEach(el => revealIO.observe(el));
    addEventListener('scroll', revealAtBottom, { passive: true });
    revealAtBottom();
  };
  const arrived = new Promise(resolve => {
    if (root.classList.contains('arrived')) resolve();
    else addEventListener('arrived', resolve, { once: true });
  });
  // Setup has run: cancel the head script's failsafe
  clearTimeout(window.__failsafe);
  Promise.all([arrived, introDone]).then(startReveals);

  /* ---------- Touch screens: highlight the work card nearest the middle ---------- */
  if (matchMedia('(hover: none)').matches) {
    const seen = new Set();
    let queued = false;
    const mark = () => {
      queued = false;
      const mid = innerHeight / 2;
      let rowTop = null;
      let best = Infinity;
      for (const p of seen) {
        const r = p.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < best) { best = d; rowTop = r.top; }
      }
      for (const p of document.querySelectorAll('.work-post')) {
        p.classList.toggle('near', rowTop !== null && Math.abs(p.getBoundingClientRect().top - rowTop) < 1);
      }
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(mark); } };
    const nearIO = new IntersectionObserver(entries => {
      for (const e of entries) e.isIntersecting ? seen.add(e.target) : seen.delete(e.target);
      queue();
    });
    document.querySelectorAll('.work-post').forEach(p => nearIO.observe(p));
    addEventListener('scroll', queue, { passive: true });
  }

  /* ---------- Load more ----------
     <div class="load-row"><button data-load-more="work|blog" data-src="/posts.json" data-batch="3"></div>
     inside the listing [data-listing="work|blog"]. New items go in before the button row. */
  const safeUrl = u => {
    try {
      const url = new URL(u, location.origin);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '#';
    } catch { return '#'; }
  };

  const workCard = p => {
    const article = el('article', 'work-post reveal');
    const link = el('a');
    link.href = safeUrl(p.url);
    link.setAttribute('aria-label', p.client ? `${p.client} — ${p.title}` : p.title);
    if (p.preload) link.dataset.preload = JSON.stringify(p.preload);
    const fig = el('figure');
    const img = Object.assign(el('img'), {
      src: p.banner, alt: p.alt ?? '', width: p.width ?? 800, height: p.height ?? 600, loading: 'lazy', decoding: 'async',
    });
    if (p.srcset) {
      img.srcset = p.srcset;
      img.sizes = p.sizes ?? '100vw';
    }
    fig.append(img);
    const tags = el('div', 'work-post_tags');
    tags.append(...(p.tags ?? []).map(t => el('span', '', t)));
    article.append(link, fig, el('p', '', p.client || p.title), tags);
    return article;
  };

  const blogItem = p => {
    const article = el('article', 'blog-item reveal');
    const link = el('a');
    link.href = safeUrl(p.url);
    link.setAttribute('aria-label', p.title);
    article.append(link, el('span', 'post-title', p.title), el('small', '', 'Läs inlägg'));
    return article;
  };

  let postsRequest;
  const getPosts = src => (postsRequest ??= fetch(src)
    .then(r => { if (!r.ok) throw new Error(`posts.json: HTTP ${r.status}`); return r.json(); })
    .catch(err => { postsRequest = null; throw err; }));

  for (const btn of document.querySelectorAll('[data-load-more]')) {
    const type = btn.dataset.loadMore;
    const list = document.querySelector(`[data-listing="${type}"]`);
    const row = btn.closest('.load-row');
    const batch = +btn.dataset.batch || 3;
    if (!list) continue;
    btn.hidden = false;

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        const posts = (await getPosts(btn.dataset.src)).filter(p => p.type === type);
        const from = list.querySelectorAll(':scope > article').length;
        const items = posts.slice(from, from + batch).map(type === 'work' ? workCard : blogItem);
        for (const item of items) row?.parentElement === list ? list.insertBefore(item, row) : list.append(item);
        items.forEach(observeReveal);
        items[0]?.querySelector('a').focus({ preventScroll: true });
        if (from + items.length >= posts.length) row ? row.remove() : btn.remove();
      } catch (err) {
        console.error(err);
        btn.textContent = 'Kunde inte ladda — försök igen';
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Warm a case while its link is hovered ----------
     Case links carry data-preload (Hugo, partials/preload.html): the first media on that page.
     On hover intent or focus, fetch those images in the size the page will pick (same srcset
     and sizes), and load the Vimeo player once, hidden and without playing: its scripts
     (~420 KB, cached for weeks) and connections are then ready when the case opens.
     The player has to load in a real iframe: browsers key their cache by frame, so a
     <link rel=preload> from this page would not be reused inside Vimeo's iframe. */
  const saveData = navigator.connection?.saveData;
  const warmed = new Set();
  let playerWarm = false;
  const warmPlayer = url => {
    if (playerWarm) return;
    playerWarm = true;
    const u = new URL(url);
    u.searchParams.delete('background');                 // background=1 would autoplay
    u.searchParams.set('autoplay', '0');
    u.searchParams.set('muted', '1');
    const frame = Object.assign(el('iframe'), { src: u.href, hidden: true, tabIndex: -1, title: '' });
    frame.setAttribute('aria-hidden', 'true');
    frame.addEventListener('load', () => frame.remove(), { once: true });
    setTimeout(() => frame.remove(), 10000);   // or if it never loads (stalled network, blocker)
    document.body.append(frame);
  };
  const warm = link => {
    if (saveData || warmed.has(link.href)) return;
    warmed.add(link.href);
    let media;
    try { media = JSON.parse(link.dataset.preload); } catch { return; }
    // sizes and srcset before src, so the browser picks from the set instead of fetching src
    for (const { srcset, sizes, src } of media.img ?? []) Object.assign(new Image(), { sizes, srcset, src });
    if (media.vimeo) warmPlayer(media.vimeo);
  };

  // Hover: wait a moment, so moving the pointer across the grid doesn't warm every case
  const HOVER_INTENT_MS = 100;
  let intent;
  const caseLink = t => t instanceof Element && t.closest('a[data-preload]');
  document.addEventListener('pointerover', e => {
    const link = caseLink(e.target);
    if (link && e.pointerType !== 'touch') intent = setTimeout(() => warm(link), HOVER_INTENT_MS);
  }, { passive: true });
  document.addEventListener('pointerout', e => { if (caseLink(e.target)) clearTimeout(intent); }, { passive: true });
  // Touch and keyboard: the first touch or focus is intent enough
  document.addEventListener('touchstart', e => { const l = caseLink(e.target); if (l) warm(l); }, { passive: true });
  document.addEventListener('focusin', e => { const l = caseLink(e.target); if (l) warm(l); });

  /* ---------- Page transition fallback (Firefox: no cross-document view transitions) ----------
     Same check as the head script. Fade main out, then navigate; the new page fades in via
     its reveals once it has settled. Only links to another page on this site are touched. */
  if (!('onpagereveal' in window) && !reduceMotion) {
    // A link to another page on this site, opened in this tab: returns its URL, else null
    const pageLink = target => {
      const a = target instanceof Element && target.closest('a[href]');
      if (!a || a.target || a.hasAttribute('download')) return null;
      const url = new URL(a.href);
      const samePage = url.pathname + url.search === location.pathname + location.search;
      return url.origin === location.origin && !samePage ? url : null;
    };

    const main = document.querySelector('main');
    document.addEventListener('click', e => {
      const url = pageLink(e.target);
      if (!url || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      root.classList.add('vt-leaving');
      // Leave when main's fade-out has ended: the CSS animation decides the timing, so the
      // duration lives only in the tokens (any unit). The timer is a backstop, should the
      // animation never run or end.
      let gone = false;
      const go = () => { if (!gone) { gone = true; location.assign(url); } };
      main.addEventListener('animationend', ev => { if (ev.target === main) go(); });
      setTimeout(go, 1000);
    });

    // Prefetch on hover or focus, so the next page often comes from cache and the gap
    // between fade-out and fade-in shrinks (Chromium/Safari use speculation rules instead)
    const prefetched = new Set();
    const prefetch = e => {
      const url = pageLink(e.target)?.href.split('#')[0];
      if (!url || prefetched.has(url)) return;
      prefetched.add(url);
      document.head.append(Object.assign(document.createElement('link'), { rel: 'prefetch', href: url }));
    };
    document.addEventListener('pointerover', prefetch, { passive: true });
    document.addEventListener('focusin', prefetch);

    // Back/forward cache restores the faded page: show it again
    addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('vt-leaving'); });
  }

  /* ---------- Smooth scroll: Lenis, on condition (§7.2) ---------- */
  const smoothOk = matchMedia('(pointer: fine)').matches && !reduceMotion;
  if (smoothOk) {
    const src = document.querySelector('script[data-smooth]')?.dataset.smooth;
    if (src) import(src).catch(() => {});
  }
}
