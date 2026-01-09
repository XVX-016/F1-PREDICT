import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp, onSwitchToForgotPassword }: SignInModalProps) {
  const { signIn, isLoading } = useAuth();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
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

    const result = await signIn(formData.email, formData.password, formData.rememberMe);

    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Signed In Successfully!',
        message: 'Welcome back to F1 Predict!'
      });
      onClose();
      setFormData({ email: '', password: '', rememberMe: false });
      setFieldErrors({});
    } else {
      setError(result.error || 'Sign in failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ email: '', password: '', rememberMe: false });
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
            className="relative bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl"
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
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-gray-400">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
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
                    placeholder="Enter your password"
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

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-500 bg-black/50 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-300">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={onSwitchToForgotPassword}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Switch to Sign Up */}
            <div className="mt-6 text-center">
              <button
                onClick={onSwitchToSignUp}
                className="text-gray-400 hover:text-white transition-colors text-sm"
                disabled={isLoading}
              >
                Don't have an account? Sign up
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}