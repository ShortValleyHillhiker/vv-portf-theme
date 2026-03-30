let scrollHandler = null;

export function initNavObserver() {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler);

  const navLinks = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = navLinks
    .map(a => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (!sections.length) return;

  const activate = () => {
    const viewH = window.innerHeight;
    const atBottom = window.scrollY + viewH >= document.documentElement.scrollHeight - 10;
    let active = sections[0];

    if (atBottom) {
      for (const s of [...sections].reverse()) {
        if (s.getBoundingClientRect().top < viewH) { active = s; break; }
      }
    } else {
      sections.forEach(s => {
        if (s.getBoundingClientRect().top <= viewH / 2) active = s;
      });
    }

    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${active.id}`);
    });
  };

  let ticking = false;
  scrollHandler = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { activate(); ticking = false; });
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });
  activate();
}
