import { useMemo } from 'react';
import { useRaceStore } from '../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';
import { ReplayFrame } from '../types/race';

export interface LapSeriesData {
    lap: number;
    driverId: string;
    position: number;
    lapTime: number;
    gapToLeader: number;
    tyre: string;
}

/**
 * Transforms raw frames into a flat list of lap-wise driver data.
 * This is the stable structure expected by D3 charts.
 */
export function buildLapSeries(frames: Record<number, ReplayFrame>): LapSeriesData[] {
    const series: LapSeriesData[] = [];

    // Sort laps to ensure deterministic order
    const sortedLaps = Object.keys(frames)
        .map(Number)
        .sort((a, b) => a - b);

    sortedLaps.forEach(lap => {
        const frame = frames[lap];
        if (!frame) return;

        Object.values(frame.drivers).forEach(d => {
            series.push({
                lap: frame.lap,
                driverId: d.driverId,
                position: d.position,
                lapTime: d.pace.p50Ms,
                gapToLeader: d.gapToLeader,
                tyre: d.tyre.compound
            });
        });
    });

    return series;
}

/**
 * Hook for components to consume chart-safe simulation data.
 * Automatically filters data by the current playback cursor.
 */
export function useLapSeries() {
    const replayFrames = useRaceStore(useShallow(s => s.replayFrames));
    const currentLap = useRaceStore(useShallow(s => s.currentLap));

    const series = useMemo(() => buildLapSeries(replayFrames), [replayFrames]);

    const visibleData = useMemo(() => {
        return series.filter(d => d.lap <= currentLap);
    }, [series, currentLap]);

    return {
        fullSeries: series,
        visibleData
    };
}
