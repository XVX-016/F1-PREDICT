export type DriverId = string;
export type TeamId = string;

export interface TyreState {
    compound: "SOFT" | "MEDIUM" | "HARD" | "INTER" | "WET";
    ageLaps: number;
    wearPct: number;
    degRateMsPerLap: number;
}

export interface FuelState {
    remainingKg: number;
    burnRateKgPerLap: number;
}

export interface PaceState {
    p05Ms: number;
    p50Ms: number;
    p95Ms: number;
}

export interface DriverState {
    driverId: DriverId;
    name: string;
    teamId: TeamId;
    lap: number;
    position: number;
    gapToLeader: number; // Seconds
    tyre: TyreState;
    fuel: FuelState;
    pace: PaceState;
    status: "ON_TRACK" | "PIT" | "DNF";
}

export interface RaceContext {
    season: number;
    round: number;
    raceName: string;
    circuitId: string;
    totalLaps: number;
}

export interface SimulationConfig {
    tyreDegMultiplier: number;
    fuelBurnMultiplier: number;
    scProbability: number;
    weatherVariance: number;
    enableSafetyCar: boolean;
    useMLResiduals: boolean;
}

export interface ReplayFrame {
    lap: number;
    timeOffset: number; // Seconds from race start
    drivers: Record<DriverId, DriverState>;
    weather: {
        trackTemp: number;
        airTemp: number;
        rainIntensity: number;
    };
    safetyCarStatus: "NONE" | "VSC" | "SC";
}

// Strategy Results (Calculated from Simulation)
export interface StrategyVariant {
    id: string;
    name: string;
    stops: number;
    compounds: string[]; // e.g. ["S", "M", "S"]
    pitLaps: number[];
    expectedRaceTime: number;
    riskScore: number; // 0-100
}
