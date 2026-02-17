import { useEffect, useState, useRef } from "react";
import { transformTimelineData, DRIVER_INFO } from "../utils/ReplayDataHelper";
import { RaceTimeline } from '../types/domain';
import { ReplayState, TelemetrySample } from "../utils/ReplayEngine";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useReplay(raceId: string) {
    const [state, setState] = useState<ReplayState | null>(null);
    const [loading, setLoading] = useState(false);
    const [maxTime, setMaxTime] = useState(6000);
    const [playing, setPlayingState] = useState(false);
    const [speed, setSpeedState] = useState(1);

    const workerRef = useRef<Worker | null>(null);
    const dataLoadedRef = useRef<string | null>(null); // Track which raceId has been loaded
    const workerReadyRef = useRef(false);

    // Initialize Worker (ONCE per hook instance)
    useEffect(() => {
        console.log('[useReplay] Initializing worker...');
        const worker = new Worker(new URL('../utils/ReplayEngine.worker.ts', import.meta.url), {
            type: 'module'
        });
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'STATE_UPDATE') {
                setState(payload);
            } else if (type === 'LOADED') {
                console.log('[useReplay] Data loaded, duration:', payload.duration);
                setMaxTime(payload.duration / 1000);
                setLoading(false);
            } else if (type === 'ERROR') {
                console.error('[useReplay] Worker error:', payload.message);
                setLoading(false);
            }
        };

        workerReadyRef.current = true;

        return () => {
            console.log('[useReplay] Terminating worker...');
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
            try {
                const res = await fetch(`${API_BASE}/api/races/${raceId}/timeline`);
                if (!res.ok) throw new Error('Failed to fetch timeline');
                const timeline: RaceTimeline = await res.json();

                if (!timeline || (!timeline.telemetry && !timeline.laps && !timeline.telemetry_urls)) {
                    throw new Error('Malformed timeline data received');
                }

                let finalTelemetry = {};
                let finalMetadata = [];

                if (timeline.telemetry_urls) {
                    console.log('[useReplay] Fetching distributed telemetry...');
                    const driverCodes = Object.keys(timeline.telemetry_urls);
                    const telemetryPromises = driverCodes.map(async (code) => {
                        const url = timeline.telemetry_urls![code];
                        const resolvedUrl = /^https?:\/\//i.test(url)
                            ? url
                            : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
                        const fallbackLocalUrl = `${API_BASE}/api/races/${raceId}/telemetry/${code}`;
                        try {
                            let tRes = await fetch(resolvedUrl);
                            if (!tRes.ok && fallbackLocalUrl !== resolvedUrl) {
                                tRes = await fetch(fallbackLocalUrl);
                            }
                            if (!tRes.ok) return null;
                            const data = await tRes.json();
                            return { code, frames: data };
                        } catch (e) {
                            console.error(`Failed primary telemetry URL for ${code}, trying local fallback...`, e);
                            try {
                                const localRes = await fetch(fallbackLocalUrl);
                                if (!localRes.ok) return null;
                                const localData = await localRes.json();
                                return { code, frames: localData };
                            } catch (localErr) {
                                console.error(`Failed local telemetry fallback for ${code}:`, localErr);
                                return null;
                            }
                        }
                    });

                    const results = await Promise.all(telemetryPromises);
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
                                    frames = Object.entries(res.frames)
                                        .filter(([, value]) => Array.isArray(value))
                                        .sort(([a], [b]) => Number(a) - Number(b))
                                        .flatMap(([lapKey, value]) =>
                                            (value as any[]).map((f: any) => ({
                                                ...f,
                                                lap: f.lap ?? Number(lapKey)
                                            }))
                                        );
                                }
                            }
                            const telemetryScale = (() => {
                                if (!frames.length) return 1;
                                const firstT = Number(frames[0]?.t || 0);
                                const secondT = Number(frames[Math.min(1, frames.length - 1)]?.t || firstT);
                                const dt = Math.abs(secondT - firstT);
                                return dt > 0 && dt < 2 ? 1000 : 1;
                            })();

                            mergedTelemetry[res.code] = frames.map((f: any) => ({
                                t: (f.t || 0) * telemetryScale,
                                lap: f.lap || 1,
                                progress: f.rel_dist || f.progress || 0,
                                speed: f.speed || 0,
                                throttle: f.throttle || 0,
                                brake: f.brake || 0,
                                gear: f.gear || 1,
                                drs: !!f.drs,
                                isPitting: f.is_pitting || f.isPitting || false
                            }));
                        }
                    });

                    if (Object.keys(mergedTelemetry).length > 0) {
                        finalTelemetry = mergedTelemetry;
                        finalMetadata = Object.keys(mergedTelemetry).map(id => ({
                            ...(DRIVER_INFO[id] || { name: id, team: 'Unknown', color: '#666', number: 0 }),
                            id
                        }));
                    } else {
                        const { metadata, telemetry } = transformTimelineData(timeline);
                        finalTelemetry = telemetry;
                        finalMetadata = metadata.map(m => ({
                            ...m,
                            ...(DRIVER_INFO[m.id] || {})
                        }));
                    }
                } else {
                    const { metadata, telemetry } = transformTimelineData(timeline);
                    finalTelemetry = telemetry;
                    finalMetadata = metadata.map(m => ({
                        ...m,
                        ...(DRIVER_INFO[m.id] || {})
                    }));
                }

                // Mark as loaded BEFORE posting to prevent race conditions
                dataLoadedRef.current = raceId;

                if (workerRef.current) {
                    workerRef.current.postMessage({
                        type: 'LOAD',
                        payload: { metadata: finalMetadata, telemetry: finalTelemetry }
                    });
                } else {
                    console.error('[useReplay] Worker lost during fetch');
                    setLoading(false);
                }
            } catch (err) {
                console.error("[useReplay] Failed to fetch replay timeline:", err);
                setLoading(false);
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
        maxTime
    };
}
