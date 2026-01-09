import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Coins, Calculator, CheckCircle, AlertCircle } from 'lucide-react';
import { useBetting } from '../../contexts/BettingContext';

interface BetslipSidebarProps {
  isOpen: boolean;
  bets: any[];
  onClose: () => void;
  onConfirmBets: () => void;
}

export default function BetslipSidebar({ isOpen, bets, onClose, onConfirmBets }: BetslipSidebarProps) {
  const { currentUser } = useBetting();
  const [betAmounts, setBetAmounts] = useState<{ [key: string]: number }>({});

  const calculateTotalStake = () => {
    return Object.values(betAmounts).reduce((sum, amount) => sum + (amount || 0), 0);
  };

  const calculatePotentialPayout = () => {
    return bets.reduce((total, bet) => {
      const amount = betAmounts[bet.id] || 0;
      const odds = bet.odds || 2.0; // Default odds
      return total + (amount * odds);
    }, 0);
  };

  const handleBetAmountChange = (betId: string, amount: number) => {
    setBetAmounts(prev => ({
      ...prev,
      [betId]: amount
    }));
  };

  const handleConfirmBets = () => {
    // TODO: Implement bet confirmation logic
    onConfirmBets();
  };

  const totalStake = calculateTotalStake();
  const potentialPayout = calculatePotentialPayout();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-black/90 backdrop-blur-xl border-l border-white/20 shadow-2xl z-50"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Betslip</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Bets List */}
              <div className="flex-1 overflow-y-auto p-6">
                {bets.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">No bets selected</h3>
                    <p className="text-gray-500">Add some bets to your betslip to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bets.map((bet) => (
                      <div
                        key={bet.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-semibold">{bet.title}</h4>
                          <span className="text-green-400 font-bold">{bet.odds || 2.0}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{bet.description}</p>
                        
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            placeholder="Bet amount"
                            value={betAmounts[bet.id] || ''}
                            onChange={(e) => handleBetAmountChange(bet.id, parseFloat(e.target.value) || 0)}
                            className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                          />
                          <span className="text-gray-400 text-sm">PC</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 p-6">
                {bets.length > 0 && (
                  <>
                    {/* Summary */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-300">
                        <span>Total Stake:</span>
                        <span className="font-semibold">{totalStake.toFixed(0)} PC</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Potential Payout:</span>
                        <span className="font-semibold text-green-400">{potentialPayout.toFixed(0)} PC</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Profit:</span>
                        <span className={`font-semibold ${potentialPayout - totalStake >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(potentialPayout - totalStake).toFixed(0)} PC
                        </span>
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmBets}
                      disabled={totalStake === 0 || !currentUser}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:shadow-none"
                    >
                      <CheckCircle className="inline-block w-5 h-5 mr-2" />
                      Confirm Bets ({bets.length})
                    </motion.button>
                  </>
                )}

                {!currentUser && (
                  <div className="text-center py-4">
                    <AlertCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-yellow-400 text-sm">Please log in to place bets</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
