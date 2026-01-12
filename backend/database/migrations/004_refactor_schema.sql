-- Migration 004: Frontend Refactor Schema Updates

-- 1. Create constructors table
CREATE TABLE IF NOT EXISTS constructors (
    id TEXT PRIMARY KEY, -- e.g. 'red_bull'
    name TEXT NOT NULL,
    color TEXT,
    accent_color TEXT,
    logo_url TEXT,
    car_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enhance races table for full calendar support
ALTER TABLE races 
ADD COLUMN IF NOT EXISTS fp1_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fp2_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fp3_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS qualifying_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sprint_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS circuit_image_url TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Enhance drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS number INT,
ADD COLUMN IF NOT EXISTS country_code TEXT, -- e.g. 'NL' or flag emoji
ADD COLUMN IF NOT EXISTS constructor_id TEXT REFERENCES constructors(id);

-- 4. Create RLS policies for new/updated tables (Public Read)
ALTER TABLE constructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read constructors"
ON constructors FOR SELECT
USING (true);
