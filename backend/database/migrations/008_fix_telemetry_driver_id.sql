-- Migration 008: Fix telemetry_features driver_id constraint
-- Changes driver_id from UUID foreign key to TEXT (driver code)

-- Drop the foreign key constraint if it exists
ALTER TABLE telemetry_features 
DROP CONSTRAINT IF EXISTS telemetry_features_driver_id_fkey;

-- Change driver_id column type to TEXT
ALTER TABLE telemetry_features 
ALTER COLUMN driver_id TYPE TEXT USING driver_id::TEXT;

-- Create composite unique constraint for upsert
ALTER TABLE telemetry_features
DROP CONSTRAINT IF EXISTS telemetry_features_pkey;

ALTER TABLE telemetry_features
ADD CONSTRAINT telemetry_features_race_driver_unique 
UNIQUE (race_id, driver_id);

-- Also fix race_id constraint to allow NULL for races not in system yet
ALTER TABLE telemetry_features
DROP CONSTRAINT IF EXISTS telemetry_features_race_id_fkey;

-- Add id column as primary key instead
ALTER TABLE telemetry_features
ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();

-- Make id the primary key (if not already)
-- This may fail if already exists, that's fine
DO $$ 
BEGIN
    ALTER TABLE telemetry_features ADD PRIMARY KEY (id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
