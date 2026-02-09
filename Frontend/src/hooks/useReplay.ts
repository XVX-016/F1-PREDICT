import { useEffect, useState, useRef } from "react";
import { transformTimelineData, DRIVER_INFO } from "../utils/ReplayDataHelper";
import { RaceTimeline } from '../types/domain';
import { ReplayState } from "../utils/ReplayEngine";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

                if (!timeline || (!timeline.telemetry && !timeline.laps)) {
                    throw new Error('Malformed timeline data received');
                }

                const { metadata, telemetry } = transformTimelineData(timeline);

                // Enhance metadata with DRIVER_INFO
                const enhancedMetadata = metadata.map(m => ({
                    ...m,
                    ...(DRIVER_INFO[m.id] || {})
                }));

                // Mark as loaded BEFORE posting to prevent race conditions
                dataLoadedRef.current = raceId;

                if (workerRef.current) {
                    workerRef.current.postMessage({
                        type: 'LOAD',
                        payload: { metadata: enhancedMetadata, telemetry }
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
