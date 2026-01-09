import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Trophy, Target, TrendingUp, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export default function AchievementSystem() {
  const achievements: Achievement[] = [
    {
      id: 'first-bet',
      title: 'First Bet',
      description: 'Place your first bet',
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      unlocked: true
    },
    {
      id: 'correct-podium',
      title: 'Correct Podium Predictor',
      description: 'Correctly predict the podium in 3 races',
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      unlocked: true
    },
    {
      id: 'winning-streak',
      title: 'Winning Streak',
      description: 'Win 5 bets in a row',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      unlocked: false,
      progress: 3,
      maxProgress: 5
    },
    {
      id: 'high-roller',
      title: 'High Roller',
      description: 'Place a bet worth 10,000 PC or more',
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      unlocked: false,
      progress: 2500,
      maxProgress: 10000
    },
    {
      id: 'fastest-lap-master',
      title: 'Fastest Lap Master',
      description: 'Correctly predict fastest lap 10 times',
      icon: Zap,
      color: 'from-red-500 to-red-600',
      unlocked: false,
      progress: 7,
      maxProgress: 10
    }
  ];

  return (
    <div className="bg-black/20 backdrop-blur-2xl border border-white/20 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Award className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Achievements</h2>
        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-yellow-500/30">
          {achievements.filter(a => a.unlocked).length}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group cursor-pointer transition-all duration-300 overflow-hidden`}
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${achievement.color} rounded-xl opacity-0 group-hover:opacity-5 transition-all duration-300`}></div>
              
              {/* Content */}
              <div className={`relative z-10 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                achievement.unlocked 
                  ? 'bg-white/10 border-white/20 group-hover:border-white/30' 
                  : 'bg-gray-800/50 border-gray-600/30 group-hover:border-gray-500/50'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${achievement.color} shadow-lg ${
                    achievement.unlocked ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      achievement.unlocked ? 'text-white' : 'text-gray-400'
                    }`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${
                      achievement.unlocked ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Unlocked Badge */}
                {achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
