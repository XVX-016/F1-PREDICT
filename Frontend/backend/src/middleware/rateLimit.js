import rateLimit from 'express-rate-limit';

// Rate limiting configurations
export const rateLimiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(15 * 60)
      });
    }
  }),

  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
      success: false,
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60)
      });
    }
  }),

  // Very strict rate limiting for forgot password
  forgotPassword: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per hour
    message: {
      success: false,
      error: 'Too many password reset requests',
      message: 'Too many password reset requests, please try again later.',
      retryAfter: Math.ceil(60 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many password reset requests, please try again later.',
        retryAfter: Math.ceil(60 * 60)
      });
    },
    // Custom key generator to include email for better rate limiting
    keyGenerator: (req) => {
      const email = req.body?.email || req.query?.email || 'unknown';
      return `${req.ip}-forgot-password-${email}`;
    }
  }),

  // Rate limiting for password reset attempts
  passwordReset: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 attempts per 15 minutes
    message: {
      success: false,
      error: 'Too many password reset attempts',
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many password reset attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60)
      });
    }
  }),

  // Rate limiting for user registration
  registration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registrations per hour
    message: {
      success: false,
      error: 'Too many registration attempts',
      message: 'Too many registration attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many registration attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60)
      });
    }
  }),

  // Rate limiting for betting/market operations
  betting: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 betting operations per minute
    message: {
      success: false,
      error: 'Too many betting operations',
      message: 'Too many betting operations, please slow down.',
      retryAfter: Math.ceil(1 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many betting operations, please slow down.',
        retryAfter: Math.ceil(1 * 60)
      });
    }
  })
};

// Dynamic rate limiter based on user authentication status
export const dynamicRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: (req) => {
      // Authenticated users get higher limits
      if (req.user) {
        return options.authenticatedMax || options.max || 100;
      }
      return options.max || 50;
    },
    message: options.message || {
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: options.handler || ((req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later.'
      });
    })
  });
};

// Health check for rate limiting
export const getRateLimitStats = async () => {
  try {
    return {
      store: 'Memory',
      status: 'Active',
      note: 'Using express-rate-limit default memory store'
    };
  } catch (error) {
    return {
      store: 'Unknown',
      status: 'Error',
      error: error.message
    };
  }
};

export default rateLimiters;
