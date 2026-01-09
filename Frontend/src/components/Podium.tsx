import React from 'react';
import { motion } from 'framer-motion';
import { DriverPrediction } from '../types/predictions';

interface PodiumProps {
  top3: DriverPrediction[];
}

export default function Podium({ top3 }: PodiumProps) {
  const heights = [0.8, 1.0, 0.7]; // 2nd, 1st, 3rd scale
  const order = [1, 0, 2]; // render middle (winner) last for emphasis

  const getTeamColor = (team: string) => {
    const teamColors: { [key: string]: string } = {
      'McLaren': 'from-orange-500 to-red-500',
      'Red Bull': 'from-blue-500 to-red-500',
      'Mercedes': 'from-green-500 to-blue-500',
      'Ferrari': 'from-red-500 to-yellow-500',
      'Aston Martin': 'from-green-500 to-emerald-500',
      'Alpine': 'from-blue-500 to-indigo-500',
      'Williams': 'from-blue-500 to-white',
      'Haas': 'from-gray-500 to-red-500',
      'Sauber': 'from-green-500 to-white',
      'Racing Bulls': 'from-blue-500 to-white'
    };
    return teamColors[team] || 'from-gray-500 to-gray-600';
  };

  const getPositionLabel = (index: number) => {
    switch (index) {
      case 1: return "1st";
      case 0: return "2nd";
      case 2: return "3rd";
      default: return "";
    }
  };

  const getPositionColor = (index: number) => {
    switch (index) {
      case 1: return "text-yellow-400 border-yellow-400";
      case 0: return "text-gray-300 border-gray-300";
      case 2: return "text-orange-400 border-orange-400";
      default: return "text-gray-400 border-gray-400";
    }
  };

  // Helper function to get driver ID safely
  const getDriverId = (driver: DriverPrediction): string => {
    if (driver.driverId) {
      return driver.driverId;
    }
    // Fallback: create driver ID from driver name
    return driver.driverName.toLowerCase().replace(/\s+/g, '');
  };

  // Helper function to get display name safely
  const getDisplayName = (driver: DriverPrediction): string => {
    if (driver.driverId) {
      return driver.driverId;
    }
    // Fallback: use first and last name initials
    const names = driver.driverName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return driver.driverName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="grid grid-cols-3 gap-4 items-end h-80">
      {[top3[1], top3[0], top3[2]].map((driver, i) => {
        const driverId = getDriverId(driver);
        const displayName = getDisplayName(driver);
        
        return (
          <motion.div
            key={driverId}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 140, 
              delay: i * 0.15,
              duration: 0.8
            }}
            className="bg-black/90 rounded-2xl p-4 relative flex flex-col justify-between border border-white/20"
            style={{ 
              transformOrigin: "bottom", 
              scale: heights[i],
              height: `${heights[i] * 100}%`
            }}
          >
            {/* Position label */}
            <div className={`absolute -top-3 right-3 text-sm bg-white/10 px-2 py-1 rounded-lg border ${getPositionColor(i)}`}>
              {getPositionLabel(i)}
            </div>
            
            {/* Driver info with cropped avatar */}
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2 overflow-hidden rounded-full">
                <img 
                  src={`/drivers/${driverId.toLowerCase()}.jpg`} 
                  alt={driver.driverName}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    // Fallback to team color if driver image not found
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const teamColor = getTeamColor(driver.team).split(' ')[1].replace('from-', 'bg-');
                    target.parentElement!.style.backgroundColor = teamColor;
                  }}
                />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{displayName}</div>
              <div className="text-sm text-white/90 font-medium">{driver.team}</div>
            </div>
            
            {/* Win probability */}
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {driver.winProbPct.toFixed(1)}%
              </div>
              <div className="text-xs text-white/80 font-medium">win chance</div>
            </div>
            
            {/* Confidence bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${driver.winProbPct}%` }}
                transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: "easeOut" }}
              />
            </div>
            
            {/* Driver name */}
            <div className="text-center text-sm font-medium text-white">
              {driver.driverName}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
