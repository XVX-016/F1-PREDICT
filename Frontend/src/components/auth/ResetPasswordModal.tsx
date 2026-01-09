import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

export default function ResetPasswordModal({ isOpen, onClose, token }: ResetPasswordModalProps) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [resetToken, setResetToken] = useState<string>('');

  // Extract token from URL when component mounts
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      const finalToken = token || tokenFromUrl || '';
      setResetToken(finalToken);
      
      if (!finalToken) {
        setError('No reset token found. Please request a new password reset.');
      }
    }
  }, [isOpen, token]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetToken) {
      setError('No reset token found. Please request a new password reset.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token: resetToken,
          password: formData.password 
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        // Remove token from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.pathname);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
    setFormData({ password: '', confirmPassword: '' });
    setError('');
    setFieldErrors({});
    setIsSuccess(false);
    setResetToken('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Reset Password</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSuccess ? (
            <>
              {!resetToken ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Invalid Reset Link</h3>
                  <p className="text-gray-300">
                    No reset token found. Please request a new password reset link.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-300 mb-6">
                    Enter your new password below.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error message */}
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    {/* New Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                            fieldErrors.password
                              ? 'border-red-500 focus:ring-red-500/20'
                              : 'border-gray-600 focus:ring-red-500/20 focus:border-red-500'
                          }`}
                          placeholder="Enter new password"
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
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                            fieldErrors.confirmPassword
                              ? 'border-red-500 focus:ring-red-500/20'
                              : 'border-gray-600 focus:ring-red-500/20 focus:border-red-500'
                          }`}
                          placeholder="Confirm new password"
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

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Password Reset Successfully</h3>
              <p className="text-gray-300">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
