import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useBetting } from '../../contexts/BettingContext';
import { BettingMarket, MarketOption } from '../../types/betting';

interface BetModalProps {
  isOpen: boolean;
  market: BettingMarket;
  onClose: () => void;
  onPlaceBet: () => void;
}

export default function BetModal({ isOpen, market, onClose, onPlaceBet }: BetModalProps) {
  const { currentUser, placeBet, loading, error, clearError } = useBetting();
  const [selectedOption, setSelectedOption] = useState<MarketOption | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [confirmBet, setConfirmBet] = useState(false);

  if (!currentUser) return null;

  const handlePlaceBet = async () => {
    if (!selectedOption || !betAmount || !confirmBet) return;
    
    clearError();
    
    try {
      await placeBet(market.id, selectedOption.id, parseInt(betAmount));
      onPlaceBet();
      resetForm();
    } catch (err) {
      // Error is handled by the context
    }
  };

  const resetForm = () => {
    setSelectedOption(null);
    setBetAmount('');
    setConfirmBet(false);
    clearError();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePotentialPayout = () => {
    if (!selectedOption || !betAmount) return 0;
    const amount = parseInt(betAmount);
    if (isNaN(amount)) return 0;
    return (amount / selectedOption.currentPrice) * 100;
  };

  const potentialPayout = calculatePotentialPayout();
  const enteredAmount = parseInt(betAmount || '0');
  const insufficientBalance = enteredAmount > currentUser.balance;
  const isValidBet = Boolean(selectedOption) && enteredAmount > 0 && !insufficientBalance;

  const nowTs = Date.now();
  const marketExpireTs = market.expiresAt ? new Date(market.expiresAt).getTime() : Number.POSITIVE_INFINITY;
  const marketRaceTs = market.raceDate ? new Date(market.raceDate).getTime() : Number.POSITIVE_INFINITY;
  const isMarketOpen = market.isActive && nowTs < marketExpireTs && nowTs < marketRaceTs;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 p-4 overflow-y-auto">
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
            className="relative bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-2xl shadow-2xl mx-auto my-8"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{market.title}</h2>
              <p className="text-gray-400">{market.description}</p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span>Race: {market.raceName}</span>
                <span>Volume: {formatCurrency(market.totalVolume)}</span>
                <span>Bets: {market.totalBets}</span>
              </div>
            </div>

            {/* Market status */}
            {!isMarketOpen && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-6 text-yellow-300">
                This market is closed. Betting is no longer available.
              </div>
            )}

            {/* User Balance */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Your Balance</span>
                </div>
                <span className="text-green-400 font-bold text-lg">
                  {formatCurrency(currentUser.balance)} PC
                </span>
              </div>
            </div>

            {/* Options Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Your Prediction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {market.options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => isMarketOpen && setSelectedOption(option)}
                    disabled={!isMarketOpen}
                    className={`p-4 rounded-xl border transition-all duration-200 text-left min-h-[88px] overflow-visible ${
                      selectedOption?.id === option.id
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{option.title}</span>
                      <span className="text-gray-400 font-medium">{option.currentPrice} PC</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Volume: {formatCurrency(option.totalVolume)}</span>
                      <span className="text-gray-400">{option.totalBets} bets</span>
                    </div>
                    {option.isWinning && (
                      <div className="flex items-center space-x-1 mt-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Winner</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Bet Amount */}
            {selectedOption && isMarketOpen && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Place Your Bet</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bet Amount (PC)
                    </label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      max={currentUser.balance}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200"
                    />
                    {insufficientBalance && (
                      <div className="mt-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2" role="alert" aria-live="polite">
                        Not enough balance. Available: {formatCurrency(currentUser.balance)} PC
                      </div>
                    )}
                  </div>

                  {/* Potential Payout */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        <span className="text-gray-300">Potential Payout</span>
                      </div>
                      <span className="text-blue-400 font-bold text-lg">
                        {formatCurrency(potentialPayout)} PC
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      If "{selectedOption.title}" wins, you'll receive {formatCurrency(potentialPayout)} PC
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="confirm-bet"
                      checked={confirmBet}
                      onChange={(e) => setConfirmBet(e.target.checked)}
                      className="w-4 h-4 text-red-600 bg-black/50 border-white/20 rounded focus:ring-red-500/50 focus:ring-2"
                    />
                    <label htmlFor="confirm-bet" className="text-sm text-gray-300">
                      I confirm that I want to place this bet
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className="text-red-400 text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              
              <button
                onClick={handlePlaceBet}
                disabled={!isMarketOpen || !isValidBet || loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Placing Bet...</span>
                  </div>
                ) : (
                  <span>Place Bet</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
