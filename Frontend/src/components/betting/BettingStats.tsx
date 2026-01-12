import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Coins,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { useBetting } from '../../contexts/BettingContext';

export default function BettingStats() {
  const { markets } = useBetting();
  const [stats, setStats] = useState({
    totalMarkets: 0,
    activeMarkets: 0,
    totalVolume: 0,
    totalUsers: 0,
    topMarkets: [],
    recentTransactions: []
  });

  useEffect(() => {
    loadStats();
    const id = setInterval(loadStats, 30000); // reduced refresh frequency to 30s
    return () => clearInterval(id);
  }, [markets]);

  const loadStats = async () => {
    try {
      // Try backend aggregated stats first
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // Standardized to 8000
      const resp = await fetch(`${baseUrl}/api/markets/stats`);
      if (resp.ok) {
        const data = await resp.json();
        setStats({
          totalMarkets: data.total_markets ?? 0,
          activeMarkets: data.active_markets ?? 0,
          totalVolume: data.total_volume ?? 0,
          totalUsers: data.total_users ?? 0,
          topMarkets: data.top_markets ?? [],
          recentTransactions: data.recent_transactions ?? []
        });
      }
    } catch (err) {
      console.warn('Failed to load betting stats from backend:', err);
      // Fallback: use current markets length if available
      if (markets && markets.length > 0) {
        setStats(prev => ({
          ...prev,
          totalMarkets: markets.length,
          activeMarkets: markets.filter(m => m.status === 'open').length
        }));
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statCards = [
    {
      title: 'Total Markets',
      value: formatNumber(stats.totalMarkets),
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      glowColor: 'shadow-blue-500/20'
    },
    {
      title: 'Active Markets',
      value: formatNumber(stats.activeMarkets),
      icon: Activity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      glowColor: 'shadow-green-500/20'
    },
    {
      title: 'Total Volume',
      value: formatCurrency(stats.totalVolume) + ' PC',
      icon: Coins,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      glowColor: 'shadow-yellow-500/20'
    },
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      glowColor: 'shadow-purple-500/20'
    }
  ];

  return (
    <div className="mb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`relative group cursor-pointer transition-all duration-500 overflow-hidden`}
            >
              {/* Glassmorphism background */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>

              {/* Animated background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>

              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-2xl ${stat.glowColor} blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>

              {/* Content */}
              <div className="relative z-10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                </div>

                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1 group-hover:text-gray-300 transition-colors duration-300">
                    {stat.title}
                  </h3>
                  <p className="text-white text-2xl font-bold group-hover:text-gray-100 transition-colors duration-300">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Top Markets */}
      {stats.topMarkets && stats.topMarkets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative group cursor-pointer transition-all duration-500 overflow-hidden"
        >
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>

          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl shadow-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

          {/* Content */}
          <div className="relative z-10 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="w-6 h-6 text-red-400 group-hover:text-red-300 transition-colors duration-300" />
              <h2 className="text-xl font-bold text-white group-hover:text-gray-100 transition-colors duration-300">Top Markets by Volume</h2>
            </div>

            <div className="space-y-4">
              {stats.topMarkets.slice(0, 5).map((market: any, index: number) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/10 backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-gray-100 transition-colors duration-300">{market.title}</h3>
                      <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">{market.raceName}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-bold group-hover:text-gray-100 transition-colors duration-300">
                      {formatCurrency(market.totalVolume)}
                    </div>
                    <div className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                      {market.totalBets} bets
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
