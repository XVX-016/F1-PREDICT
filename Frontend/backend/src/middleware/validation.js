import Joi from 'joi';

// Validation schemas
const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  username: Joi.string().alphanum().min(3).max(30).optional().messages({
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot be longer than 30 characters'
  }),
  wallet_address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional().messages({
    'string.pattern.base': 'Invalid Ethereum wallet address format'
  })
});

const signInSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const betSchema = Joi.object({
  market_id: Joi.string().uuid().required().messages({
    'string.uuid': 'Invalid market ID format',
    'any.required': 'Market ID is required'
  }),
  outcome_id: Joi.string().uuid().required().messages({
    'string.uuid': 'Invalid outcome ID format',
    'any.required': 'Outcome ID is required'
  }),
  amount: Joi.number().positive().precision(8).required().messages({
    'number.positive': 'Bet amount must be positive',
    'any.required': 'Bet amount is required'
  }),
  currency: Joi.string().valid('BTC', 'ETH', 'USDT', 'USDC').required().messages({
    'any.only': 'Currency must be one of: BTC, ETH, USDT, USDC',
    'any.required': 'Currency is required'
  })
});

const paymentSchema = Joi.object({
  price_amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Payment amount must be positive',
    'any.required': 'Payment amount is required'
  }),
  order_id: Joi.string().required().messages({
    'any.required': 'Order ID is required'
  }),
  user_external_id: Joi.string().optional(),
  user_display_name: Joi.string().optional(),
  metadata: Joi.object().optional()
});

// Validation middleware functions
export const validateSignUp = (req, res, next) => {
  const { error } = signUpSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

export const validateSignIn = (req, res, next) => {
  const { error } = signInSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

export const validateBet = (req, res, next) => {
  const { error } = betSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

export const validatePayment = (req, res, next) => {
  const { error } = paymentSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

// Generic validation function
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};