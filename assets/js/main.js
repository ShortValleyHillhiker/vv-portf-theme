import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';
import { initFigures } from './figure.js';

// Menu
function initMenu() {
  const menuBtn = document.querySelector('.hud-menu');
  const navEl = document.querySelector('nav');
  if (!menuBtn || !navEl) return;

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

// Grid
function initGrid() {
  const gridBtn = document.querySelector('.hud-grid');
  if (!gridBtn) return;
  gridBtn.addEventListener('click', () => gridBtn.classList.toggle('active'));
}

// Theme
function initTheme() {
  const themeTgl = document.querySelector('.hud-theme');
  if (!themeTgl) return;

  const input = themeTgl.querySelector('input');
  const max = parseInt(input.max, 10);
  let rect;

  const setTheme = v => {
    themeTgl.className = themeTgl.className.replace(/\btheme-\d+\b/, '') + ` theme-${v}`;
    themeTgl.style.setProperty('--index', max - v);
    input.value = v;
  };

  document.addEventListener('click', ({ target: el }) => {
    if (el.closest('.hud-theme') && !themeTgl.classList.contains('expanded')) {
      themeTgl.classList.add('expanded');
    } else if (!el.closest('.hud-theme')) {
      themeTgl.classList.remove('expanded');
    }
  });

  themeTgl.addEventListener('pointerdown', () => {
    rect = themeTgl.getBoundingClientRect();
  });

  let rafPending = false;
  themeTgl.addEventListener('pointermove', e => {
    if (!e.buttons || !themeTgl.classList.contains('expanded') || rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      const r = rect || themeTgl.getBoundingClientRect();
      setTheme(Math.max(0, Math.min(max, Math.round((1 - (e.clientY - r.top) / r.height) * max))));
      rafPending = false;
    });
  });

  input.addEventListener('input', e => setTheme(parseInt(e.target.value, 10)));

  themeTgl.addEventListener('mouseenter', () => {
    if (window.matchMedia('(hover: hover)').matches) themeTgl.classList.add('expanded');
  });
  themeTgl.addEventListener('mouseleave', () => {
    if (window.matchMedia('(hover: hover)').matches) themeTgl.classList.remove('expanded');
  });

  setTheme(parseInt(input.value, 10));
}

// Load more
let postsCache = null;

async function fetchPosts() {
  if (postsCache) return postsCache;
  const res = await fetch('/posts.json');
  postsCache = await res.json();
  return postsCache;
}

function renderItem(post, type) {
  const a = document.createElement('a');
  a.href = post.url;
  a.className = `${type}-item`;

  const shaderOff = post.shader === false || post.shader === 'off' || post.shader === 'false' || post.shader === 'no';
  const visualizer = post.visualizer ? ` data-visualizer="${post.visualizer}"` : '';
  const autoRipple = post.auto_ripple ? ' data-auto-ripple="true"' : '';
  const interaction = type === 'work' ? ' data-interaction="none"' : '';

  const figure = post.banner
    ? `<figure${interaction}${visualizer}${autoRipple}>
         ${shaderOff ? '' : '<canvas></canvas>'}
         <img crossorigin="anonymous" src="${post.banner}" alt="${post.title}">
       </figure>`
    : '';

  const meta = type === 'work'
    ? post.category ? `<span class="post-meta">${post.category}</span>` : ''
    : `<span class="post-meta">${new Date(post.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>`;

  a.innerHTML = `${figure}<span class="post-title">${post.title}</span>${meta}`;
  return a;
}

function initLoadMore() {
  document.querySelectorAll('.load-more-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const loaded = parseInt(btn.dataset.loaded, 10);
      const batch = parseInt(btn.dataset.batch, 10) || 1;
      const list = btn.closest('section').querySelector('.listing-items');

      const posts = await fetchPosts();
      const slice = posts.slice(loaded, loaded + batch);

      if (!slice.length) { btn.remove(); return; }

      slice.forEach(post => list.appendChild(renderItem(post, post.type)));
      initFigures();
      btn.dataset.loaded = loaded + slice.length;
      if (loaded + slice.length >= posts.length) btn.remove();
    });
  });
}

// Boot
const swup = new Swup({
  plugins: [new SwupHeadPlugin()],
  containers: ['#swup'],
});

initMenu();
initGrid();
initTheme();

swup.hooks.on('page:view', () => { initLoadMore(); initFigures(); });
initLoadMore();
initFigures();
