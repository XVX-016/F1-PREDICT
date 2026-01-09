import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.js';
import { validateSignUp, validateSignIn } from '../middleware/validation.js';

const router = express.Router();

// Mock user storage for development
const mockUsers = new Map();
const mockUserAuth = new Map();

// Sign up endpoint
router.post('/signup', validateSignUp, async (req, res) => {
  try {
    const { email, password, username, wallet_address } = req.body;

    // Check if user already exists
    if (mockUsers.has(email)) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Check if wallet address is already taken
    if (wallet_address) {
      for (const [userEmail, user] of mockUsers) {
        if (user.wallet_address === wallet_address) {
          return res.status(400).json({
            success: false,
            error: 'Wallet address already registered'
          });
        }
      }
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');

    // Create user
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email,
      username: username || `user_${Date.now()}`,
      wallet_address: wallet_address || null,
      created_at: new Date().toISOString(),
      is_verified: false,
      role: 'user',
      balance_cents: 0
    };

    // Store user and auth data
    mockUsers.set(email, user);
    mockUserAuth.set(email, {
      user_id: userId,
      email,
      password_hash,
      verification_token,
      created_at: new Date().toISOString()
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          wallet_address: user.wallet_address,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
});

// Sign in endpoint
router.post('/signin', validateSignIn, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = mockUsers.get(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const userAuth = mockUserAuth.get(email);
    if (!userAuth) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userAuth.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
      { expiresIn: '7d' }
    );

    // Mock balances
    const balances = {
      BTC: { balance: 0, locked_balance: 0 },
      ETH: { balance: 0, locked_balance: 0 },
      USDT: { balance: 0, locked_balance: 0 },
      USDC: { balance: 0, locked_balance: 0 }
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          wallet_address: user.wallet_address,
          created_at: user.created_at,
          is_verified: user.is_verified,
          role: user.role,
          balance_cents: user.balance_cents
        },
        token,
        balances
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during sign in'
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT u.id, u.wallet_address, u.username, u.email, u.created_at, u.is_active,
              u.total_volume, u.total_bets, u.win_rate,
              ua.email_verified
       FROM users u
       JOIN user_auth ua ON u.id = ua.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Get user balances
    const balanceResult = await query(
      'SELECT currency, balance, locked_balance FROM user_balances WHERE user_id = $1',
      [userId]
    );

    const balances = {};
    balanceResult.rows.forEach(row => {
      balances[row.currency] = {
        balance: parseFloat(row.balance),
        locked_balance: parseFloat(row.locked_balance)
      };
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          wallet_address: user.wallet_address,
          created_at: user.created_at,
          email_verified: user.email_verified,
          total_volume: parseFloat(user.total_volume),
          total_bets: user.total_bets,
          win_rate: parseFloat(user.win_rate)
        },
        balances
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, wallet_address } = req.body;

    // Check if wallet address is already taken by another user
    if (wallet_address) {
      const existingWallet = await query(
        'SELECT id FROM users WHERE wallet_address = $1 AND id != $2',
        [wallet_address, userId]
      );

      if (existingWallet.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address already registered to another user'
        });
      }
    }

    const result = await query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           wallet_address = COALESCE($2, wallet_address),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, wallet_address, username, email, updated_at`,
      [username, wallet_address, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.user_id = $1';
    let params = [userId];

    if (type) {
      whereClause += ' AND t.transaction_type = $2';
      params.push(type);
    }

    const result = await query(
      `SELECT t.*, b.market_id
       FROM transactions t
       LEFT JOIN bets b ON t.bet_id = b.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        transactions: result.rows.map(row => ({
          id: row.id,
          transaction_type: row.transaction_type,
          currency: row.currency,
          amount: parseFloat(row.amount),
          balance_before: parseFloat(row.balance_before),
          balance_after: parseFloat(row.balance_after),
          external_tx_hash: row.external_tx_hash,
          bet_id: row.bet_id,
          market_id: row.market_id,
          created_at: row.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;