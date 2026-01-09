import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, transaction } from '../config/database.js';

class User {
  static async create(userData) {
    const { email, password, username, first_name, last_name, avatar_url } = userData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    try {
      const result = await query(
        `INSERT INTO users (email, password_hash, username, first_name, last_name, avatar_url, balance_cents, is_verified, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [email, hashedPassword, username, first_name, last_name, avatar_url || null, 0, false, 'user']
      );
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint.includes('email')) {
          throw new Error('User with this email already exists');
        } else if (error.constraint.includes('username')) {
          throw new Error('Username already taken');
        }
      }
      throw error;
    }
  }

  static async authenticate(email, password) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  static async generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Find user by ID error:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1 AND is_active = true',
        [username]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Find user by username error:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      values.push(userId);
      
      const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current user
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      const result = await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [hashedNewPassword, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  static async updateBalance(userId, amountCents) {
    try {
      const result = await query(
        'UPDATE users SET balance_cents = balance_cents + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [amountCents, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Balance update error:', error);
      throw error;
    }
  }

  static async deleteAccount(userId) {
    try {
      await query(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      
      return true;
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  }

  static async getLeaderboard(limit = 20) {
    try {
      const result = await query(
        `SELECT id, username, first_name, last_name, avatar_url, balance_cents,
                COALESCE(total_bets_won, 0) as total_bets_won,
                COALESCE(total_bets_placed, 0) as total_bets_placed
         FROM users 
         WHERE is_active = true 
         ORDER BY balance_cents DESC, total_bets_won DESC
         LIMIT $1`,
        [limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      throw error;
    }
  }

  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export default User;
