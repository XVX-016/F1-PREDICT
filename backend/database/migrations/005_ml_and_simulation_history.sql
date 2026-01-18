-- Migration 005: ML Outputs and Simulation History
-- Enables research-grade audit trails and model versioning

-- 1. Pace Deltas Table (ML Model Outputs)
-- Stores the predicted pace advantage/disadvantage for each driver per lap
CREATE TABLE IF NOT EXISTS pace_deltas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id),
    driver_id TEXT NOT NULL, -- using 'VER', 'HAM' etc.
    lap_number INTEGER NOT NULL,
    predicted_delta_ms FLOAT NOT NULL,
    model_version TEXT NOT NULL, -- e.g. "lgbm_v20240117"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(race_id, driver_id, lap_number, model_version)
);

-- 2. Strategy Results Table (Simulation History)
-- Stores the outcomes of user-run simulations for history/audit
CREATE TABLE IF NOT EXISTS strategy_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id),
    simulation_params JSONB NOT NULL, -- Store input controls (tyre_deg, sc_prob, etc)
    win_probabilities JSONB NOT NULL, -- {VER: 0.45, NOR: 0.30...}
    podium_probabilities JSONB NOT NULL,
    best_strategy_recommendation JSONB,
    seed BIGINT, -- For reproducibility
    model_version TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Telemetry Table (Live Race State)
-- Optional: Logic often assumes Redis, but SQL backup is good for replay
CREATE TABLE IF NOT EXISTS race_telemetry_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lap_number INTEGER,
    driver_data JSONB -- Full snapshot of positions/gaps
);

-- RLS Policies
ALTER TABLE pace_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_telemetry_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pace_deltas" ON pace_deltas FOR SELECT USING (true);
CREATE POLICY "Public read strategy_results" ON strategy_results FOR SELECT USING (true);
CREATE POLICY "Public read race_telemetry_snapshots" ON race_telemetry_snapshots FOR SELECT USING (true);

-- Insert policy (Service Role only usually, but allowing public for demo if needed)
CREATE POLICY "Service write pace_deltas" ON pace_deltas FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write strategy_results" ON strategy_results FOR INSERT WITH CHECK (true);
