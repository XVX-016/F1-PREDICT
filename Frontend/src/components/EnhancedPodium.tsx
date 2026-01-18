import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';

interface Driver {
  driverId: string;
  driverName: string;
  team: string;
  winProbPct: number;
  podiumProbPct: number;
  position: number;
}

interface EnhancedPodiumProps {
  drivers: Driver[];
  className?: string;
}

export default function EnhancedPodium({ drivers, className = '' }: EnhancedPodiumProps) {
  // Desired layout: 2 - 1 - 3
  const layoutOrder = [2, 1, 3];
  const podiumConfig: Record<number, { height: string; bgColor: string; borderColor: string; icon: any; iconColor: string }> = {
    1: { height: 'h-60', bgColor: 'bg-gradient-to-b from-yellow-400 to-yellow-600', borderColor: 'border-yellow-300', icon: Trophy, iconColor: 'text-yellow-800' },
    2: { height: 'h-56', bgColor: 'bg-gradient-to-b from-gray-300 to-gray-500', borderColor: 'border-gray-200', icon: Medal, iconColor: 'text-gray-700' },
    3: { height: 'h-52', bgColor: 'bg-gradient-to-b from-orange-400 to-orange-600', borderColor: 'border-orange-300', icon: Star, iconColor: 'text-orange-800' }
  };

  // Build a safe avatar filename strictly from driver name
  const getAvatarSrc = (driverName: string) => {
    const normalized = driverName
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, '');
    const candidate = `/avatars/${normalized}.png`;
    return candidate;
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-end justify-center gap-6 sm:gap-8">
        {layoutOrder.map((pos, index) => {
          const driver = drivers.find(d => d.position === pos);
          if (!driver) return null;
          const podium = podiumConfig[pos];
          const Icon = podium.icon;
          const candidate = getAvatarSrc(driver.driverName);
          return (
            <motion.div
              key={pos}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex flex-col items-center"
            >
              <div className={`${podium.height} w-28 sm:w-32 md:w-36 ${podium.bgColor} rounded-t-3xl border-2 ${podium.borderColor} shadow-2xl relative overflow-hidden`}>
                {/* Position symbol 2 | 1 | 3 */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg select-none">{pos}</div>
                {/* Center icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${podium.iconColor} drop-shadow-lg`} />
                </div>
                {/* Removed name/team from inside podium - only position and icon remain */}
              </div>
              {/* Avatar below bar - lowered position */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full shadow-lg bg-gray-800 flex items-center justify-center mb-8 mt-8 overflow-hidden"
                style={{ clipPath: 'circle(50% at 50% 50%)' }}>
                <img
                  src={candidate}
                  alt={driver.driverName}
                  className="w-full h-full object-cover object-top"
                  style={{ objectPosition: 'center top' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              {/* Stats under avatar */}
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 truncate max-w-[12rem] mx-auto" title={driver.driverName}>{driver.driverName}</h3>
                <p className="text-white/90 text-xs sm:text-sm mb-2 truncate max-w-[12rem] mx-auto font-medium" title={driver.team}>{driver.team}</p>
                <div className="flex items-center justify-center gap-6">
                  <div className="min-w-[4.5rem]">
                    <div className="text-white font-extrabold text-sm sm:text-base drop-shadow-lg">{driver.winProbPct.toFixed(1)}%</div>
                    <div className="text-[10px] sm:text-xs text-white/80 font-medium">Win Probability</div>
                  </div>
                  <div className="min-w-[4.5rem]">
                    <div className="text-white font-extrabold text-sm sm:text-base drop-shadow-lg">{driver.podiumProbPct.toFixed(1)}%</div>
                    <div className="text-[10px] sm:text-xs text-white/80 font-medium">Podium Chance</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
