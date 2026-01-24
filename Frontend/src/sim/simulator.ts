/**
 * Deterministic Race Simulator
 * 
 * Pure TypeScript, no React, no side effects.
 * Safe to run in WebWorker, unit tests, or main thread.
 * 
 * Given the same SimulationConfig with same seed, produces identical results.
 */

import {
    SimulationConfig,
    SimulationResult,
    SimulationRun,
    DriverSimulation,
    LapState,
    DriverRunState,
    TyreCompound,
    DriverId,
    StrategyPlan
} from './types';
import { createRng } from './random';

// Physics constants
const TYRE_DEG_PER_LAP = 0.015;        // Base degradation per lap
const TYRE_DEG_PACE_PENALTY = 2500;    // ms penalty at 100% degradation
const FUEL_START_KG = 110;
const FUEL_BURN_PER_LAP = 1.4;         // kg per lap
const FUEL_PACE_PENALTY_PER_KG = 20;   // ms per kg
const SC_PACE_ADDITION = 6000;         // ms added during safety car
const SC_DURATION_LAPS = 3;            // How long SC lasts
const PIT_TIME_BASE = 22000;           // Base pit stop time in ms

/**
 * Compound factors for degradation
 */
const COMPOUND_FACTORS: Record<TyreCompound, number> = {
    SOFT: 1.4,
    MEDIUM: 1.0,
    HARD: 0.7
};

/**
 * Generate a hash of the config for cache purposes
 */
