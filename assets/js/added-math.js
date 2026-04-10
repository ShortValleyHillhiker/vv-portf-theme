const FRAME_MS = 1000 / 12;

// Each function: (col, row, cols, rows, t) => lum [0..255]
const VISUALIZERS = {
  // Two cosine waves — one horizontal, one vertical — travelling at different speeds
  coswave(col, row, cols, rows, t) {
    const x = col / cols * Math.PI * 6;
    const y = row / rows * Math.PI * 6;
    const v = Math.cos(x - t * 2) + Math.cos(y - t * 1.5);
    return v * 63.75 + 127.5; // v ∈ [-2, 2] → lum ∈ [0, 255]
  },

  // Classic demoscene plasma: four overlapping sine fields
  plasma(col, row, cols, rows, t) {
    const x = col / cols, y = row / rows;
    const v = Math.sin(x * 9 + t)
            + Math.sin(y * 9 + t * 1.1)
            + Math.sin((x + y) * 6 + t * 0.7)
            + Math.sin(Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 14 - t * 1.5);
    return (v / 4 + 1) * 127.5;
  },

  // Polar checkerboard — adjacent cells invert the ripple phase, creating a shimmering grid
  checker(col, row, cols, rows, t) {
    const x = col / cols - 0.5, y = row / rows - 0.5;
    const wave = Math.sin(Math.sqrt(x * x + y * y) * 18 - t * 2.5);
    const tile = (col + row) % 2 ? 1 : -1;
    return Math.max(0, Math.min(255, (wave * tile * 0.5 + 0.5) * 255));
  },

  // Two-source interference pattern — moiré-like rings that drift apart
  interference(col, row, cols, rows, t) {
    const x = col / cols - 0.5, y = row / rows - 0.5;
    const a = Math.sin(Math.sqrt((x - 0.28) ** 2 + y * y) * 20 - t * 2);
    const b = Math.sin(Math.sqrt((x + 0.28) ** 2 + y * y) * 20 - t * 1.7);
    return (a + b) * 63.75 + 127.5;
  }
};

// Sets up an animation loop that computes lum data and pushes it to the worker.
// Sends both `lum` and `tick` in the same callback so they always arrive in order.
// Returns a controller with resize(cols, rows) and stop() methods.
export function setupMathSource(worker, name, cols, rows) {
  const fn = VISUALIZERS[name];
  if (!fn) return { resize() {}, stop() {} };

  let animId, lastTs = 0;
  let _cols = cols, _rows = rows;
  let paused = true, pauseStart = 0, timeOffset = 0;

  (function tick(ts) {
    animId = requestAnimationFrame(tick);
    if (paused || ts - lastTs < FRAME_MS) return;
    lastTs = ts;
    const t = (ts - timeOffset) * 0.001; // time that only advances while active
    const data = new Float32Array(_cols * _rows);
    for (let row = 0; row < _rows; row++)
      for (let col = 0; col < _cols; col++)
        data[row * _cols + col] = fn(col, row, _cols, _rows, t);
    worker.postMessage({ type: 'lum', data, cols: _cols, rows: _rows }, [data.buffer]);
    worker.postMessage({ type: 'tick', ts });
  })(0);

  return {
    resize(c, r) { _cols = c; _rows = r; },
    pause()  { if (!paused) { pauseStart = performance.now(); paused = true; } },
    resume() { if (paused)  { timeOffset += performance.now() - pauseStart; paused = false; } },
    stop()   { cancelAnimationFrame(animId); }
  };
}
