-- Migration 006: Create public users table
-- Required for foreign key constraints in user_points (gamification)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Matches auth.users id
    email TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Handle user creation triggers (optional but good for syncing with Auth)
-- For now, we just ensure the table exists so 003_gamification.sql can run.
