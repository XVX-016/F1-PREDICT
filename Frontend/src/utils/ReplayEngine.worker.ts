import { ReplayEngine } from './ReplayEngine';
import { BAHRAIN_MAIN_TRACK, BAHRAIN_PIT_TRACK, BAHRAIN_TRACK_CONFIG } from './trackSpline';

const engine = new ReplayEngine(BAHRAIN_MAIN_TRACK, BAHRAIN_PIT_TRACK, BAHRAIN_TRACK_CONFIG);

let lastTick = 0;
let isLooping = false;
const TARGET_FPS = 120;
const STATE_FPS = 30;
let lastStateBroadcast = 0;

self.onmessage = (e: MessageEvent) => {
    try {
            const { type, payload } = e.data;

            switch (type) {
                case 'LOAD':
                engine.loadData(payload.metadata, payload.telemetry, payload.totalLapsHint);
                self.postMessage({ type: 'LOADED', payload: { duration: engine.getDuration() } });
                broadcastState(true);
                break;
            case 'PLAY':
                startLoop();
                break;
            case 'PAUSE':
                stopLoop();
                break;
            case 'SEEK':
                engine.seek(payload.t);
                broadcastState(true);
                break;
            case 'SET_SPEED':
                engine.setSpeed(payload.speed);
                break;
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown worker error';
        self.postMessage({ type: 'ERROR', payload: { message } });
    }
};

/**
 * High-precision monotonic loop with drift correction.
 */
function tick() {
    if (!isLooping) return;

    try {
        const now = performance.now();
        const dtSeconds = (now - lastTick) / 1000;

        // Safety cap for dt to prevent explosion after long pauses/backgrounding
        if (dtSeconds > 0.1) {
            lastTick = now;
            requestNextTick();
            return;
        }

        lastTick = now;
        engine.tick(dtSeconds);
        broadcastState();

        requestNextTick();
    } catch (err: unknown) {
        isLooping = false;
        const message = err instanceof Error ? err.message : 'Unknown tick error';
        self.postMessage({ type: 'ERROR', payload: { message: `Tick error: ${message}` } });
    }
}

function requestNextTick() {
    // If requestAnimationFrame is available (Chrome 71+ in workers), use it for sync
    // Otherwise, fallback to a zero-delay setTimeout for maximum frequency
    if (typeof self.requestAnimationFrame === 'function') {
        self.requestAnimationFrame(tick);
    } else {
        setTimeout(tick, 1000 / TARGET_FPS);
    }
}

function startLoop() {
    if (isLooping) return;
    if (engine.getDuration() <= 0) {
        broadcastState();
        return;
    }
    isLooping = true;
    lastTick = performance.now();
    engine.play();
    tick();
}

function stopLoop() {
    isLooping = false;
    engine.pause();
    broadcastState(true);
}

function broadcastState(force = false) {
    const now = performance.now();
    if (!force && now - lastStateBroadcast < 1000 / STATE_FPS) {
        return;
    }
    lastStateBroadcast = now;
    // Authoritative snapshot broadcast
    self.postMessage({ type: 'STATE_UPDATE', payload: engine.getState() });
}
