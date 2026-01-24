/**
 * Race Position Series Selector
 * 
 * Cursor-driven selector for race position chart.
 * Updated for Phase 2A baseline + counterfactual structure.
 */

import { useMemo } from 'react';
import { useRaceStore } from '../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

export interface PositionPoint {
    lap: number;
    position: number;
}

export interface DriverPositionSeries {
    driverId: string;
    name: string;
    color: string;
    points: PositionPoint[];
}

// Team colors mapping
const TEAM_COLORS: Record<string, string> = {
    VER: '#3671C6', // Red Bull
    PER: '#3671C6',
    HAM: '#27F4D2', // Mercedes
    RUS: '#27F4D2',
    LEC: '#E80020', // Ferrari
    SAI: '#E80020',
    NOR: '#FF8000', // McLaren
    PIA: '#FF8000',
    ALO: '#229971', // Aston Martin
    STR: '#229971',
    OCO: '#0093CC', // Alpine
    GAS: '#0093CC',
    TSU: '#6692FF', // RB
    RIC: '#6692FF',
    BOT: '#52E252', // Sauber
    ZHO: '#52E252',
    MAG: '#B6BABD', // Haas
    HUL: '#B6BABD',
    ALB: '#64C4FF', // Williams
    SAR: '#64C4FF',
};

/**
 * Returns position series for all drivers up to cursor (uses baseline run)
 */
export function useRacePositionSeries(): DriverPositionSeries[] | null {
    const result = useRaceStore(useShallow(s => s.simulationResult));
    const cursorLap = useRaceStore(useShallow(s => s.currentLap));
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));

    return useMemo(() => {
        if (!result) return null;

        // Use baseline run for position chart
        const run = result.baseline;

        return Object.entries(run.drivers).map(([driverId, driver]) => ({
            driverId,
            name: driverId,
            color: TEAM_COLORS[driverId] || '#666666',
            points: driver.laps
                .slice(0, cursorLap)
                .map(l => ({
                    lap: l.lap,
                    position: l.position
                }))
        }));
    }, [result, cursorLap, selectedDriverId]);
}

/**
 * Returns full position series for domain calculation
 */
export function useFullRacePositionSeries(): DriverPositionSeries[] | null {
    const result = useRaceStore(useShallow(s => s.simulationResult));

    return useMemo(() => {
        if (!result) return null;

        const run = result.baseline;

        return Object.entries(run.drivers).map(([driverId, driver]) => ({
            driverId,
            name: driverId,
            color: TEAM_COLORS[driverId] || '#666666',
            points: driver.laps.map(l => ({
                lap: l.lap,
                position: l.position
            }))
        }));
    }, [result]);
}
