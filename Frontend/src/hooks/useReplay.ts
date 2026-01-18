import { useEffect, useState } from "react";

export function useReplay(raceId: string, maxLap: number) {
    const [lap, setLap] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1); // 1 = 1 lap/sec

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
        setSpeed
    };
}
