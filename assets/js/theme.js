export function initTheme() {
  const themeTgl = document.querySelector('.theme-tgl');
  if (!themeTgl) return;

  const input = themeTgl.querySelector('input');
  const max = parseInt(input.max, 10);
  let rect;

  const setTheme = v => {
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
