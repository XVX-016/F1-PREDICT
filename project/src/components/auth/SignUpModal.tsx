import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Coins, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
}

export default function SignUpModal({ isOpen, onClose, onSwitchToSignIn }: SignUpModalProps) {
  const { signUp, isLoading } = useAuth();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Username validation (optional)
    if (formData.username && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    const result = await signUp(
      formData.email,
      formData.password,
      formData.username || undefined
    );

    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Account Created Successfully!',
        message: 'Welcome to F1 Predict! You can now start betting.'
      });
      onClose();
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        username: ''
      });
      setFieldErrors({});
    } else {
      setError(result.error || 'Sign up failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
    });
    setError('');
    setFieldErrors({});
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Join F1 Predict</h2>
              <p className="text-gray-400">Create your account and start predicting F1 races</p>
            </div>

            {/* Welcome Bonus */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <Gift className="w-6 h-6 text-yellow-400" />
                <div>
                  <div className="text-yellow-400 font-bold">Welcome Bonus!</div>
                  <div className="text-yellow-300 text-sm">Get 10,000 PC to start betting</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200 ${
                      fieldErrors.username ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-red-400 text-sm mt-1">{fieldErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200 ${
                      fieldErrors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200 ${
                      fieldErrors.password ? 'border-red-500' : ''
                    }`}
                    placeholder="Create a password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200 ${
                      fieldErrors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Features */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <Coins className="w-4 h-4 text-green-400" />
                <span>Start with 10,000 PC in-game currency</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span>Receive 1,000 PC every 4 hours</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <User className="w-4 h-4 text-blue-400" />
                <span>Track your betting performance</span>
              </div>
            </div>

            {/* Switch to Sign In */}
            <div className="mt-6 text-center">
              <button
                onClick={onSwitchToSignIn}
                className="text-gray-400 hover:text-white transition-colors text-sm"
                disabled={isLoading}
              >
                Already have an account? Sign in
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}