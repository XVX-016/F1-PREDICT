import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    username: '',
    first_name: '',
    last_name: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      
      if (isSignUp) {
        result = await register(formData);
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        onClose();
        // Reset form
        setFormData({
          email: '',
          password: '',
          username: '',
          first_name: '',
          last_name: ''
        });
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData({
      email: '',
      password: '',
      username: '',
      first_name: '',
      last_name: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="glass-btn bg-red-900/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="glass-input w-full pl-10 pr-3 py-2 rounded-lg focus:border-red-500 focus:outline-none"
                      placeholder="First Name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="glass-input w-full pl-10 pr-3 py-2 rounded-lg focus:border-red-500 focus:outline-none"
                      placeholder="Last Name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="glass-input w-full pl-10 pr-3 py-2 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="Username"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="glass-input w-full pl-10 pr-3 py-2 rounded-lg focus:border-red-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={isSignUp ? 8 : undefined}
                className="glass-input w-full pl-10 pr-12 py-2 rounded-lg focus:border-red-500 focus:outline-none"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-400 mt-1">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="glass-btn-primary w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/30 rounded-b-xl">
          <div className="text-center">
            <span className="text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              onClick={toggleMode}
              className="ml-2 text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
