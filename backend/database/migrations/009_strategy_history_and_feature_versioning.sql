-- Migration 009: Strategy history payloads + governed telemetry feature versioning

ALTER TABLE strategy_results
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS response_blob JSONB,
ADD COLUMN IF NOT EXISTS comparison_blob JSONB;

ALTER TABLE telemetry_features
ADD COLUMN IF NOT EXISTS feature_version TEXT DEFAULT 'telemetry_features_v1',
ADD COLUMN IF NOT EXISTS feature_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tyre_age_compound_factor FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS track_temperature FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualifying_pace_delta FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS drs_activation_rate FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sector_variance FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS track_evolution_coefficient FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS weather_delta FLOAT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_strategy_results_race_created ON strategy_results(race_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_results_user_created ON strategy_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_feature_version ON telemetry_features(feature_version);
