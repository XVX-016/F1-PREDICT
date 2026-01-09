import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import F1CarCarousel from '../components/F1CarCarousel';

interface SignInPageProps {
  onPageChange?: (page: string) => void;
}

export default function SignInPage({ onPageChange }: SignInPageProps) {
  const { signIn, isLoading } = useAuth();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
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
      if (onPageChange) {
        onPageChange('betting');
      }
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

  const handleBackToHome = () => {
    if (onPageChange) {
      onPageChange('home');
    }
  };

  const handleSwitchToSignUp = () => {
    if (onPageChange) {
      onPageChange('signup');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative">
      {/* Car carousel background */}
      <F1CarCarousel />
      
      {/* Close button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-6 right-6 z-10 text-white hover:text-gray-300 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
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
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full pl-10 pr-4 py-3 bg-black/40 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all ${
                  fieldErrors.email ? 'border-red-500' : 'border-white/20'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-12 py-3 bg-black/40 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all ${
                  fieldErrors.password ? 'border-red-500' : 'border-white/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 bg-black/40 border-white/20 rounded focus:ring-red-500/50 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-300">Remember me</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button
              onClick={handleSwitchToSignUp}
              className="text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
