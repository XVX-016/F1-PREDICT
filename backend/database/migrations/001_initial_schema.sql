-- F1 Prediction Platform - Initial Supabase Schema
-- This schema implements the simulation-first, ML-assisted architecture

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  constructor TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Races
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season INT NOT NULL,
  round INT NOT NULL,
  name TEXT NOT NULL,
  circuit TEXT NOT NULL,
  race_date DATE NOT NULL,
  regulation_era TEXT,  -- e.g., '2022-2025_ground_effect_v1'
  UNIQUE(season, round)
);

-- Qualifying Results (from Jolpica)
CREATE TABLE qualifying_results (
  race_id UUID REFERENCES races(id),
  driver_id UUID REFERENCES drivers(id),
  grid_position INT,
  q_time_ms INT,
  PRIMARY KEY (race_id, driver_id)
);

-- Telemetry Features (from FastF1, aggregated)
CREATE TABLE telemetry_features (
  race_id UUID REFERENCES races(id),
  driver_id UUID REFERENCES drivers(id),
  avg_long_run_pace_ms FLOAT,
  tire_deg_rate FLOAT,
  sector_consistency FLOAT,
  clean_air_delta FLOAT,
  PRIMARY KEY (race_id, driver_id)
);

-- Model Runs (for auditing and versioning)
CREATE TABLE model_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  trained_on_season INT,
  training_window INT,
  features JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ML Pace Deltas (regression output)
CREATE TABLE pace_deltas (
  race_id UUID REFERENCES races(id),
  driver_id UUID REFERENCES drivers(id),
  pace_delta_ms FLOAT,
  model_run_id UUID REFERENCES model_runs(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (race_id, driver_id)
);

-- Simulation Runs (for traceability)
CREATE TABLE simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id),
  n_simulations INT,
  seed INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Outcome Probabilities (simulation output - renamed for clarity)
CREATE TABLE outcome_probabilities (
  race_id UUID REFERENCES races(id),
  driver_id UUID REFERENCES drivers(id),
  win_prob FLOAT,
  podium_prob FLOAT,
  top10_prob FLOAT,
  simulation_run_id UUID REFERENCES simulation_runs(id),
  PRIMARY KEY (race_id, driver_id)
);

-- Indexes for performance
CREATE INDEX idx_races_season_round ON races(season, round);
CREATE INDEX idx_qualifying_race ON qualifying_results(race_id);
CREATE INDEX idx_telemetry_race ON telemetry_features(race_id);
CREATE INDEX idx_pace_deltas_race ON pace_deltas(race_id);
CREATE INDEX idx_outcome_probs_race ON outcome_probabilities(race_id);
CREATE INDEX idx_model_runs_created ON model_runs(created_at);
CREATE INDEX idx_simulation_runs_race ON simulation_runs(race_id);










