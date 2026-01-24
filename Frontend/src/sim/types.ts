/**
 * Simulation Type Definitions
 * 
 * FROZEN SCHEMA - Do not modify without careful consideration.
 * This is the contract between simulator, store, selectors, and charts.
 */

export type DriverId = string;
export type TyreCompound = "SOFT" | "MEDIUM" | "HARD";

/**
 * Strategy plan for a single driver
 */
export interface StrategyPlan {
    driverId: DriverId;
    pitLaps: number[];
    tyreSequence: TyreCompound[];
}

/**
 * Configuration for running a simulation
 */
export interface SimulationConfig {
    circuit: string;
    totalLaps: number;
    drivers: DriverId[];
    strategies: StrategyPlan[];
    baseLapTime: Record<DriverId, number>; // milliseconds
    pitLossSeconds: number;
    hazardConfig: {
        safetyCarProb: number; // per lap
        dnfProb: number;       // per lap per driver
    };
    tyreDegMultiplier: number;
    fuelBurnMultiplier: number;
    seed: number;
    runs: number;
}

/**
 * Race state for Safety Car tracking
 */
export type RaceState = "GREEN" | "SC" | "VSC";

/**
 * State of a driver on a specific lap
 */
export interface LapState {
    lap: number;
    lapTime: number;     // milliseconds
    gapToLeader: number; // milliseconds
    position: number;
    tyre: TyreCompound;
    tyreLife: number;    // laps on current tyre
    inPit: boolean;
    dnf: boolean;
    raceState: RaceState; // Phase 2B: for SC logic
}

/**
 * Complete simulation result for one driver
 */
export interface DriverSimulation {
    driverId: DriverId;
    laps: LapState[];
    totalTime: number;   // milliseconds
    finishPosition: number;
    dnfLap?: number;
}

/**
 * One complete simulation run
 */
export interface SimulationRun {
    runId: number;
    drivers: Record<DriverId, DriverSimulation>;
    safetyCarLaps: number[];
}

/**
 * Complete simulation result - IMMUTABLE after creation
 * 
 * Phase 2A: Supports baseline + optional counterfactual
 * Both use the SAME seed for deterministic comparison
 */
export interface SimulationResult {
    meta: {
        circuit: string;
        totalLaps: number;
        seed: number;
        generatedAt: number;
        baselineConfigHash: string;
        counterfactualConfigHash?: string;
        counterfactualDescription?: string; // e.g., "SC Prob +50%"
    };
    baseline: SimulationRun;
    counterfactual?: SimulationRun;
}

/**
 * Internal driver state used during simulation
 */
export interface DriverRunState {
    driverId: DriverId;
    totalTime: number;
    fuel: number;
    tyre: TyreCompound;
    tyreLife: number;
    tyreDegradation: number;
    pitCount: number;
    dnf: boolean;
    dnfLap?: number;
}
