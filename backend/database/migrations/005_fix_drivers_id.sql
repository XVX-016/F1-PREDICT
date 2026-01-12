-- Migration 005: Recreate drivers table types

-- Since we are refactoring, we will drop the dependent tables first (or cascade) and recreate drivers with TEXT id
-- Note: This is destructive to existing data, which is acceptable for this refactor phase as we are reseeding.

DROP TABLE IF EXISTS outcome_probabilities CASCADE;
DROP TABLE IF EXISTS pace_deltas CASCADE;
DROP TABLE IF EXISTS telemetry_features CASCADE;
DROP TABLE IF EXISTS qualifying_results CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;

CREATE TABLE drivers (
    id TEXT PRIMARY KEY, -- changed from UUID to TEXT for slug support
    name TEXT NOT NULL,
    number INT,
    country_code TEXT,
    constructor_id TEXT REFERENCES constructors(id),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recreate dependent tables that referenced drivers(id)
-- Outcome Probabilities
CREATE TABLE outcome_probabilities (
    race_id UUID REFERENCES races(id),
    driver_id TEXT REFERENCES drivers(id),
    win_prob FLOAT,
    podium_prob FLOAT,
    top10_prob FLOAT,
    simulation_run_id UUID REFERENCES simulation_runs(id),
    PRIMARY KEY (race_id, driver_id)
);

-- Pace Deltas
CREATE TABLE pace_deltas (
    race_id UUID REFERENCES races(id),
    driver_id TEXT REFERENCES drivers(id),
    pace_delta_ms FLOAT,
    model_run_id UUID REFERENCES model_runs(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (race_id, driver_id)
);

-- Telemetry Features
CREATE TABLE telemetry_features (
    race_id UUID REFERENCES races(id),
    driver_id TEXT REFERENCES drivers(id),
    avg_long_run_pace_ms FLOAT,
    tire_deg_rate FLOAT,
    sector_consistency FLOAT,
    clean_air_delta FLOAT,
    PRIMARY KEY (race_id, driver_id)
);

-- Qualifying Results
CREATE TABLE qualifying_results (
    race_id UUID REFERENCES races(id),
    driver_id TEXT REFERENCES drivers(id),
    grid_position INT,
    q_time_ms INT,
    PRIMARY KEY (race_id, driver_id)
);

-- Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read drivers" ON drivers FOR SELECT USING (true);
