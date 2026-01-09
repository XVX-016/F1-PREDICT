import React, { useState } from 'react';
import { X, Mail, Loader2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToSignIn: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose, onBackToSignIn }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const validateEmail = () => {
    if (!email) {
      setFieldError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError('Please enter a valid email address');
      return false;
    }
    setFieldError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setError('');
    setFieldError('');
    setIsSubmitted(false);
  };

  const handleBackToSignIn = () => {
    handleClose();
    onBackToSignIn();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToSignIn}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">Forgot Password</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSubmitted ? (
            <>
              <p className="text-gray-300 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldError) setFieldError('');
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                        fieldError
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-gray-600 focus:ring-red-500/20 focus:border-red-500'
                      }`}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>
                  {fieldError && (
                    <p className="text-red-400 text-sm mt-1">{fieldError}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Check Your Email</h3>
              <p className="text-gray-300">
                We've sent a password reset link to <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={handleBackToSignIn}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
