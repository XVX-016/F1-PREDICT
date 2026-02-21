import { SimulationResult, SimulationRun, DriverSimulation, LapState, TyreCompound } from './types';

type TrackState = 'GREEN' | 'VSC' | 'SC';

export interface RigorousLapState {
    lap: number;
    track_state: TrackState;
    sc_probability: number;
    field_compression_factor: number;
}

export interface RigorousDriverProfile {
    driver_id: string;
    finishing_position_distribution: Record<string, number> | Record<number, number>;
    lap_time_profile?: number[];
    gap_profile?: number[];
    position_profile?: number[];
    stint_models?: Array<{
        compound: 'soft' | 'medium' | 'hard';
    }>;
}

export interface RigorousSimulationRunOutput {
    metadata: {
        race_id: string;
        total_laps: number;
        num_iterations: number;
        seed?: number;
        [k: string]: unknown;
    };
    lap_states: RigorousLapState[];
    drivers: RigorousDriverProfile[];
}

const normalizeCompound = (compound?: string): TyreCompound => {
    switch ((compound || '').toUpperCase()) {
        case 'SOFT':
            return 'SOFT';
        case 'HARD':
            return 'HARD';
        default:
            return 'MEDIUM';
    }
};

const expectedFinishPosition = (distribution: Record<string, number> | Record<number, number>): number => {
    let bestPos = 1;
    let bestProb = -1;
    Object.entries(distribution || {}).forEach(([k, v]) => {
        const pos = Number(k);
        const prob = Number(v);
        if (Number.isFinite(pos) && prob > bestProb) {
            bestProb = prob;
            bestPos = pos;
        }
    });
    return bestPos;
};

const mapDriver = (
    driver: RigorousDriverProfile,
    totalLaps: number,
    lapStates: RigorousLapState[]
): DriverSimulation => {
    const lapTimes = driver.lap_time_profile || [];
    const gaps = driver.gap_profile || [];
    const positions = driver.position_profile || [];
    const tyre = normalizeCompound(driver.stint_models?.[0]?.compound);

    const laps: LapState[] = Array.from({ length: totalLaps }, (_, i) => {
        const lap = i + 1;
        const raceState = (lapStates[i]?.track_state || 'GREEN') as TrackState;
        return {
            lap,
            lapTime: lapTimes[i] ?? 90000,
            gapToLeader: gaps[i] ?? 0,
            position: Math.max(1, Math.round(positions[i] ?? expectedFinishPosition(driver.finishing_position_distribution))),
            tyre,
            tyreLife: lap,
            inPit: false,
            dnf: false,
            raceState,
        };
    });

    return {
        driverId: driver.driver_id,
        laps,
        totalTime: laps.reduce((acc, l) => acc + l.lapTime, 0),
        finishPosition: expectedFinishPosition(driver.finishing_position_distribution),
    };
};

export const adaptRigorousToSimulationRun = (
    run: RigorousSimulationRunOutput,
    runId: number
): SimulationRun => {
    const totalLaps = Number(run.metadata?.total_laps || 0);
    const lapStates = run.lap_states || [];
    const safetyCarLaps = lapStates
        .filter((ls) => ls.track_state === 'SC' || ls.track_state === 'VSC')
        .map((ls) => ls.lap);

    const drivers: Record<string, DriverSimulation> = {};
    (run.drivers || []).forEach((d) => {
        drivers[d.driver_id] = mapDriver(d, totalLaps, lapStates);
    });

    return {
        runId,
        drivers,
        safetyCarLaps,
    };
};

export const adaptRigorousPairToSimulationResult = (
    baseline: RigorousSimulationRunOutput,
    counterfactual: RigorousSimulationRunOutput | null,
    description: string
): SimulationResult => {
    const seed = Number(baseline.metadata?.seed || Date.now());
    const totalLaps = Number(baseline.metadata?.total_laps || 58);

    return {
        meta: {
            circuit: baseline.metadata?.race_id || 'unknown',
            totalLaps,
            seed,
            generatedAt: Date.now(),
            baselineConfigHash: `rigorous:${baseline.metadata?.race_id}:${seed}:base`,
            counterfactualConfigHash: counterfactual
                ? `rigorous:${baseline.metadata?.race_id}:${seed}:cf`
                : undefined,
            counterfactualDescription: counterfactual ? description : undefined,
        },
        baseline: adaptRigorousToSimulationRun(baseline, 0),
        counterfactual: counterfactual ? adaptRigorousToSimulationRun(counterfactual, 1) : undefined,
    };
};
