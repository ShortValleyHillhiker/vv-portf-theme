const SPAWN_DIST2 = 14 * 14;
const CLICK_DELAY = 120;

export function setupRipple(canvas, worker) {
    let dragging = false, lastSpawnX = 0, lastSpawnY = 0, lastClickTs = -Infinity;

    function canvasPos(e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    canvas.addEventListener('pointerdown', e => {
        const { x, y } = canvasPos(e);
        dragging = true; lastSpawnX = x; lastSpawnY = y;
        const now = performance.now();
        if (now - lastClickTs < CLICK_DELAY) return;
        lastClickTs = now;
        worker.postMessage({ type: 'ripple', x, y });
    });

    canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        const now = performance.now();
        if (now - lastClickTs < CLICK_DELAY) return;
        const { x, y } = canvasPos(e);
        const dx = x - lastSpawnX, dy = y - lastSpawnY;
        if (dx * dx + dy * dy >= SPAWN_DIST2) {
            lastClickTs = now; lastSpawnX = x; lastSpawnY = y;
            worker.postMessage({ type: 'ripple', x, y });
        }
    });

    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
}
