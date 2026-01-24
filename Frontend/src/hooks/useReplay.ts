<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useEffect, useState, useMemo } from "react";
import { RaceTimeline, LapFrame } from "../types/domain";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
>>>>>>> feature/redis-telemetry-replay

export function useReplay(raceId: string, maxLap: number) {
    const [lap, setLap] = useState(1);
    const [playing, setPlaying] = useState(false);
<<<<<<< HEAD
    const [speed, setSpeed] = useState(1); // 1 = 1 lap/sec
=======
    const [speed, setSpeed] = useState(1);
    const [timeline, setTimeline] = useState<RaceTimeline | null>(null);
    const [loading, setLoading] = useState(false);

    // Initial fetch of the full timeline
    useEffect(() => {
        if (!raceId) return;

        async function fetchTimeline() {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/races/${raceId}/timeline`);
                if (!res.ok) throw new Error('Failed to fetch timeline');
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

    // Current frames extraction
    const currentFrames = useMemo(() => {
        if (!timeline) return [];
        return timeline.laps.filter((f: LapFrame) => f.lap === lap);
    }, [timeline, lap]);
>>>>>>> feature/redis-telemetry-replay

    // Playback Loop
    useEffect(() => {
        if (!playing) return;

        const intervalMs = 1000 / speed;

        const id = setInterval(() => {
            setLap((l) => {
                if (l >= maxLap) {
                    setPlaying(false);
                    return l;
                }
                return l + 1;
            });
        }, intervalMs);

        return () => clearInterval(id);
    }, [playing, maxLap, speed]);

    return {
        lap,
        setLap,
        playing,
        setPlaying,
        speed,
<<<<<<< HEAD
        setSpeed
=======
        setSpeed,
        timeline,
        currentFrames,
        loading
>>>>>>> feature/redis-telemetry-replay
    };
}
