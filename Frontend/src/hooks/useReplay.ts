import { useEffect, useState, useMemo, useRef } from "react";
// import { RaceTimeline, LapFrame } from "../types/domain";
import { ReplayAdapter, ReplayState } from "../adapters/ReplayAdapter"; // Assuming this exists

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useReplay(raceId: string) {
    // State
    const [currentTime, setCurrentTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [timeline, setTimeline] = useState<any>(null); // Raw timeline
    const [loading, setLoading] = useState(false);

    // Derived State using Adapter
    const state = useMemo(() => {
        if (!timeline) return ReplayAdapter.resolveStateAtTime({ meta: {}, summary: {}, telemetry: [] } as any, 0);
        return ReplayAdapter.resolveStateAtTime(timeline, currentTime);
    }, [timeline, currentTime]);

    const maxTime = timeline?.summary?.total_time_ms ? timeline.summary.total_time_ms / 1000 : 6000; // Convert to seconds

    // Fetch Timeline
    useEffect(() => {
        if (!raceId) return;

        async function fetchTimeline() {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/races/${raceId}/timeline`);
                if (!res.ok) {
                    throw new Error('Failed to fetch timeline');
                }
                const data = await res.json();
                setTimeline(data);
            } catch (err) {
                console.error("Failed to fetch replay timeline:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchTimeline();
    }, [raceId]);

    // Playback Loop
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(t => {
                    const dt = 1 * speed; // 1 second * speed per real second
                    const next = t + dt;
                    if (next >= maxTime) {
                        setPlaying(false);
                        return maxTime;
                    }
                    return next;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [playing, speed, maxTime]);

    return {
        state, // ReplayState
        playing,
        setPlaying,
        speed,
        setSpeed,
        setCurrentTime,
        loading,
        currentTime,
        maxTime
    };
}
