import { motion } from 'framer-motion';
import { DriverPrediction } from '../types/predictions';

interface DriverWinTableProps {
  drivers: DriverPrediction[];
}

export function DriverWinTable({ drivers }: DriverWinTableProps) {
  // Helper function to get unique key for each driver
  const getDriverKey = (driver: DriverPrediction, index: number): string => {
    if (driver.driverId) {
      return driver.driverId;
    }
    // Fallback: create key from driver name and index
    return `${driver.driverName.toLowerCase().replace(/\s+/g, '')}-${index}`;
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Driver Win Chances</h3>
        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-lg">Model v2</span>
      </div>
      <div className="max-h-64 overflow-auto divide-y divide-white/5">
        {drivers.map((driver, i) => (
          <motion.div
            key={getDriverKey(driver, i)}
            className="flex items-center justify-between py-3 hover:bg-white/5 px-2 rounded-lg transition-colors duration-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-right opacity-70 text-sm text-gray-300">{i + 1}</span>
              <div className="flex flex-col">
                <span className="font-medium text-white">{driver.driverName}</span>
                <span className="text-xs opacity-60 text-gray-400">{driver.team}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-semibold text-red-400 text-lg">{driver.winProbPct.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">win</div>
              </div>
              <div className="w-20 bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
                  style={{ width: `${driver.winProbPct}%` }}
                />
              </div>

            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


