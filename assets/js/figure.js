import { setupRipple } from './added-ripple.js';
import { loadImageFromUrl, setupRAF } from './added-intro.js';
import { setupMathSource } from './added-math.js';

const CELL = 16;
const MATH_MODES = ['coswave', 'plasma', 'checker', 'interference'];

function setupAutoRipple(canvas, worker, isInView) {
  (function schedule() {
    setTimeout(() => {
      if (isInView()) {
        const { width, height } = canvas.getBoundingClientRect();
        worker.postMessage({ type: 'ripple', x: Math.random() * width, y: Math.random() * height });
      }
      schedule();
    }, 800 + Math.random() * 1600);
  })();
}

function initFigure(figure) {
  const canvas = figure.querySelector('canvas');
  if (!canvas || canvas._init) return;
  canvas._init = true;

  const img = figure.querySelector('img');
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;

  canvas.width = width;
  canvas.height = height;

  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('/worker.js');

  worker.postMessage(
    { type: 'init', canvas: offscreen, width, height, cell: CELL, cols, rows },
    [offscreen]
  );

  const mode = figure.dataset.visualizer;
  let raf;

  if (MATH_MODES.includes(mode)) {
    raf = setupMathSource(worker, mode, cols, rows);
  } else {
    raf = setupRAF(worker);
    if (img?.src) loadImageFromUrl(worker, img.src);
  }

  if (figure.dataset.interaction !== 'none') {
    setupRipple(canvas, worker);
  }

  let inView = false;

  if (figure.dataset.autoRipple === 'true') {
    setupAutoRipple(canvas, worker, () => inView);
  }

  new ResizeObserver(() => {
    const { width: w, height: h } = canvas.getBoundingClientRect();
    if (!w || !h) return;
    const c = Math.ceil(w / CELL), r = Math.ceil(h / CELL);
    worker.postMessage({ type: 'resize', width: w, height: h, cell: CELL, cols: c, rows: r });
    raf.resize?.(c, r);
  }).observe(figure);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    inView ? raf.resume() : raf.pause();
  }).observe(figure);
}

export function initFigures() {
  document.querySelectorAll('figure:has(canvas)').forEach(initFigure);
}
