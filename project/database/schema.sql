-- F1 Prediction Market Database Schema
-- PostgreSQL Database for Formula 1 betting platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    total_volume DECIMAL(20, 8) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 4) DEFAULT 0
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

-- Markets table
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id),
    market_type VARCHAR(50) NOT NULL, -- race_winner, podium, fastest_lap, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open', -- open, closed, resolved, cancelled
    opens_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolves_at TIMESTAMP WITH TIME ZONE,
    resolution_source VARCHAR(255),
    total_volume DECIMAL(20, 8) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(race_id, market_type)
);

-- Market outcomes (possible betting options)
CREATE TABLE market_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    outcome_type VARCHAR(50) NOT NULL, -- driver, yes_no, team, etc.
    title VARCHAR(255) NOT NULL,
    odds DECIMAL(10, 4) DEFAULT 1.0,
    probability DECIMAL(5, 4) DEFAULT 0.5,
    total_volume DECIMAL(20, 8) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    is_winning_outcome BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets table
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    market_id UUID NOT NULL REFERENCES markets(id),
    outcome_id UUID NOT NULL REFERENCES market_outcomes(id),
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- BTC, ETH, USDT, USDC
    odds_at_bet DECIMAL(10, 4) NOT NULL,
    potential_payout DECIMAL(20, 8) NOT NULL,
    actual_payout DECIMAL(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, won, lost, refunded
    payment_hash VARCHAR(255),
    coinbase_charge_id VARCHAR(255),
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User balances for different cryptocurrencies
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    currency VARCHAR(10) NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    locked_balance DECIMAL(20, 8) DEFAULT 0, -- funds locked in active bets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Transactions table for tracking all balance changes
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    bet_id UUID REFERENCES bets(id),
    transaction_type VARCHAR(50) NOT NULL, -- deposit, withdraw, bet_placed, bet_won, bet_lost, bet_refund
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    balance_before DECIMAL(20, 8) NOT NULL,
    balance_after DECIMAL(20, 8) NOT NULL,
    external_tx_hash VARCHAR(255),
    coinbase_charge_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Market resolutions table
CREATE TABLE market_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id),
    winning_outcome_id UUID REFERENCES market_outcomes(id),
    resolution_data JSONB,
    resolved_by VARCHAR(100) DEFAULT 'system',
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOWPayments orders table
CREATE TABLE nowpayments_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    bet_id UUID REFERENCES bets(id),
    price_amount DECIMAL(10, 2) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'usd',
    pay_currency VARCHAR(10) DEFAULT 'btc',
    nowpayments_payment_id VARCHAR(255),
    invoice_url TEXT,
    status VARCHAR(20) DEFAULT 'created', -- created, waiting, finished, failed, expired
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table for IPN tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    price_amount DECIMAL(10, 2) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'usd',
    pay_currency VARCHAR(10) DEFAULT 'btc',
    pay_amount DECIMAL(20, 8),
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, confirmed, finished, failed, refunded, expired
    payment_address TEXT,
    payin_hash VARCHAR(255),
    payout_hash VARCHAR(255),
    invoice_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User authentication table (for email/password auth alongside wallet)
