import React from 'react';
import { X, User, Mail, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, signOut } = useAuth();

  if (!isOpen || !user) return null;



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-red-400" />
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <div className="flex items-center gap-2 text-white">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                  {!user.email_verified && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
              
              {user.username && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                  <div className="text-white">{user.username}</div>
                </div>
              )}
              

              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Member Since</label>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(user.created_at)}
                </div>
              </div>
            </div>
          </div>



          {/* F1 Prediction Statistics */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              F1 Prediction Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Predictions Made</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Correct Predictions</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0%</div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}