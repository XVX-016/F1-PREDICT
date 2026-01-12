-- Migration: 003_gamification
-- Description: Creates table for tracking user points and daily/hourly bonuses

CREATE TABLE IF NOT EXISTS user_points (
    user_id UUID REFERENCES users(id) PRIMARY KEY,
    points INT DEFAULT 0,
    last_hourly TIMESTAMP WITH TIME ZONE,
    last_daily TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for leaderboard performance
CREATE INDEX IF NOT EXISTS idx_user_points_points ON user_points(points DESC);