CREATE TABLE user_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard snapshots table for daily profit delta calculations
CREATE TABLE leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_races_date_time ON races(date_time);
CREATE INDEX idx_races_season_round ON races(season, round);
CREATE INDEX idx_markets_race_id ON markets(race_id);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_market_outcomes_market_id ON market_outcomes(market_id);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_market_id ON bets(market_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_placed_at ON bets(placed_at);
CREATE INDEX idx_user_balances_user_id_currency ON user_balances(user_id, currency);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_bet_id ON transactions(bet_id);
CREATE INDEX idx_race_results_race_id ON race_results(race_id);
CREATE INDEX idx_nowpayments_orders_order_id ON nowpayments_orders(order_id);
CREATE INDEX idx_nowpayments_orders_user_id ON nowpayments_orders(user_id);
CREATE INDEX idx_nowpayments_orders_status ON nowpayments_orders(status);
CREATE INDEX idx_payments_payment_id ON payments(payment_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
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

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_outcomes_updated_at BEFORE UPDATE ON market_outcomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_race_results_updated_at BEFORE UPDATE ON race_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nowpayments_orders_updated_at BEFORE UPDATE ON nowpayments_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_auth_updated_at BEFORE UPDATE ON user_auth FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for 2025 F1 season
INSERT INTO races (round, name, circuit, country, date_time, season) VALUES
(1, 'Australian Grand Prix', 'Melbourne', 'Australia', '2025-03-16 04:00:00+00', 2025),
(2, 'Chinese Grand Prix', 'Shanghai', 'China', '2025-03-23 07:00:00+00', 2025),
(3, 'Japanese Grand Prix', 'Suzuka', 'Japan', '2025-04-06 06:00:00+00', 2025),
(4, 'Bahrain Grand Prix', 'Sakhir', 'Bahrain', '2025-04-13 16:00:00+00', 2025),
(5, 'Saudi Arabian Grand Prix', 'Jeddah', 'Saudi Arabia', '2025-04-20 18:00:00+00', 2025),
(6, 'Miami Grand Prix', 'Miami', 'USA', '2025-05-04 21:00:00+00', 2025),
(7, 'Emilia Romagna Grand Prix', 'Imola', 'Italy', '2025-05-18 14:00:00+00', 2025),
(8, 'Monaco Grand Prix', 'Monte Carlo', 'Monaco', '2025-05-25 14:00:00+00', 2025),
(9, 'Spanish Grand Prix', 'Barcelona', 'Spain', '2025-06-01 14:00:00+00', 2025),
(10, 'Canadian Grand Prix', 'Montreal', 'Canada', '2025-06-15 19:00:00+00', 2025),
(11, 'Austrian Grand Prix', 'Spielberg', 'Austria', '2025-06-29 14:00:00+00', 2025),
(12, 'British Grand Prix', 'Silverstone', 'United Kingdom', '2025-07-06 15:00:00+00', 2025),
(13, 'Belgian Grand Prix', 'Spa', 'Belgium', '2025-07-27 14:00:00+00', 2025),
(14, 'Hungarian Grand Prix', 'Budapest', 'Hungary', '2025-08-03 14:00:00+00', 2025),
(15, 'Dutch Grand Prix', 'Zandvoort', 'Netherlands', '2025-08-31 14:00:00+00', 2025),
(16, 'Italian Grand Prix', 'Monza', 'Italy', '2025-09-07 14:00:00+00', 2025),
(17, 'Azerbaijan Grand Prix', 'Baku', 'Azerbaijan', '2025-09-21 12:00:00+00', 2025),
(18, 'Singapore Grand Prix', 'Marina Bay', 'Singapore', '2025-10-05 13:00:00+00', 2025),
(19, 'United States Grand Prix', 'Austin', 'USA', '2025-10-19 20:00:00+00', 2025),
(20, 'Mexico City Grand Prix', 'Mexico City', 'Mexico', '2025-10-26 20:00:00+00', 2025),
(21, 'Brazilian Grand Prix', 'São Paulo', 'Brazil', '2025-11-09 17:00:00+00', 2025),
(22, 'Las Vegas Grand Prix', 'Las Vegas', 'USA', '2025-11-23 04:00:00+00', 2025),
(23, 'Qatar Grand Prix', 'Lusail', 'Qatar', '2025-11-30 16:00:00+00', 2025),
(24, 'Abu Dhabi Grand Prix', 'Yas Marina', 'UAE', '2025-12-07 13:00:00+00', 2025);

-- Sample F1 drivers for 2025 season
INSERT INTO drivers (driver_id, name, nationality, team, car_number, season) VALUES
('max_verstappen', 'Max Verstappen', 'Dutch', 'Red Bull Racing', 1, 2025),
('lando_norris', 'Lando Norris', 'British', 'McLaren', 4, 2025),
('oscar_piastri', 'Oscar Piastri', 'Australian', 'McLaren', 81, 2025),
('george_russell', 'George Russell', 'British', 'Mercedes', 63, 2025),
('lewis_hamilton', 'Lewis Hamilton', 'British', 'Ferrari', 44, 2025),
('charles_leclerc', 'Charles Leclerc', 'Monégasque', 'Ferrari', 16, 2025),
('carlos_sainz', 'Carlos Sainz Jr.', 'Spanish', 'Williams', 55, 2025),
('fernando_alonso', 'Fernando Alonso', 'Spanish', 'Aston Martin', 14, 2025),
('lance_stroll', 'Lance Stroll', 'Canadian', 'Aston Martin', 18, 2025),
('pierre_gasly', 'Pierre Gasly', 'French', 'Alpine', 10, 2025),
('esteban_ocon', 'Esteban Ocon', 'French', 'Alpine', 31, 2025),
('nico_hulkenberg', 'Nico Hülkenberg', 'German', 'Sauber', 27, 2025),
('valtteri_bottas', 'Valtteri Bottas', 'Finnish', 'Sauber', 77, 2025),
('yuki_tsunoda', 'Yuki Tsunoda', 'Japanese', 'RB', 22, 2025),
('liam_lawson', 'Liam Lawson', 'New Zealand', 'RB', 30, 2025),
('alexander_albon', 'Alexander Albon', 'Thai', 'Williams', 23, 2025),
('kimi_antonelli', 'Andrea Kimi Antonelli', 'Italian', 'Mercedes', 12, 2025),
('oliver_bearman', 'Oliver Bearman', 'British', 'Haas', 87, 2025),
('esteban_ocon', 'Esteban Ocon', 'French', 'Alpine', 31, 2025),
('jack_doohan', 'Jack Doohan', 'Australian', 'Alpine', 50, 2025);
