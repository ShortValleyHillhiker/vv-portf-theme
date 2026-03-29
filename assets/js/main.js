import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';

// ─── SWUP ────────────────────────────────────────────────────────────────────

const swup = new Swup({
  plugins: [new SwupHeadPlugin()],
  containers: ['#swup'],
});

// Re-run all DOM-dependent init on every page view
swup.hooks.on('page:view', () => {
  initNav();
  initAnchorScroll();
  initNavObserver();
  initLoadMore();
});

// ─── NAV STATE ───────────────────────────────────────────────────────────────

function initNav() {
  document.body.classList.toggle('is-home', window.location.pathname === '/');
}

// ─── ANCHOR SCROLL ───────────────────────────────────────────────────────────

function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navOffset = 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ─── NAV ACTIVE STATE ─────────────────────────────────────────────────────────

function initNavObserver() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  if (!navLinks.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    });
  }, { threshold: 0.3 });

  navLinks.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

// ─── HAMBURGER / NAV OVERLAY ─────────────────────────────────────────────────

const menuBtn = document.querySelector('.menu-tgl');
const navEl = document.querySelector('nav');

if (menuBtn && navEl) {
  menuBtn.addEventListener('click', () => {
    const isActive = menuBtn.classList.toggle('active');
    menuBtn.setAttribute('aria-expanded', String(isActive));
  });

  navEl.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ─── GRID TOGGLE ─────────────────────────────────────────────────────────────

const gridBtn = document.querySelector('.grid-tgl');

if (gridBtn) {
  gridBtn.addEventListener('click', () => {
    gridBtn.classList.toggle('active');
  });

  // Reset grid state on page transition
  swup.hooks.on('page:view', () => {
    gridBtn.classList.remove('active');
  });
}

// ─── THEME SELECTOR ──────────────────────────────────────────────────────────

const themeTgl = document.querySelector('.theme-tgl');

if (themeTgl) {
  const input = themeTgl.querySelector('input');
  const max = parseInt(input.max, 10);
  let rect;

  const setTheme = v => {
    // Apply theme class to html element so it persists across Swup transitions
    document.documentElement.className = document.documentElement.className
      .replace(/\btheme-\d+\b/, '') + ` theme-${v}`;
    themeTgl.className = themeTgl.className
      .replace(/\btheme-\d+\b/, '') + ` theme-${v}`;
    themeTgl.style.setProperty('--index', max - v);
    input.value = v;
  };

  document.addEventListener('click', ({ target: el }) => {
    if (el.closest('.theme-tgl') && !themeTgl.classList.contains('expanded')) {
      themeTgl.classList.add('expanded');
    } else if (!el.closest('.theme-tgl')) {
      themeTgl.classList.remove('expanded');
    }
  });

  themeTgl.addEventListener('touchstart', () => {
    rect = themeTgl.getBoundingClientRect();
  }, { passive: true });

  let rafPending = false;
  const handleMove = e => {
    if (e.type === 'pointermove' && !e.buttons) return;
    if (!themeTgl.classList.contains('expanded')) return;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const r = rect || themeTgl.getBoundingClientRect();
      setTheme(Math.max(0, Math.min(max, Math.round((1 - (clientY - r.top) / r.height) * max))));
      rafPending = false;
    });
  };

  ['pointermove', 'touchmove'].forEach(ev =>
    themeTgl.addEventListener(ev, handleMove, { passive: ev === 'pointermove' })
  );

  input.addEventListener('input', e => setTheme(parseInt(e.target.value, 10)));

  themeTgl.addEventListener('mouseenter', () => {
    if (window.matchMedia('(hover: hover)').matches) themeTgl.classList.add('expanded');
  });
  themeTgl.addEventListener('mouseleave', () => {
    if (window.matchMedia('(hover: hover)').matches) themeTgl.classList.remove('expanded');
  });

  setTheme(parseInt(input.value, 10));
}

// ─── LOAD MORE ───────────────────────────────────────────────────────────────

let postsCache = null;

async function fetchPosts() {
  if (postsCache) return postsCache;
  const res = await fetch('/posts.json');
  postsCache = await res.json();
  return postsCache;
}

function renderWorkItem(post) {
  const li = document.createElement('li');
  li.innerHTML = `<a href="${post.url}">
    ${post.banner ? `<img src="${post.banner}" alt="${post.title}">` : ''}
    <span class="post-title">${post.title}</span>
    ${post.category ? `<span class="post-meta">${post.category}</span>` : ''}
  </a>`;
  return li;
}

function renderBlogItem(post) {
  const li = document.createElement('li');
  const date = new Date(post.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  li.innerHTML = `<a href="${post.url}">
    <span class="post-title">${post.title}</span>
    <span class="post-meta">${date}</span>
  </a>`;
  return li;
}

function initLoadMore() {
  document.querySelectorAll('.load-more-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      const loaded = parseInt(btn.dataset.loaded, 10);
      const section = btn.closest('section');
      const list = section.querySelector('ul');

      const posts = await fetchPosts();
      const filtered = posts.filter(p => p.type === type);
      const next = filtered[loaded];

      if (!next) { btn.remove(); return; }

      const item = type === 'work' ? renderWorkItem(next) : renderBlogItem(next);
      list.appendChild(item);

      const newLoaded = loaded + 1;
      btn.dataset.loaded = newLoaded;

      if (newLoaded >= filtered.length) btn.remove();
    });
  });
}

// ─── INIT ────────────────────────────────────────────────────────────────────

initNav();
initAnchorScroll();
initNavObserver();
initLoadMore();
