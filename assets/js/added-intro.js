const TARGET_FPS = 12;
const FRAME_MS = 1000 / TARGET_FPS;

export function loadImageFromUrl(worker, url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => createImageBitmap(img).then(b => worker.postMessage({ type: 'image', bitmap: b }, [b]));
    img.src = url;
}

export function setupRAF(worker) {
    let lastTickTs = 0, paused = true;

    (function rafLoop(ts) {
        requestAnimationFrame(rafLoop);
        if (paused) return;
        if (ts - lastTickTs >= FRAME_MS) {
            lastTickTs = ts;
            worker.postMessage({ type: 'tick', ts });
        }
    })(0);

    return {
        pause()  { paused = true; },
        resume() { paused = false; }
    };
}
