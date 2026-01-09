import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassWrapper from './GlassWrapper';

interface DriverItem { driverId: string; position: number; driverName: string; team: string; winProbPct: number }
interface DriverListProps {
  drivers: DriverItem[];
  aiDrivers?: DriverItem[];
  customDrivers?: DriverItem[];
  enableCompareToggle?: boolean;
  comparisonMode?: 'ai' | 'custom' | 'compare';
  onComparisonModeChange?: (mode: 'ai' | 'custom' | 'compare') => void;
}

export default function DriverList({ drivers, aiDrivers, customDrivers, enableCompareToggle = false, comparisonMode = 'ai', onComparisonModeChange }: DriverListProps) {
  const [compare, setCompare] = useState(false);
  
  // Filter drivers to only include those with available avatars
  const availableAvatars = [
    'alexanderalbon', 'andreakimiantonelli', 'carlossainz', 'charlesleclerc',
    'estebanocon', 'fernandoalonso', 'francocolapinto', 'gabrielbortoleto',
    'georgerussell', 'isackhadjar', 'jackdoohan', 'kimiantonelli',
    'lancestroll', 'landonorris', 'lewishamilton', 'liamlawson',
    'maxverstappen', 'nicohulkenberg', 'oliverbearman', 'oscarpiastri',
    'pierregasly', 'yukitsunoda'
  ];
  
  const filterDriversWithAvatars = (driverList: DriverItem[]) => {
    return driverList.filter(driver => {
      const driverKey = driver.driverName.toLowerCase().replace(/\s+/g, '');
      return availableAvatars.includes(driverKey);
    });
  };
  
  const filteredDrivers = filterDriversWithAvatars(drivers);
  const filteredAiDrivers = aiDrivers ? filterDriversWithAvatars(aiDrivers) : undefined;
  const filteredCustomDrivers = customDrivers ? filterDriversWithAvatars(customDrivers) : undefined;
  
  // Determine which drivers to show based on comparison mode
  const listToShow: DriverItem[] = (() => {
    if (comparisonMode === 'custom' && filteredCustomDrivers && filteredCustomDrivers.length > 0) {
      return filteredCustomDrivers;
    }
    return filteredDrivers;
  })();
  
  // Calculate differences for comparison display
  const getDriverDifference = (driverId: string) => {
    if (comparisonMode !== 'compare' || !filteredAiDrivers || !filteredCustomDrivers) return null;
    
    const aiDriver = filteredAiDrivers.find(d => d.driverId === driverId);
    const customDriver = filteredCustomDrivers.find(d => d.driverId === driverId);
    
    if (!aiDriver || !customDriver) return null;
    
    return {
      ai: aiDriver.winProbPct,
      custom: customDriver.winProbPct,
      difference: customDriver.winProbPct - aiDriver.winProbPct
    };
  };
  
  // Helper function to get the correct avatar filename
  const getAvatarFilename = (driverName: string, driverId: string) => {
    const nameMapping: Record<string, string> = {
      'Max Verstappen': 'maxverstappen',
      'Charles Leclerc': 'charlesleclerc',
      'Lewis Hamilton': 'lewishamilton',
      'Lando Norris': 'landonorris',
      'Oscar Piastri': 'oscarpiastri',
      'George Russell': 'georgerussell',
      'Carlos Sainz': 'carlossainz',
      'Fernando Alonso': 'fernandoalonso',
      'Yuki Tsunoda': 'yukitsunoda',
      'Andrea Kimi Antonelli': 'andreakimiantonelli',
      'Kimi Antonelli': 'kimiantonelli',
      'Lance Stroll': 'lancestroll',
      'Pierre Gasly': 'pierregasly',
      'Esteban Ocon': 'estebanocon',
      'Franco Colapinto': 'francocolapinto',
      'Alexander Albon': 'alexanderalbon',
      'Nico Hulkenberg': 'nicohulkenberg',
      'Liam Lawson': 'liamlawson',
      'Isack Hadjar': 'isackhadjar',
      'Oliver Bearman': 'oliverbearman',
      'Gabriel Bortoleto': 'gabrielbortoleto',
      'Jack Doohan': 'jackdoohan'
    };
    
    return nameMapping[driverName] || driverId.toLowerCase();
  };
  
  // Debug: Log driver data to see what's being received
  console.log('🔍 DriverList received drivers:', drivers);
  console.log('🔍 DriverList teams:', drivers.map(d => `${d.driverName}: ${d.team}`));
  console.log('🔍 DriverList IDs:', drivers.map(d => `${d.driverName}: ${d.driverId}`));
  console.log('🔍 Avatar filenames:', drivers.map(d => `${d.driverName}: ${getAvatarFilename(d.driverName, d.driverId)}.png`));
  console.log('🔍 Filtered drivers with avatars:', filteredDrivers.length);
  console.log('🔍 Filtered driver names:', filteredDrivers.map(d => d.driverName));
  
  return (
    <GlassWrapper className="p-8 mb-12">
      <div className="flex items-center justify-center space-x-3 mb-6">
        <span className="w-8 h-8 flex items-center justify-center">👥</span>
        <h3 className="text-3xl text-center" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
          {comparisonMode === 'compare' ? 'AI vs CUSTOM COMPARISON' : 
           comparisonMode === 'custom' ? 'CUSTOM PREDICTIONS' : 
           '2025 DRIVER PREDICTIONS'}
        </h3>
      </div>
      

              <div className="max-h-96 space-y-3 pr-2 overflow-y-auto custom-scrollbar">
          {listToShow.map((driver, index) => (
          <motion.div
            key={driver.driverId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm rounded-xl hover:bg-black/60 transition-colors border border-white/10"
          >
            <div className="flex items-center space-x-4">
              <span className="text-xl font-bold text-gray-400">#{driver.position}</span>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-gray-800 flex items-center justify-center relative">
                  <img
                    src={`/avatars/${getAvatarFilename(driver.driverName, driver.driverId)}.png`}
                    alt={driver.driverName}
                    className="w-full h-full object-cover object-top"
                    onLoad={() => {
                      console.log(`✅ Image loaded successfully for ${driver.driverName}: /avatars/${getAvatarFilename(driver.driverName, driver.driverId)}.png`);
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log(`❌ Image failed to load for ${driver.driverName}: ${target.src}`);
                      // Try alternative path
                      const altPath = `/avatars/${driver.driverName.toLowerCase().replace(/\s+/g, '')}.png`;
                      console.log(`🔄 Trying alternative path: ${altPath}`);
                      target.src = altPath;
                      target.onerror = () => {
                        console.log(`❌ Alternative path also failed for ${driver.driverName}`);
                        target.style.display = 'none';
                        // Show driver initials as fallback
                        const fallback = target.parentElement?.querySelector('.driver-initials') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      };
                    }}
                  />
                  <div className="driver-initials hidden absolute inset-0 items-center justify-center text-white font-bold text-sm bg-gray-700 rounded-full">
                    {driver.driverName.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg">{driver.driverName}</div>
                  <div className="text-gray-400">{driver.team}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              {comparisonMode === 'compare' ? (
                (() => {
                  const diff = getDriverDifference(driver.driverId);
                  if (!diff) {
                    return (
                      <>
                        <div className="font-bold text-gray-300 text-xl">{driver.winProbPct.toFixed(2)}%</div>
                        <div className="text-sm text-gray-400">Win Probability</div>
                      </>
                    );
                  }
                  
                  return (
                    <div className="space-y-1">
                      <div className="font-bold text-gray-300 text-lg">{driver.winProbPct.toFixed(2)}%</div>
                      <div className={`text-sm font-semibold ${diff.difference > 0 ? 'text-green-400' : diff.difference < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {diff.difference > 0 ? '+' : ''}{diff.difference.toFixed(1)}% vs AI
                      </div>
                      <div className="text-xs text-gray-500">
                        AI: {diff.ai.toFixed(1)}% | Custom: {diff.custom.toFixed(1)}%
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="font-bold text-gray-300 text-xl">{driver.winProbPct.toFixed(2)}%</div>
                  <div className="text-sm text-gray-400">Win Probability</div>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </GlassWrapper>
  );
}


