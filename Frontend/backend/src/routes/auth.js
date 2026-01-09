import express from 'express';
import Joi from 'joi';
// User model temporarily removed - using mock data
import { authenticate } from '../middleware/auth.js';
import { rateLimiters } from '../middleware/rateLimit.js';
import emailService from '../config/email.js';
import tokenService from '../services/tokenService.js';
import MockUserService from '../services/mockUserService.js';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  first_name: Joi.string().min(1).max(50).required(),
  last_name: Joi.string().min(1).max(50).required(),
  avatar_url: Joi.string().uri().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  first_name: Joi.string().min(1).max(50).optional(),
  last_name: Joi.string().min(1).max(50).optional(),
  avatar_url: Joi.string().uri().optional()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required()
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', rateLimiters.registration, async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // Check if username is already taken
    const existingUsername = await MockUserService.findByUsername(value.username);
    if (existingUsername) {
      return res.status(400).json({
        error: 'Username already taken',
        message: 'Please choose a different username'
      });
    }

    // Create user
    const user = await MockUserService.create(value);
    
    // Generate JWT token
    const token = await MockUserService.generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        balance_cents: user.balance_cents,
        is_verified: user.is_verified,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', rateLimiters.auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // Authenticate user
    const user = await MockUserService.authenticate(value.email, value.password);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = await MockUserService.generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        balance_cents: user.balance_cents,
        is_verified: user.is_verified,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', rateLimiters.forgotPassword, async (req, res) => {
  try {
    // Validate input
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // Check if user exists
    const user = await MockUserService.findByEmail(value.email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token with expiration
    const tokenData = tokenService.createResetToken(user.id, user.email);
    
    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${tokenData.token}`;
    
    // Send email
    await emailService.sendPasswordResetEmail(
      user.email, 
      resetLink, 
      user.username || user.first_name
    );

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      expiresIn: '1 hour'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (error.message.includes('Too many active reset tokens')) {
      return res.status(429).json({
        error: 'Too many reset requests',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Forgot password failed',
      message: 'Internal server error while processing request'
    });
  }
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset user password with token
 * @access  Public
 */
router.post('/reset-password', rateLimiters.passwordReset, async (req, res) => {
  try {
    // Validate input
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // Validate reset token
    const tokenValidation = tokenService.validateResetToken(value.token);
    
    if (!tokenValidation.valid) {
      return res.status(400).json({
        error: 'Password reset failed',
        message: tokenValidation.reason || 'Invalid or expired reset token'
      });
    }

    // Reset password
    const success = await MockUserService.resetPasswordWithToken(value.token, value.password);
    
    if (!success) {
      return res.status(400).json({
        error: 'Password reset failed',
        message: 'Failed to update password'
      });
    }

    // Mark token as used
    tokenService.markTokenAsUsed(value.token);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'Internal server error while resetting password'
    });
  }
});

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await MockUserService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account may have been deleted'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        balance_cents: user.balance_cents,
        is_verified: user.is_verified,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'Internal server error while fetching profile'
    });
  }
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    // Validate input
    const { error, value } = profileUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // Check if username is already taken (if updating username)
    if (value.username && value.username !== req.user.username) {
      const existingUsername = await MockUserService.findByUsername(value.username);
      if (existingUsername) {
        return res.status(400).json({
          error: 'Username already taken',
          message: 'Please choose a different username'
        });
      }
    }

    // Update profile
    const updatedUser = await MockUserService.updateProfile(req.user.id, value);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        avatar_url: updatedUser.avatar_url,
        balance_cents: updatedUser.balance_cents,
        is_verified: updatedUser.is_verified,
        role: updatedUser.role,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error while updating profile'
    });
  }
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    // Validate input
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // Change password
    await MockUserService.changePassword(
      req.user.id,
      value.current_password,
      value.new_password
    );

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    
    if (error.message.includes('Current password is incorrect')) {
      return res.status(400).json({
        error: 'Password change failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Password change failed',
      message: 'Internal server error while changing password'
    });
  }
});

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticate, async (req, res) => {
  try {
    await MockUserService.deleteAccount(req.user.id);

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Account deletion failed',
      message: 'Internal server error while deleting account'
    });
  }
});

/**
 * @route   GET /api/v1/auth/leaderboard
 * @desc    Get user leaderboard
 * @access  Public
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await MockUserService.getLeaderboard(limit);

    res.json({
      leaderboard: leaderboard.map(user => ({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        balance_cents: user.balance_cents,
        total_bets_won: user.total_bets_won || 0,
        total_bets_placed: user.total_bets_placed || 0
      }))
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({
      error: 'Leaderboard fetch failed',
      message: 'Internal server error while fetching leaderboard'
    });
  }
});

/**
 * @route   GET /api/v1/auth/token-stats
 * @desc    Get token statistics (for monitoring)
 * @access  Private (Admin only)
 */
router.get('/token-stats', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const stats = tokenService.getTokenStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Token stats error:', error);
    res.status(500).json({
      error: 'Failed to get token statistics',
      message: 'Internal server error'
    });
  }
});

export default router;
