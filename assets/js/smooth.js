// Smooth scroll (Lenis): the page, anchor jumps and the sideways strips. Loaded by main.js only
// with a fine pointer and motion allowed.
import Lenis from './vendor/lenis.mjs';

// Anchor jumps: a fixed duration (CSS token --scroll-duration) with an ease-in-out curve,
// instead of Lenis' default lerp, which starts at full speed. Lenis keeps scroll-margin-top.
// A CSS time in ms, whichever unit the token is written in ("1100ms" or "1.1s")
const toMs = time => parseFloat(time) * (time.trim().endsWith('ms') ? 1 : 1000);
const ms = toMs(getComputedStyle(document.documentElement).getPropertyValue('--scroll-duration')) || 1100;
const easeInOutQuart = t => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

const lenis = new Lenis({
  autoRaf: true, // Lenis runs its own frame loop
  anchors: { duration: ms / 1000, easing: easeInOutQuart },
});

// Sideways strips (data-scroll-x, the message tabs): their own Lenis, horizontal gestures only
// (trackpad swipes, shift + wheel), so a vertical wheel over them still scrolls the page.
// main.js uses el.lenis to glide the chosen tab into view.
for (const el of document.querySelectorAll('[data-scroll-x]')) {
  el.lenis = new Lenis({ wrapper: el, content: el, orientation: 'horizontal', gestureOrientation: 'horizontal', autoRaf: true });
}

// No scrolling while the home intro runs. CSS locks the page's overflow, but Lenis scrolls
// by itself, so hold it too until main.js says the intro has ended.
if (['playing', 'skip'].includes(document.documentElement.dataset.intro)) {
  lenis.stop();
  addEventListener('intro-done', () => lenis.start(), { once: true });
}

// Lenis starts its scroll on an anchor click but doesn't cancel the browser's own jump.
// In Firefox that jump lands first and stops Lenis' animation. Cancel it here (this runs
// before Lenis' listener on window), keep the URL hash in sync, and move focus to the target
// so the skip link still works for keyboard users.
document.addEventListener('click', e => {
  const a = e.target instanceof Element && e.target.closest('a[href*="#"]');
  if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  e.preventDefault();
  history.pushState(null, '', url.hash);
  document.getElementById(decodeURIComponent(url.hash.slice(1)))?.focus({ preventScroll: true });
});
