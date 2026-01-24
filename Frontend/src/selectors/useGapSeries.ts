/**
 * Gap to Leader Series Selector
 * 
 * Cursor-driven selector for gap chart with stepAfter interpolation.
 * Updated for Phase 2A baseline + counterfactual structure.
 */

import { useMemo } from 'react';
import { useRaceStore } from '../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

export interface GapPoint {
    lap: number;
    gapBaseline: number;      // milliseconds
    gapCounterfactual?: number;
    delta?: number;
    raceState: 'GREEN' | 'SC' | 'VSC';
}

/**
 * Returns gap to leader data for selected driver up to cursor
 */
export function useGapSeries(): GapPoint[] | null {
    const result = useRaceStore(useShallow(s => s.simulationResult));
    const cursorLap = useRaceStore(useShallow(s => s.currentLap));
    const driverId = useRaceStore(useShallow(s => s.selectedDriverId));

    return useMemo(() => {
        if (!result || !driverId) return null;

        const baseDriver = result.baseline.drivers[driverId];
        if (!baseDriver) return null;

        const cfDriver = result.counterfactual?.drivers[driverId];

        return baseDriver.laps
            .slice(0, cursorLap)
            .map((l, i) => {
                const cfLap = cfDriver?.laps[i];

                return {
                    lap: l.lap,
                    gapBaseline: l.gapToLeader,
                    gapCounterfactual: cfLap?.gapToLeader,
                    delta: cfLap ? cfLap.gapToLeader - l.gapToLeader : undefined,
                    raceState: l.raceState
                };
            });
    }, [result, cursorLap, driverId]);
}

/**
 * Returns full gap series for domain calculation
 */
export function useFullGapSeries(): GapPoint[] | null {
    const result = useRaceStore(useShallow(s => s.simulationResult));
    const driverId = useRaceStore(useShallow(s => s.selectedDriverId));

    return useMemo(() => {
        if (!result || !driverId) return null;

        const baseDriver = result.baseline.drivers[driverId];
        if (!baseDriver) return null;

        const cfDriver = result.counterfactual?.drivers[driverId];

        return baseDriver.laps.map((l, i) => {
            const cfLap = cfDriver?.laps[i];

            return {
                lap: l.lap,
                gapBaseline: l.gapToLeader,
                gapCounterfactual: cfLap?.gapToLeader,
                delta: cfLap ? cfLap.gapToLeader - l.gapToLeader : undefined,
                raceState: l.raceState
            };
        });
    }, [result, driverId]);
}
