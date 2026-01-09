import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

// Initialize database
export const initDatabase = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, '../../data/f1_prediction_market.db'),
      driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await createTables();
    
    console.log('✅ SQLite database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

// Create tables
const createTables = async () => {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      avatar_url TEXT,
      balance_cents INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT 0,
      role TEXT DEFAULT 'user',
      total_bets_won INTEGER DEFAULT 0,
      total_bets_placed INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Payments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      price_amount REAL NOT NULL,
      pay_currency TEXT NOT NULL,
      order_description TEXT,
      customer_email TEXT,
      customer_name TEXT,
      metadata TEXT DEFAULT '{}',
      status TEXT DEFAULT 'created',
      nowpayments_payment_id TEXT,
      invoice_url TEXT,
      pay_address TEXT,
      pay_amount REAL,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Markets table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      end_time DATETIME NOT NULL,
      status TEXT DEFAULT 'open',
      total_bets INTEGER DEFAULT 0,
      total_pool_cents INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bets table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      market_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      odds REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (market_id) REFERENCES markets (id)
    )
  `);

  console.log('✅ Database tables created successfully');
};

// Query helper function
export const query = async (sql, params = []) => {
  try {
    const result = await db.all(sql, params);
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get single row
export const getRow = async (sql, params = []) => {
  try {
    const result = await db.get(sql, params);
    return result;
  } catch (error) {
    console.error('Database getRow error:', error);
    throw error;
  }
};

// Run query (for INSERT, UPDATE, DELETE)
export const run = async (sql, params = []) => {
  try {
    const result = await db.run(sql, params);
    return result;
  } catch (error) {
    console.error('Database run error:', error);
    throw error;
  }
};

// Transaction helper function
export const transaction = async (callback) => {
  try {
    await db.run('BEGIN TRANSACTION');
    const result = await callback();
    await db.run('COMMIT');
    return result;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    await db.get('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export default db;
