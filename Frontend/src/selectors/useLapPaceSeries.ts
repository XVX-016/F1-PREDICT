/**
 * Lap Pace Series Selector
 * 
 * Cursor-driven selector that provides lap pace data to charts.
 * Phase 2A: Returns both baseline and counterfactual data with delta.
 */

import { useMemo } from 'react';
import { useRaceStore } from '../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

export interface LapPacePoint {
    lap: number;
    baseline: number;        // milliseconds
    counterfactual?: number; // milliseconds
    delta?: number;          // counterfactual - baseline (positive = slower)
}

/**
 * Returns lap pace data for the selected driver, sliced to cursor position.
 * 
 * Phase 2A: Includes counterfactual data if available.
 * Delta = counterfactual - baseline (positive means CF is slower)
 */
export function useLapPaceSeries(): LapPacePoint[] | null {
    const result = useRaceStore(useShallow(s => s.simulationResult));
    const cursorLap = useRaceStore(useShallow(s => s.currentLap));
    const driverId = useRaceStore(useShallow(s => s.selectedDriverId));

    return useMemo(() => {
        if (!result || !driverId) return null;

        // Get baseline driver data
        const baseDriver = result.baseline.drivers[driverId];
        if (!baseDriver) return null;

        // Get counterfactual driver data (if exists)
        const cfDriver = result.counterfactual?.drivers[driverId];

        // Return laps up to cursor with delta calculation
        return baseDriver.laps
            .slice(0, cursorLap)
            .map((lap, i) => {
                const cfLap = cfDriver?.laps[i];
                const baseline = lap.lapTime;
                const counterfactual = cfLap?.lapTime;

                return {
                    lap: lap.lap,
                    baseline,
                    counterfactual,
                    delta: counterfactual !== undefined
                        ? counterfactual - baseline
                        : undefined
                };
            });
    }, [result, cursorLap, driverId]);
}

/**
 * Returns the full lap series (all laps) for domain calculation
 */
export function useFullLapPaceSeries(): LapPacePoint[] | null {
    const result = useRaceStore(useShallow(s => s.simulationResult));
    const driverId = useRaceStore(useShallow(s => s.selectedDriverId));

    return useMemo(() => {
        if (!result || !driverId) return null;

        const baseDriver = result.baseline.drivers[driverId];
        if (!baseDriver) return null;

        const cfDriver = result.counterfactual?.drivers[driverId];

        return baseDriver.laps.map((lap, i) => {
            const cfLap = cfDriver?.laps[i];
            const baseline = lap.lapTime;
            const counterfactual = cfLap?.lapTime;

            return {
                lap: lap.lap,
                baseline,
                counterfactual,
                delta: counterfactual !== undefined
                    ? counterfactual - baseline
                    : undefined
            };
        });
    }, [result, driverId]);
}
