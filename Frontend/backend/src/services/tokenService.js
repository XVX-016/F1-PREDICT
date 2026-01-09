import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// In-memory storage for reset tokens (in production, use Redis or database)
const resetTokens = new Map();

// Token configuration
const TOKEN_CONFIG = {
  RESET_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour in milliseconds
  RESET_TOKEN_LENGTH: 32, // 32 characters
  MAX_TOKENS_PER_USER: 3 // Maximum active tokens per user
};

class TokenService {
  constructor() {
    // Clean up expired tokens every 15 minutes
    setInterval(() => this.cleanupExpiredTokens(), 15 * 60 * 1000);
  }

  // Generate a secure random reset token
  generateResetToken() {
    return crypto.randomBytes(TOKEN_CONFIG.RESET_TOKEN_LENGTH).toString('hex');
  }

  // Create a password reset token for a user
  createResetToken(userId, userEmail) {
    try {
      // Clean up old tokens for this user
      this.cleanupUserTokens(userId);

      // Check if user already has too many active tokens
      const userTokens = this.getUserTokens(userId);
      if (userTokens.length >= TOKEN_CONFIG.MAX_TOKENS_PER_USER) {
        throw new Error('Too many active reset tokens. Please wait before requesting another.');
      }

      const token = this.generateResetToken();
      const expiresAt = Date.now() + TOKEN_CONFIG.RESET_TOKEN_EXPIRY;

      const tokenData = {
        userId,
        userEmail,
        token,
        expiresAt,
        createdAt: Date.now(),
        used: false
      };

      // Store token
      resetTokens.set(token, tokenData);

      // Also store by userId for cleanup
      if (!resetTokens.has(`user_${userId}`)) {
        resetTokens.set(`user_${userId}`, []);
      }
      resetTokens.get(`user_${userId}`).push(token);

      console.log(`🔑 Reset token created for user ${userId}, expires at ${new Date(expiresAt).toISOString()}`);
      
      return {
        token,
        expiresAt,
        expiresIn: TOKEN_CONFIG.RESET_TOKEN_EXPIRY
      };
    } catch (error) {
      console.error('❌ Failed to create reset token:', error);
      throw error;
    }
  }

  // Validate a reset token
  validateResetToken(token) {
    try {
      const tokenData = resetTokens.get(token);
      
      if (!tokenData) {
        return { valid: false, reason: 'Token not found' };
      }

      if (tokenData.used) {
        return { valid: false, reason: 'Token already used' };
      }

      if (Date.now() > tokenData.expiresAt) {
        // Remove expired token
        this.removeToken(token);
        return { valid: false, reason: 'Token expired' };
      }

      return {
        valid: true,
        userId: tokenData.userId,
        userEmail: tokenData.userEmail,
        expiresAt: tokenData.expiresAt
      };
    } catch (error) {
      console.error('❌ Error validating reset token:', error);
      return { valid: false, reason: 'Token validation error' };
    }
  }

  // Mark a token as used
  markTokenAsUsed(token) {
    try {
      const tokenData = resetTokens.get(token);
      if (tokenData) {
        tokenData.used = true;
        resetTokens.set(token, tokenData);
        console.log(`🔑 Reset token ${token} marked as used`);
      }
    } catch (error) {
      console.error('❌ Error marking token as used:', error);
    }
  }

  // Remove a specific token
  removeToken(token) {
    try {
      const tokenData = resetTokens.get(token);
      if (tokenData) {
        // Remove from user's token list
        const userTokens = resetTokens.get(`user_${tokenData.userId}`) || [];
        const updatedUserTokens = userTokens.filter(t => t !== token);
        resetTokens.set(`user_${tokenData.userId}`, updatedUserTokens);
        
        // Remove the token itself
        resetTokens.delete(token);
        console.log(`🔑 Reset token ${token} removed`);
      }
    } catch (error) {
      console.error('❌ Error removing token:', error);
    }
  }

  // Get all tokens for a user
  getUserTokens(userId) {
    try {
      const userTokenList = resetTokens.get(`user_${userId}`) || [];
      return userTokenList
        .map(token => resetTokens.get(token))
        .filter(tokenData => tokenData && !tokenData.used && Date.now() <= tokenData.expiresAt);
    } catch (error) {
      console.error('❌ Error getting user tokens:', error);
      return [];
    }
  }

  // Clean up expired tokens for a specific user
  cleanupUserTokens(userId) {
    try {
      const userTokenList = resetTokens.get(`user_${userId}`) || [];
      const validTokens = [];

      userTokenList.forEach(token => {
        const tokenData = resetTokens.get(token);
        if (tokenData && Date.now() <= tokenData.expiresAt && !tokenData.used) {
          validTokens.push(token);
        } else {
          resetTokens.delete(token);
        }
      });

      resetTokens.set(`user_${userId}`, validTokens);
    } catch (error) {
      console.error('❌ Error cleaning up user tokens:', error);
    }
  }

  // Clean up all expired tokens
  cleanupExpiredTokens() {
    try {
      let cleanedCount = 0;
      
      for (const [key, value] of resetTokens.entries()) {
        if (key.startsWith('user_')) continue; // Skip user lists
        
        if (Date.now() > value.expiresAt || value.used) {
          resetTokens.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired/used tokens`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired tokens:', error);
    }
  }

  // Get token statistics (for monitoring)
  getTokenStats() {
    try {
      let totalTokens = 0;
      let activeTokens = 0;
      let expiredTokens = 0;
      let usedTokens = 0;

      for (const [key, value] of resetTokens.entries()) {
        if (key.startsWith('user_')) continue;
        
        totalTokens++;
        
        if (value.used) {
          usedTokens++;
        } else if (Date.now() > value.expiresAt) {
          expiredTokens++;
        } else {
          activeTokens++;
        }
      }

      return {
        total: totalTokens,
        active: activeTokens,
        expired: expiredTokens,
        used: usedTokens,
        cleanupInterval: '15 minutes'
      };
    } catch (error) {
      console.error('❌ Error getting token stats:', error);
      return { error: 'Failed to get token statistics' };
    }
  }

  // Generate JWT token for user authentication
  generateAuthToken(userId, expiresIn = '24h') {
    try {
      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
      return jwt.sign({ userId }, secret, { expiresIn });
    } catch (error) {
      console.error('❌ Error generating auth token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  // Verify JWT token
  verifyAuthToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
      return jwt.verify(token, secret);
    } catch (error) {
      console.error('❌ Error verifying auth token:', error);
      return null;
    }
  }
}

export default new TokenService();
