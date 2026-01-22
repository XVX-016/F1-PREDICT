// Domain Models for F1-PREDICT
export type DataSource = "REPLAY" | "SIMULATION" | "LIVE";

export interface LapFrame {
    lap: number;
    driver_id: string;

    // RAW fields (FastF1 / Telemetry) - Nullable if not available
    lap_time_ms: number | null;
    compound: string | null;
    position: number | null;

    // DERIVED fields (Simulation only) - Nullable for REPLAY
    tyre_wear: number | null;
    fuel_remaining_kg: number | null;
    pit_this_lap: boolean | null;

    source: DataSource;
}

export interface RaceTimeline {
    meta: {
        source: DataSource;
        race_id: string;
        session_type?: string;
        season?: number;
        ingestion_timestamp?: string;
    };
    laps: LapFrame[];
    summary: {
        total_time_ms: number;
        [key: string]: any;
    };
}

export interface SimulationEvent {
    type: "SC" | "VSC" | "WEATHER" | "FAILURE";
    lap: number;
    intensity: number; // 0 to 1
    driver_id?: string;
}

export interface SimulationRequest {
    track_id: string;
    iterations: number;
    seed?: number;
    use_ml?: boolean;
    params?: Record<string, any>;
    events?: SimulationEvent[];
}

export interface SimulationResponse {
    win_probability: Record<string, number>;
    dnf_risk: Record<string, number>;
    podium_probability: Record<string, number[]>;
    pace_distributions: Record<string, {
        p05: number;
        p50: number;
        p95: number;
    }>;
    robustness_score: Record<string, number>;
    event_attribution?: Record<string, Record<string, number>>;
    metadata: {
        iterations: number;
        seed: number;
        use_ml: boolean;
        params?: Record<string, any>;
        events?: SimulationEvent[];
    };
}
