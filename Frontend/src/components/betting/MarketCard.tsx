import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Users, 
  Coins, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Trophy,
  Target,
  Plus
} from 'lucide-react';
import { BettingMarket, MarketCategory, UserBet } from '../../types/betting';

interface MarketCardProps {
  market: BettingMarket;
  onClick: () => void;
  onAddToBetslip?: (bet: any) => void;
  userBets: UserBet[];
}

const getCategoryIcon = (category: MarketCategory) => {
  switch (category) {
    case MarketCategory.RACE_WINNER:
      return Trophy;
    case MarketCategory.PODIUM_FINISH:
      return TrendingUp;
    case MarketCategory.SAFETY_CAR:
      return AlertCircle;
    case MarketCategory.DNF_COUNT:
      return XCircle;
    case MarketCategory.POLE_POSITION:
      return CheckCircle;
    default:
      return Target;
  }
};

const getCategoryColor = (category: MarketCategory) => {
  switch (category) {
    case MarketCategory.RACE_WINNER:
      return 'from-yellow-500 to-yellow-600';
    case MarketCategory.PODIUM_FINISH:
      return 'from-blue-500 to-blue-600';
    case MarketCategory.SAFETY_CAR:
      return 'from-orange-500 to-orange-600';
    case MarketCategory.DNF_COUNT:
      return 'from-red-500 to-red-600';
    case MarketCategory.POLE_POSITION:
      return 'from-purple-500 to-purple-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function MarketCard({ market, onClick, onAddToBetslip, userBets }: MarketCardProps) {
  const CategoryIcon = getCategoryIcon(market.category);
  const categoryColor = getCategoryColor(market.category);
  const userBet = userBets.find(bet => bet.marketId === market.id);
  
  const timeUntilExpiry = market.expiresAt.getTime() - Date.now();
  const isExpiringSoon = timeUntilExpiry < 24 * 60 * 60 * 1000; // Less than 24 hours
  const isExpired = timeUntilExpiry < 0;

  const handleAddToBetslip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToBetslip) {
      onAddToBetslip({
        id: market.id,
        title: market.title,
        description: market.description,
        odds: market.options[0]?.currentPrice / 100 || 2.0,
        market: market
      });
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative group cursor-pointer transition-all duration-500 w-full min-w-0 flex flex-col rounded-2xl max-h-[520px] min-h-[360px] ${
        market.isSettled 
          ? 'hover:shadow-2xl hover:shadow-gray-500/20' 
          : market.isActive 
            ? 'hover:shadow-2xl hover:shadow-red-500/20' 
            : 'hover:shadow-2xl hover:shadow-gray-600/20'
      }`}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        market.isSettled 
          ? 'from-gray-500/10 to-gray-600/10' 
          : market.isActive 
            ? 'from-red-500/10 to-red-600/10' 
            : 'from-gray-600/10 to-gray-700/10'
      } rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
      
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-2xl ${
        market.isSettled 
          ? 'bg-gradient-to-r from-gray-500/20 to-gray-600/20' 
          : market.isActive 
            ? 'bg-gradient-to-r from-red-500/20 to-red-600/20' 
            : 'bg-gradient-to-r from-gray-600/20 to-gray-700/20'
      } blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>

      {/* Content */}
      <div className="relative z-10 p-5 md:p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl bg-gradient-to-r ${categoryColor} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
              <CategoryIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-gray-100 transition-colors duration-300">
                {market.title}
              </h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {market.raceName}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            market.isSettled
              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              : market.isActive
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {market.isSettled ? 'SETTLED' : market.isActive ? 'ACTIVE' : 'EXPIRED'}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-4 group-hover:text-gray-200 transition-colors duration-300">
          {market.description}
        </p>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center group-hover:transform group-hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Coins className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Volume</span>
            </div>
            <div className="text-white font-semibold group-hover:text-green-100 transition-colors duration-300">
              {formatCurrency(market.totalVolume)} PC
            </div>
          </div>
          
          <div className="text-center group-hover:transform group-hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Bets</span>
            </div>
            <div className="text-white font-semibold group-hover:text-blue-100 transition-colors duration-300">
              {market.totalBets}
            </div>
          </div>
          
          <div className="text-center group-hover:transform group-hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Options</span>
            </div>
            <div className="text-white font-semibold group-hover:text-purple-100 transition-colors duration-300">
              {market.options.length}
            </div>
          </div>
          </div>

          {/* Options Preview */}
          <div className="space-y-2 mb-4">
          {market.options.slice(0, 3).map((option) => (
            <div key={option.id} className="flex items-center justify-between group-hover:bg-white/5 rounded-lg p-2 transition-all duration-300">
              <span className="text-sm text-gray-300 truncate flex-1 group-hover:text-gray-200 transition-colors duration-300">
                {option.title}
              </span>
              <span className={`text-sm font-medium ${
                option.isWinning ? 'text-green-400' : 'text-gray-400'
              } group-hover:text-white transition-colors duration-300`}>
                {option.currentPrice}¢
              </span>
            </div>
          ))}
          {market.options.length > 3 && (
            <div className="text-xs text-gray-500 text-center group-hover:text-gray-400 transition-colors duration-300">
              +{market.options.length - 3} more options
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className={`w-4 h-4 ${
              isExpired ? 'text-red-400' : isExpiringSoon ? 'text-orange-400' : 'text-gray-400'
            } group-hover:animate-pulse transition-all duration-300`} />
            <span className={`text-xs ${
              isExpired ? 'text-red-400' : isExpiringSoon ? 'text-orange-400' : 'text-gray-400'
            } group-hover:text-white transition-colors duration-300`}>
              {isExpired 
                ? 'Expired' 
                : isExpiringSoon 
                  ? 'Expires soon' 
                  : formatDate(market.expiresAt)
              }
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* User Bet Indicator */}
            {userBet && (
              <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium border border-blue-500/30 backdrop-blur-sm group-hover:bg-blue-500/30 transition-all duration-300">
                Your Bet
              </div>
            )}

            {/* Add to Betslip Button */}
            {onAddToBetslip && market.isActive && !isExpired && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToBetslip}
                className="bg-blue-600/80 hover:bg-blue-700/80 text-white p-1 rounded-full transition-all duration-200 backdrop-blur-sm border border-blue-500/30"
                title="Add to betslip"
              >
                <Plus className="w-3 h-3" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Winning Option Indicator */}
        {market.isSettled && market.winningOptionId && (
          <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg backdrop-blur-sm group-hover:bg-green-500/20 transition-all duration-300">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">
                Winner: {market.options.find(o => o.id === market.winningOptionId)?.title}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
