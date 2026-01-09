import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useBetting } from '../../contexts/BettingContext';

interface UserProfileProps {
  onNavigateToProfile?: () => void;
}

export default function UserProfile({ onNavigateToProfile }: UserProfileProps) {
  const { currentUser } = useBetting();

  if (!currentUser) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleClick = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl p-3 hover:bg-black/60 hover:border-white/30 transition-all duration-200 shadow-lg cursor-pointer"
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-white font-semibold text-sm">{currentUser.username}</div>
        </div>
      </div>
    </motion.button>
  );
}