function hashConfig(config: SimulationConfig): string {
    const key = JSON.stringify({
        circuit: config.circuit,
        totalLaps: config.totalLaps,
        drivers: config.drivers,
        strategies: config.strategies,
        baseLapTime: config.baseLapTime,
        pitLossSeconds: config.pitLossSeconds,
        hazardConfig: config.hazardConfig,
        tyreDegMultiplier: config.tyreDegMultiplier,
        fuelBurnMultiplier: config.fuelBurnMultiplier,
        seed: config.seed
    });

    // Simple hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

/**
 * Initialize driver state at race start
 */
function initializeDriver(
    driverId: DriverId,
    strategies: StrategyPlan[]
): DriverRunState {
    const strategy = strategies.find(s => s.driverId === driverId);
    const startTyre = strategy?.tyreSequence[0] ?? 'MEDIUM';

    return {
        driverId,
        totalTime: 0,
        fuel: FUEL_START_KG,
        tyre: startTyre,
        tyreLife: 0,
        tyreDegradation: 0,
        pitCount: 0,
        dnf: false
    };
}

/**
 * Calculate lap time based on current state
 */
function calculateLapTime(
    state: DriverRunState,
    baseLapTime: number,
    config: SimulationConfig,
    isSafetyCar: boolean,
    isPitting: boolean,
    rng: ReturnType<typeof createRng>
): number {
    let lapTime = baseLapTime;

    // Tyre degradation penalty
    const compoundFactor = COMPOUND_FACTORS[state.tyre];
    const degPenalty = state.tyreDegradation * TYRE_DEG_PACE_PENALTY * compoundFactor;
    lapTime += degPenalty;

    // Fuel penalty (less fuel = faster)
    const fuelPenalty = (FUEL_START_KG - state.fuel) * FUEL_PACE_PENALTY_PER_KG;
    lapTime -= fuelPenalty; // Subtract because lighter = faster

    // Safety car
    if (isSafetyCar) {
        lapTime += SC_PACE_ADDITION;
    }

    // Pit stop
    if (isPitting) {
        lapTime += PIT_TIME_BASE + (config.pitLossSeconds * 1000);
    }

    // Random variance (+/- 250ms)
    lapTime += rng.range(-250, 250);

    return Math.max(lapTime, baseLapTime * 0.9); // Floor at 90% of base
}

/**
 * Run a single simulation
 */
function runSingleSimulation(
    config: SimulationConfig,
    runId: number,
    rng: ReturnType<typeof createRng>
): SimulationRun {
    const driverStates: Record<DriverId, DriverRunState> = {};
    const driverLaps: Record<DriverId, LapState[]> = {};
    const safetyCarLaps: number[] = [];

    // Initialize all drivers
    for (const driverId of config.drivers) {
        driverStates[driverId] = initializeDriver(driverId, config.strategies);
        driverLaps[driverId] = [];
    }

    let isSafetyCarActive = false;
    let safetyCarLapsRemaining = 0;

    // Simulate each lap
    for (let lap = 1; lap <= config.totalLaps; lap++) {
        // Check for new safety car
        if (!isSafetyCarActive && rng.chance(config.hazardConfig.safetyCarProb)) {
            isSafetyCarActive = true;
            safetyCarLapsRemaining = SC_DURATION_LAPS;
            safetyCarLaps.push(lap);
        }

        // Process safety car countdown
        if (isSafetyCarActive) {
            safetyCarLapsRemaining--;
            if (safetyCarLapsRemaining <= 0) {
                isSafetyCarActive = false;
            }
        }

        const lapTimes: { driverId: DriverId; time: number }[] = [];

        // Process each driver
        for (const driverId of config.drivers) {
            const state = driverStates[driverId];

            // Skip DNF'd drivers
            if (state.dnf) {
                continue;
            }

            // Check for DNF this lap
            if (rng.chance(config.hazardConfig.dnfProb)) {
                state.dnf = true;
                state.dnfLap = lap;
                continue;
            }

            // Check for pit stop
            const strategy = config.strategies.find(s => s.driverId === driverId);
            const pitIndex = strategy?.pitLaps.indexOf(lap) ?? -1;
            const isPitting = pitIndex >= 0;

            // Calculate lap time
            const baseLapTime = config.baseLapTime[driverId] ?? 90000;
            const lapTime = calculateLapTime(
                state,
                baseLapTime,
                config,
                isSafetyCarActive,
                isPitting,
                rng
            );

            // Update state
            state.totalTime += lapTime;
            state.tyreLife++;
            state.tyreDegradation += TYRE_DEG_PER_LAP * config.tyreDegMultiplier;
            state.fuel -= FUEL_BURN_PER_LAP * config.fuelBurnMultiplier;
            state.fuel = Math.max(0, state.fuel);

            // Handle pit stop - reset tyres
            if (isPitting && strategy) {
                state.pitCount++;
                state.tyre = strategy.tyreSequence[state.pitCount] ?? state.tyre;
                state.tyreLife = 0;
                state.tyreDegradation = 0;
            }

            lapTimes.push({ driverId, time: state.totalTime });
        }

        // Sort by total time to get positions
        lapTimes.sort((a, b) => a.time - b.time);
        const leaderTime = lapTimes[0]?.time ?? 0;

        // Record lap state for each driver
        for (let i = 0; i < lapTimes.length; i++) {
            const { driverId, time } = lapTimes[i];
            const state = driverStates[driverId];
            const strategy = config.strategies.find(s => s.driverId === driverId);
            const isPitting = strategy?.pitLaps.includes(lap) ?? false;

            driverLaps[driverId].push({
                lap,
                lapTime: lap === 1
                    ? time
                    : time - (driverLaps[driverId][lap - 2]?.gapToLeader ?? 0) - leaderTime + (lapTimes[i]?.time ?? time) - time,
                gapToLeader: time - leaderTime,
                position: i + 1,
                tyre: state.tyre,
                tyreLife: state.tyreLife,
                inPit: isPitting,
                dnf: false,
                raceState: isSafetyCarActive ? 'SC' : 'GREEN'
            });
        }
    }

    // Build final driver simulations
    const drivers: Record<DriverId, DriverSimulation> = {};

    // Get final positions
    const finishOrder = config.drivers
        .filter(id => !driverStates[id].dnf)
        .map(id => ({ driverId: id, totalTime: driverStates[id].totalTime }))
        .sort((a, b) => a.totalTime - b.totalTime);

    for (const driverId of config.drivers) {
        const state = driverStates[driverId];
        const finishPos = finishOrder.findIndex(d => d.driverId === driverId) + 1;

        drivers[driverId] = {
            driverId,
            laps: driverLaps[driverId],
            totalTime: state.totalTime,
            finishPosition: state.dnf ? config.drivers.length : finishPos,
            dnfLap: state.dnfLap
        };
    }

    return {
        runId,
        drivers,
        safetyCarLaps
    };
}

/**
 * Main entry point - runs baseline simulation only
 * 
 * Returns a FROZEN SimulationResult that should never be mutated.
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
    const rng = createRng(config.seed);
    const baseline = runSingleSimulation(config, 0, rng);

    const result: SimulationResult = {
        meta: {
            circuit: config.circuit,
            totalLaps: config.totalLaps,
            seed: config.seed,
            generatedAt: Date.now(),
            baselineConfigHash: hashConfig(config)
        },
        baseline
    };

    // FREEZE - this result must never be mutated
    return Object.freeze(result);
}

/**
 * Run simulation with a counterfactual comparison
 * 
 * CRITICAL: Both runs use the SAME SEED for deterministic comparison.
 * Only ONE parameter should differ between baseline and counterfactual.
 * 
 * @param baseConfig - The baseline configuration
 * @param counterfactualPatch - Partial config that differs from baseline
 * @param description - Human-readable description of what changed
 */
export function runWithCounterfactual(
    baseConfig: SimulationConfig,
    counterfactualPatch: Partial<SimulationConfig>,
    description: string
): SimulationResult {
    // Run baseline
    const baseRng = createRng(baseConfig.seed);
    const baseline = runSingleSimulation(baseConfig, 0, baseRng);

    // Build counterfactual config - SAME SEED
    const cfConfig: SimulationConfig = {
        ...baseConfig,
        ...counterfactualPatch,
        seed: baseConfig.seed // 🚨 SAME SEED - this is critical
    };

    // Run counterfactual
    const cfRng = createRng(cfConfig.seed);
    const counterfactual = runSingleSimulation(cfConfig, 0, cfRng);

    const result: SimulationResult = {
        meta: {
            circuit: baseConfig.circuit,
            totalLaps: baseConfig.totalLaps,
            seed: baseConfig.seed,
            generatedAt: Date.now(),
            baselineConfigHash: hashConfig(baseConfig),
            counterfactualConfigHash: hashConfig(cfConfig),
            counterfactualDescription: description
        },
        baseline,
        counterfactual
    };

    return Object.freeze(result);
}

/**
 * Create a default simulation config for testing
 */
export function createDefaultConfig(): SimulationConfig {
    const drivers = ['VER', 'NOR', 'LEC', 'HAM', 'SAI', 'PIA', 'RUS', 'PER'];

    return {
        circuit: 'albert_park',
        totalLaps: 58,
        drivers,
        strategies: drivers.map((driverId, idx) => ({
            driverId,
            pitLaps: idx % 2 === 0 ? [18, 40] : [22, 45], // Alternate strategies
            tyreSequence: ['SOFT', 'MEDIUM', 'SOFT'] as TyreCompound[]
        })),
        baseLapTime: Object.fromEntries(
            drivers.map((id, idx) => [id, 81000 + idx * 150]) // Spread drivers
        ),
        pitLossSeconds: 2.5,
        hazardConfig: {
            safetyCarProb: 0.02,
            dnfProb: 0.002
        },
        tyreDegMultiplier: 1.0,
        fuelBurnMultiplier: 1.0,
        seed: Date.now(),
        runs: 1
    };
}
