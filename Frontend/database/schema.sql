-- F1 Race Intelligence Database Schema
-- PostgreSQL Database for Formula 1 strategy analysis platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Simplified)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- F1 races table
CREATE TABLE races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    circuit VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    season INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, live, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season, round)
);

-- F1 drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id VARCHAR(50) UNIQUE NOT NULL, -- Ergast API driver ID
    name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100),
    team VARCHAR(255),
    car_number INTEGER,
    season INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Race results table
CREATE TABLE race_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    position INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    time_or_gap VARCHAR(50),
    fastest_lap BOOLEAN DEFAULT false,
    grid_position INTEGER,
    status VARCHAR(50), -- Finished, DNF, DSQ, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(race_id, driver_id)
);

-- User authentication table
CREATE TABLE user_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intelligence specific tables (Coming soon in Phase 2)
-- tyre_degradation_models
-- fuel_burn_rates
-- pit_stop_performance
-- strategy_simulations

-- Indexes for performance
CREATE INDEX idx_races_date_time ON races(date_time);
CREATE INDEX idx_races_season_round ON races(season, round);
CREATE INDEX idx_race_results_race_id ON race_results(race_id);
CREATE INDEX idx_user_auth_email ON user_auth(email);
CREATE INDEX idx_user_auth_user_id ON user_auth(user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_race_results_updated_at BEFORE UPDATE ON race_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_auth_updated_at BEFORE UPDATE ON user_auth FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
