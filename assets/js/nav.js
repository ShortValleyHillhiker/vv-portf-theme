export function initNav() {
  document.body.classList.toggle('is-home', window.location.pathname === '/');
}
