export function initMenu() {
  const menuBtn = document.querySelector('.menu-tgl');
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
