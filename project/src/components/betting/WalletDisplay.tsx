import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Coins, TrendingUp } from 'lucide-react';
import { useBetting } from '../../contexts/BettingContext';

export default function WalletDisplay() {
  const { currentUser } = useBetting();

  if (!currentUser) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-gradient-to-r from-green-600/20 to-green-700/20 backdrop-blur-xl border border-green-500/30 rounded-xl px-3 sm:px-4 shadow-lg hover:shadow-green-500/25 transition-all duration-200 h-16 sm:h-20 flex items-center"
    >
      <div className="flex items-center space-x-2 sm:space-x-3 w-full">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="text-xs text-green-300 font-medium">Balance</div>
          <div className="text-green-400 font-extrabold text-sm sm:text-lg lg:text-xl truncate">
            {formatCurrency(currentUser.balance)} PC
          </div>
        </div>
        <div className="flex items-center space-x-1 text-green-300 flex-shrink-0">
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs">+1k/4h</span>
        </div>
      </div>
    </motion.div>
  );
}
