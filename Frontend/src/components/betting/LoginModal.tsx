import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Coins, Gift, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useBetting } from '../../contexts/BettingContext';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { createUser, userLoading, error, clearError } = useBetting();
  const { signIn, signUp, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(true);
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAuthError('');
    
    try {
      if (isCreatingAccount) {
        // Use main auth system for sign up
        const result = await signUp(email, password, username);
        if (result.success) {
          // Also create betting user
          await createUser(username, email);
          onClose();
          setUsername('');
          setEmail('');
          setPassword('');
        } else {
          setAuthError(result.error || 'Sign up failed');
        }
      } else {
        // Use main auth system for sign in
        const result = await signIn(email, password);
        if (result.success) {
          onClose();
          setEmail('');
          setPassword('');
        } else {
          setAuthError(result.error || 'Sign in failed');
        }
      }
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleClose = () => {
    clearError();
    setAuthError('');
    setUsername('');
    setEmail('');
    setPassword('');
    onClose();
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
              <h2 className="text-2xl font-bold text-white mb-2">
                {isCreatingAccount ? 'Join F1 Predict' : 'Welcome Back'}
              </h2>
              <p className="text-gray-400">
                {isCreatingAccount 
                  ? 'Create your account and start predicting F1 races' 
                  : 'Sign in to your account'
                }
              </p>
            </div>

            {/* Welcome Bonus */}
            {isCreatingAccount && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Gift className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="text-yellow-400 font-bold">Welcome Bonus!</div>
                    <div className="text-yellow-300 text-sm">Get 10,000 PC to start betting</div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isCreatingAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required={isCreatingAccount}
                      className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isCreatingAccount ? "Create a password" : "Enter your password"}
                    required
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {(error || authError) && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                  <div className="text-red-400 text-sm">{error || authError}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={userLoading || authLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed"
              >
                {(userLoading || authLoading) ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isCreatingAccount ? 'Creating Account...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  <span>{isCreatingAccount ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>
            </form>

            {/* Features */}
            {isCreatingAccount && (
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
            )}

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsCreatingAccount(!isCreatingAccount)}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {isCreatingAccount 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Create one"
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
