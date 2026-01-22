import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { RaceTimeline, LapFrame } from "../types/domain";

const API_BASE = "http://localhost:8000/api";

export function useReplay(raceId: string, maxLap: number) {
    const [lap, setLap] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [timeline, setTimeline] = useState<RaceTimeline | null>(null);
    const [loading, setLoading] = useState(false);

    // Initial fetch of the full timeline
    useEffect(() => {
        if (!raceId) return;

        async function fetchTimeline() {
            setLoading(true);
            try {
                const res = await axios.get<RaceTimeline>(`${API_BASE}/races/${raceId}/timeline`);
                setTimeline(res.data);
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
        setSpeed,
        timeline,
        currentFrames,
        loading
    };
}

