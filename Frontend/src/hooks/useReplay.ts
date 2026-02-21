import { useEffect, useState, useRef } from "react";
import { transformTimelineData, DRIVER_INFO } from "../utils/ReplayDataHelper";
import { RaceTimeline } from '../types/domain';
import { ReplayState, TelemetrySample } from "../utils/ReplayEngine";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TELEMETRY_TIMEOUT_MS = 45000;
const MAX_FRAMES_PER_DRIVER = 12000;
const TELEMETRY_CONCURRENCY = 4;

export function useReplay(raceId: string) {
    const [state, setState] = useState<ReplayState | null>(null);
    const [loading, setLoading] = useState(false);
    const [maxTime, setMaxTime] = useState(6000);
    const [trackPath, setTrackPath] = useState<Array<{ x: number; y: number }>>([]);
    const [playing, setPlayingState] = useState(false);
    const [speed, setSpeedState] = useState(1);

    const workerRef = useRef<Worker | null>(null);
    const dataLoadedRef = useRef<string | null>(null); // Track which raceId has been loaded
    const workerReadyRef = useRef(false);
    const loadWatchdogRef = useRef<number | null>(null);
    const clearLoadWatchdog = () => {
        if (loadWatchdogRef.current !== null) {
            window.clearTimeout(loadWatchdogRef.current);
            loadWatchdogRef.current = null;
        }
    };

    const fetchJsonWithTimeout = async (url: string, timeoutMs = TELEMETRY_TIMEOUT_MS) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { signal: controller.signal });
            return res;
        } finally {
            clearTimeout(timer);
        }
    };

    const appendQuery = (url: string, query: string) => {
        if (url.includes('?')) return `${url}&${query}`;
        return `${url}?${query}`;
    };

    const downsampleTelemetry = (samples: TelemetrySample[]): TelemetrySample[] => {
        if (samples.length <= MAX_FRAMES_PER_DRIVER) return samples;
        const stride = Math.ceil(samples.length / MAX_FRAMES_PER_DRIVER);
        const out: TelemetrySample[] = [];
        for (let i = 0; i < samples.length; i += stride) {
            out.push(samples[i]);
        }
        const last = samples[samples.length - 1];
        if (out[out.length - 1] !== last) out.push(last);
        return out;
    };

    const runWithConcurrency = async <T, R>(
        items: T[],
        limit: number,
        worker: (item: T) => Promise<R>
    ): Promise<R[]> => {
        const results: R[] = [];
        let idx = 0;
        const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (idx < items.length) {
                const current = idx++;
                results[current] = await worker(items[current]);
            }
        });
        await Promise.all(runners);
        return results;
    };

    // Initialize Worker (ONCE per hook instance)
    useEffect(() => {
        console.log('[useReplay] Initializing worker...');
        const worker = new Worker(new URL('../utils/ReplayEngine.worker.ts', import.meta.url), {
            type: 'module'
        });
        workerRef.current = worker;
        setState(null);

        worker.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'STATE_UPDATE') {
                setState(payload);
                setLoading(false);
                clearLoadWatchdog();
            } else if (type === 'LOADED') {
                console.log('[useReplay] Data loaded, duration:', payload.duration);
                setMaxTime(payload.duration / 1000);
                setLoading(false);
                clearLoadWatchdog();
            } else if (type === 'ERROR') {
                console.error('[useReplay] Worker error:', payload.message);
                setLoading(false);
                clearLoadWatchdog();
            }
        };
        worker.onerror = (e) => {
            console.error('[useReplay] Worker runtime error:', e);
            setLoading(false);
            clearLoadWatchdog();
        };
        worker.onmessageerror = (e) => {
            console.error('[useReplay] Worker message error:', e);
            setLoading(false);
            clearLoadWatchdog();
        };

        workerReadyRef.current = true;

        return () => {
            console.log('[useReplay] Terminating worker...');
            clearLoadWatchdog();
            worker.terminate();
            workerReadyRef.current = false;
        };
    }, []);

    // Fetch and Load Data (ONCE per raceId)
    useEffect(() => {
        // Guard: Skip if no raceId, worker not ready, or already loaded for this raceId
        if (!raceId || !workerRef.current || !workerReadyRef.current) {
            console.log('[useReplay] Skipping fetch - worker not ready');
            return;
        }

        if (dataLoadedRef.current === raceId) {
            console.log('[useReplay] Skipping fetch - already loaded for:', raceId);
            return;
        }

        async function fetchAndLoad() {
            console.log('[useReplay] Fetching timeline for:', raceId);
            setLoading(true);
            setState(null);
            clearLoadWatchdog();
            loadWatchdogRef.current = window.setTimeout(() => {
                console.warn('[useReplay] Load watchdog tripped; clearing synchronizing state');
                setLoading(false);
            }, 30000);
            try {
                const res = await fetch(`${API_BASE}/api/races/${raceId}/timeline`);
                if (!res.ok) {
                    const body = await res.text().catch(() => '');
                    const detail = body ? `: ${body.slice(0, 200)}` : '';
                    throw new Error(`Failed to fetch timeline (${res.status})${detail}`);
                }
                const timeline: RaceTimeline = await res.json();

                if (!timeline || (!timeline.telemetry && !timeline.laps && !timeline.telemetry_urls)) {
                    throw new Error('Malformed timeline data received');
                }

                let finalTelemetry = {};
                let finalMetadata = [];

                if (timeline.telemetry_urls) {
                    console.log('[useReplay] Fetching distributed telemetry...');
                    const driverCodes = Object.keys(timeline.telemetry_urls);
                    const telemetryWorker = async (code: string) => {
                        const url = timeline.telemetry_urls![code];
                        const resolvedUrl = /^https?:\/\//i.test(url)
                            ? url
                            : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
                        const fallbackLocalUrl = `${API_BASE}/api/races/${raceId}/telemetry/${code}`;
                        const localQuery = `max_frames=${MAX_FRAMES_PER_DRIVER}`;
                        const resolvedWithQuery = resolvedUrl.startsWith(API_BASE)
                            ? appendQuery(resolvedUrl, localQuery)
                            : resolvedUrl;
                        const fallbackWithQuery = appendQuery(fallbackLocalUrl, localQuery);
                        const candidates = [resolvedUrl];
                        if (resolvedWithQuery !== resolvedUrl) candidates.unshift(resolvedWithQuery);
                        if (fallbackWithQuery !== resolvedUrl && fallbackWithQuery !== resolvedWithQuery) {
                            candidates.push(fallbackWithQuery);
                        }
                        if (fallbackLocalUrl !== resolvedUrl) candidates.push(fallbackLocalUrl);

                        for (const candidateUrl of candidates) {
                            try {
                                const tRes = await fetchJsonWithTimeout(candidateUrl);
                                if (!tRes.ok) continue;
                                const localData = await tRes.json();
                                return { code, frames: localData };
                            } catch (err) {
                                console.warn(`[useReplay] telemetry fetch failed for ${code} @ ${candidateUrl}`, err);
                            }
                        }
                        return null;
                    };

                    const driverResults = await runWithConcurrency(
                        driverCodes,
                        TELEMETRY_CONCURRENCY,
                        telemetryWorker
                    );
                    const results = driverResults.filter((x): x is { code: string; frames: any } => !!x);
                    const mergedTelemetry: Record<string, TelemetrySample[]> = {};

                    results.forEach(res => {
                        if (res) {
                            // Extract frames from supported formats:
                            // 1) [] flat list
                            // 2) { CODE: [] }
                            // 3) { "1": [], "2": [], ... } lap-keyed map
                            let frames: any[] = [];
                            if (Array.isArray(res.frames)) {
                                frames = res.frames;
                            } else if (res.frames && typeof res.frames === 'object') {
                                const byCode = res.frames[res.code];
                                if (Array.isArray(byCode)) {
                                    frames = byCode;
                                } else {
                                    const entries = Object.entries(res.frames)
                                        .filter(([, value]) => Array.isArray(value));

                                    const bucketed = entries.every(([key]) => key.includes('_'));
                                    if (bucketed) {
                                        frames = entries
                                            .sort(([a], [b]) => {
                                                const aStart = Number(a.split('_')[0]);
                                                const bStart = Number(b.split('_')[0]);
                                                return aStart - bStart;
                                            })
                                            .flatMap(([, value]) => value as any[]);
                                    } else {
                                        const lapBuckets = entries
                                            .sort(([a], [b]) => Number(a) - Number(b))
                                            .map(([lapKey, value]) => ({
                                                lap: Number(lapKey) || 1,
                                                frames: (value as any[]).map((f: any) => ({
                                                    ...f,
                                                    lap: f.lap ?? Number(lapKey)
                                                }))
                                            }));

                                        // Some cache payloads have per-lap relative time (t resets each lap).
                                        // Build monotonic race time to keep interpolation stable.
                                        let offset = 0;
                                        frames = lapBuckets.flatMap(({ frames: lapFrames }) => {
                                            const normalized = lapFrames.map((f: any) => ({
                                                ...f,
                                                t: Number(f.t || 0) + offset
                                            }));
                                            const lapMax = normalized.reduce((mx: number, f: any) => Math.max(mx, Number(f.t || 0)), offset);
                                            offset = lapMax + 0.04;
                                            return normalized;
                                        });
                                    }
                                }
                            }
                            const telemetryScale = (() => {
                                if (!frames.length) return 1;
                                const firstT = Number(frames[0]?.t || 0);
                                const secondT = Number(frames[Math.min(1, frames.length - 1)]?.t || firstT);
                                const dt = Math.abs(secondT - firstT);
                                return dt > 0 && dt < 2 ? 1000 : 1;
                            })();

                            mergedTelemetry[res.code] = downsampleTelemetry(frames
                                .map((f: any) => ({
                                    t: Number(f.t || 0) * telemetryScale,
                                    lap: Math.max(1, Number(f.lap || f.lap_number || f.LapNumber || 1)),
                                    progress: Number(f.rel_dist ?? f.progress ?? 0),
                                    x: Number(f.x),
                                    y: Number(f.y),
                                    speed: Number(f.speed || 0),
                                    throttle: Number(f.throttle || 0),
                                    brake: Number(f.brake || 0),
                                    gear: Number(f.gear || 1),
                                    drs: !!f.drs,
                                    isPitting: f.is_pitting || f.isPitting || false
                                }))
                                .filter((f) => Number.isFinite(f.t))
                                .sort((a, b) => a.t - b.t)
                                .map((f) => ({
                                    ...f,
                                    progress: Number.isFinite(f.progress) ? ((f.progress % 1) + 1) % 1 : 0
                                })));
                        }
                    });

                    // Normalize x/y globally across loaded telemetry so map positions are race-relative [0,1].
                    const allPoints = Object.values(mergedTelemetry).flatMap(samples =>
                        samples
                            .filter((s) => Number.isFinite(s.x) && Number.isFinite(s.y))
                            .map((s) => ({ x: Number(s.x), y: Number(s.y) }))
                    );
                    if (allPoints.length > 0) {
                        const minX = Math.min(...allPoints.map((p) => p.x));
                        const maxX = Math.max(...allPoints.map((p) => p.x));
                        const minY = Math.min(...allPoints.map((p) => p.y));
                        const maxY = Math.max(...allPoints.map((p) => p.y));
                        const rangeX = Math.max(1e-6, maxX - minX);
                        const rangeY = Math.max(1e-6, maxY - minY);
                        Object.keys(mergedTelemetry).forEach((driverId) => {
                            mergedTelemetry[driverId] = mergedTelemetry[driverId].map((s) => {
                                if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return s;
                                const nx = (Number(s.x) - minX) / rangeX;
                                const ny = 1 - ((Number(s.y) - minY) / rangeY);
                                return {
                                    ...s,
                                    x: Math.max(0, Math.min(1, nx)),
                                    y: Math.max(0, Math.min(1, ny))
                                };
                            });
                        });
                    }

                    if (Object.keys(mergedTelemetry).length > 0) {
                        console.info(
                            `[useReplay] Loaded telemetry for ${Object.keys(mergedTelemetry).length}/${driverCodes.length} drivers`
                        );
                        finalTelemetry = mergedTelemetry;
                        finalMetadata = Object.keys(mergedTelemetry).map(id => ({
                            ...(DRIVER_INFO[id] || { name: id, team: 'Unknown', color: '#666', number: 0 }),
                            id
                        }));

                        const firstDriver = Object.keys(mergedTelemetry)[0];
                        const pathSource = firstDriver ? mergedTelemetry[firstDriver] : [];
                        const rawPath = pathSource
                            .filter((s) => Number.isFinite(s.x) && Number.isFinite(s.y))
                            .map((s) => ({ x: Number(s.x), y: Number(s.y) }));
                        if (rawPath.length > 0) {
                            const stride = Math.ceil(rawPath.length / 1500);
                            const sampled: Array<{ x: number; y: number }> = [];
                            for (let i = 0; i < rawPath.length; i += stride) {
                                sampled.push(rawPath[i]);
                            }
                            if (sampled[sampled.length - 1] !== rawPath[rawPath.length - 1]) {
                                sampled.push(rawPath[rawPath.length - 1]);
                            }
                            setTrackPath(sampled);
                        } else {
                            setTrackPath([]);
                        }
                    } else {
                        throw new Error('No telemetry could be loaded from replay endpoints');
                    }
                } else {
                    const { metadata, telemetry } = transformTimelineData(timeline);
                    finalTelemetry = telemetry;
                    finalMetadata = metadata.map(m => ({
                        ...m,
                        ...(DRIVER_INFO[m.id] || {})
                    }));
                    setTrackPath([]);
                }

                if (workerRef.current) {
                    try {
                        workerRef.current.postMessage({
                            type: 'LOAD',
                            payload: {
                                metadata: finalMetadata,
                                telemetry: finalTelemetry,
                                totalLapsHint: Number(timeline?.meta?.lap_count || 0)
                            }
                        });
                        // Mark as loaded only after worker accepts payload.
                        dataLoadedRef.current = raceId;
                    } catch (postErr) {
                        console.error('[useReplay] Failed to post LOAD payload to worker:', postErr);
                        setLoading(false);
                        clearLoadWatchdog();
                    }
                } else {
                    console.error('[useReplay] Worker lost during fetch');
                    setLoading(false);
                    clearLoadWatchdog();
                }
            } catch (err) {
                console.error("[useReplay] Failed to fetch replay timeline:", err);
                setLoading(false);
                clearLoadWatchdog();
            }
        }

        fetchAndLoad();
    }, [raceId]);

    // Control Handlers
    const setPlaying = (p: boolean) => {
        setPlayingState(p);
        workerRef.current?.postMessage({ type: p ? 'PLAY' : 'PAUSE' });
    };

    const setSpeed = (s: number) => {
        setSpeedState(s);
        workerRef.current?.postMessage({ type: 'SET_SPEED', payload: { speed: s } });
    };

    const setCurrentTime = (t: number) => {
        workerRef.current?.postMessage({ type: 'SEEK', payload: { t: t * 1000 } });
    };

    return {
        state,
        playing,
        setPlaying,
        speed,
        setSpeed,
        setCurrentTime,
        loading,
        currentTime: state?.currentTime ? state.currentTime / 1000 : 0,
        maxTime,
        trackPath
    };
}
