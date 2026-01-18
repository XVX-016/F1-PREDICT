-- Migration 009: Remove Legacy Betting Tables
-- Pivoting project to "Research-Grade Strategy Simulator"
-- Removing gambling elements to focus on engineering verification

DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS market_options CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;

-- Clean up any other gambling-related artifacts if needed
-- (Keeping user_profiles and users as they are useful for basic auth/identity)

COMMENT ON SCHEMA public IS 'F1-PREDICT Verification Engine - No Gambling Elements';
