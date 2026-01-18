-- Migration 007: Add ML Training Columns to telemetry_features
-- Adds columns needed for LightGBM training and traceability

-- Add missing columns to telemetry_features
ALTER TABLE telemetry_features 
ADD COLUMN IF NOT EXISTS recent_form FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_position INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS target_pace_delta FLOAT,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'FastF1',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create ml_models table for model versioning
CREATE TABLE IF NOT EXISTS ml_models (
    model_version TEXT PRIMARY KEY,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    training_rows INTEGER,
    oof_mae_ms FLOAT,
    zero_baseline_mae_ms FLOAT,
    mean_baseline_mae_ms FLOAT,
    residual_std_ms FLOAT,
    residual_p05_ms FLOAT,
    residual_p95_ms FLOAT,
    data_cutoff DATE,
    features JSONB,
    git_commit TEXT
);

-- Create feature_snapshots for traceability
CREATE TABLE IF NOT EXISTS feature_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id),
    driver_id TEXT NOT NULL,
    features JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ml_models" ON ml_models FOR SELECT USING (true);
CREATE POLICY "Service write ml_models" ON ml_models FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read feature_snapshots" ON feature_snapshots FOR SELECT USING (true);
CREATE POLICY "Service write feature_snapshots" ON feature_snapshots FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_created ON telemetry_features(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_snapshots_race ON feature_snapshots(race_id);
