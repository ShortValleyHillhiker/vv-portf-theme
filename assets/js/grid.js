export function initGrid() {
  const gridBtn = document.querySelector('.grid-tgl');
  if (!gridBtn) return;

  gridBtn.addEventListener('click', () => {
    gridBtn.classList.toggle('active');
  });
}
