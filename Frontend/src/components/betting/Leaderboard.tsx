import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, Users, Star } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  username: string;
  totalWinnings: number;
  totalBets: number;
  winRate: number;
  rank: number;
  avatar?: string;
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'race' | 'season'>('race');

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockData: LeaderboardEntry[] = [
      {
        id: '1',
        username: 'MaxVerstappen',
        totalWinnings: 25000,
        totalBets: 45,
        winRate: 68.9,
        rank: 1
      },
      {
        id: '2',
        username: 'LewisHamilton',
        totalWinnings: 22000,
        totalBets: 52,
        winRate: 65.4,
        rank: 2
      },
      {
        id: '3',
        username: 'CharlesLeclerc',
        totalWinnings: 19500,
        totalBets: 38,
        winRate: 71.1,
        rank: 3
      },
      {
        id: '4',
        username: 'LandoNorris',
        totalWinnings: 18000,
        totalBets: 41,
        winRate: 63.4,
        rank: 4
      },
      {
        id: '5',
        username: 'CarlosSainz',
        totalWinnings: 16500,
        totalBets: 35,
        winRate: 66.7,
        rank: 5
      }
    ];

    setLeaderboardData(mockData);
  }, [timeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-gray-400 font-bold">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-2xl border border-white/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTimeframe('race')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              timeframe === 'race'
                ? 'bg-red-600/80 text-white shadow-lg shadow-red-500/25'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            This Race
          </button>
          <button
            onClick={() => setTimeframe('season')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              timeframe === 'season'
                ? 'bg-red-600/80 text-white shadow-lg shadow-red-500/25'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Season
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboardData.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center space-x-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${getRankColor(entry.rank)}`}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-8 h-8">
              {getRankIcon(entry.rank)}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {entry.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold">{entry.username}</div>
                  <div className="text-gray-400 text-sm">
                    {entry.totalBets} bets • {entry.winRate.toFixed(1)}% win rate
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="text-green-400 font-bold text-lg">
                {formatCurrency(entry.totalWinnings)} PC
              </div>
              <div className="text-gray-400 text-sm">
                +{formatCurrency(entry.totalWinnings * 0.1)} this week
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">Leaderboard updates every 5 minutes</span>
        </div>
      </div>
    </div>
  );
}
