import { query } from '../config/database.js';

const migrations = [
  // Migration 1: Update users table to match User model
  `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
    ADD COLUMN IF NOT EXISTS balance_cents INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_bets_won INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_bets_placed INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  `,
  
  // Migration 2: Create payments table if it doesn't exist
  `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id VARCHAR(255) UNIQUE NOT NULL,
      user_id UUID NOT NULL REFERENCES users(id),
      price_amount DECIMAL(20, 8) NOT NULL,
      pay_currency VARCHAR(10) NOT NULL,
      order_description TEXT,
      customer_email VARCHAR(255),
      customer_name VARCHAR(255),
      metadata JSONB DEFAULT '{}',
      status VARCHAR(20) DEFAULT 'created',
      nowpayments_payment_id VARCHAR(255),
      invoice_url TEXT,
      pay_address VARCHAR(255),
      pay_amount DECIMAL(20, 8),
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Migration 3: Create indexes for payments table
  `
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
  `,
  
  // Migration 4: Update existing users to have default values
  `
    UPDATE users 
    SET 
      is_verified = COALESCE(is_verified, false),
      role = COALESCE(role, 'user'),
      balance_cents = COALESCE(balance_cents, 0),
      total_bets_won = COALESCE(total_bets_won, 0),
      total_bets_placed = COALESCE(total_bets_placed, 0),
      is_active = COALESCE(is_active, true)
    WHERE is_verified IS NULL 
       OR role IS NULL 
       OR balance_cents IS NULL 
       OR total_bets_won IS NULL 
       OR total_bets_placed IS NULL 
       OR is_active IS NULL;
  `,
  
  // Migration 5: Add trigger for payments table
  `
    CREATE OR REPLACE FUNCTION update_payments_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
    CREATE TRIGGER update_payments_updated_at 
      BEFORE UPDATE ON payments 
      FOR EACH ROW 
      EXECUTE FUNCTION update_payments_updated_at();
  `
];

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`📝 Running migration ${i + 1}/${migrations.length}...`);
      
      await query(migration);
      console.log(`✅ Migration ${i + 1} completed successfully`);
    }
    
    console.log('🎉 All migrations completed successfully!');
    
    // Verify the schema
    console.log('🔍 Verifying schema...');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Current tables:', tables.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default runMigrations;
