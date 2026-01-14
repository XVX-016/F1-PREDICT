import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  return (
    <div className="min-h-screen text-white overflow-x-hidden pt-32 relative">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
            Profile
          </h1>
          <p className="text-xl text-gray-300">Manage your account and view your progress</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-6xl shadow-2xl">
              👤
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">
                {user?.username || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-gray-300 mb-4 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {user?.email || 'No email provided'}
              </p>
              <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2">
                <Calendar className="w-4 h-4" />
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Sign Out Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="bg-red-600/80 hover:bg-red-700/80 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm border border-red-500/30"
            >
              Sign Out
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-black/20 backdrop-blur-2xl border border-white/20 rounded-xl p-1">
          {[
            { id: 'overview', label: 'Overview', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-red-600/80 text-white shadow-lg shadow-red-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-gray-400 text-center py-12 border border-dashed border-white/10 rounded-xl">
                Race Intelligence tools and strategy analysis coming soon.
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}