import React from 'react';
import GlassWrapper from './GlassWrapper';
import EnhancedPodium from './EnhancedPodium';

interface PodiumSectionProps {
  drivers: Array<{ driverId: string; position?: number; driverName?: string; team?: string; winProbPct?: number }>;
  customDrivers?: Array<{ driverId: string; position?: number; driverName?: string; team?: string; winProbPct?: number }>;
  comparisonMode?: 'ai' | 'custom' | 'compare';
  title?: string;
}

export default function PodiumSection({ drivers, customDrivers, comparisonMode = 'ai', title = 'PREDICTED PODIUM' }: PodiumSectionProps) {
  // Determine which drivers to show based on comparison mode
  const driversToShow = comparisonMode === 'custom' && customDrivers && customDrivers.length > 0 ? customDrivers : drivers;
  
  const ordered = [
    driversToShow.find(d => d.position === 2),
    driversToShow.find(d => d.position === 1),
    driversToShow.find(d => d.position === 3),
  ].filter(Boolean) as Array<{ driverId: string; position?: number; driverName?: string; team?: string; winProbPct?: number }>;

  // Calculate differences for comparison mode
  const getDifference = (driverId: string) => {
    if (comparisonMode !== 'compare' || !customDrivers || !drivers) return null;
    
    const aiDriver = drivers.find(d => d.driverId === driverId);
    const customDriver = customDrivers.find(d => d.driverId === driverId);
    
    if (!aiDriver || !customDriver) return null;
    
    return {
      ai: aiDriver.winProbPct || 0,
      custom: customDriver.winProbPct || 0,
      difference: (customDriver.winProbPct || 0) - (aiDriver.winProbPct || 0)
    };
  };

  return (
    <GlassWrapper accent className="p-5 mb-4 text-center h-full">
      <div className="flex items-center justify-center space-x-3 mb-5">
        <div className="p-2 bg-gray-800/20 rounded-xl border border-gray-600/30">
          {/* Trophy icon for consistent alignment */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400"><path d="M4 3h16v3a4 4 0 0 1-4 4h-2v2.126A5.002 5.002 0 0 1 17 17h1v2H6v-2h1a5.002 5.002 0 0 1 3-4.874V10H8A4 4 0 0 1 4 6V3zm2 3a2 2 0 0 0 2 2h2V5H6v1zm8 1a2 2 0 0 0 2-2V5h-4v2h2z"/></svg>
        </div>
        <h2 className="text-2xl" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>{title}</h2>
      </div>
      
      {/* Show comparison info if in compare mode */}
      {comparisonMode === 'compare' && customDrivers && customDrivers.length > 0 && (
        <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/10">
          <div className="text-sm text-gray-300 mb-2">AI vs Custom Differences</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {ordered.map((driver, index) => {
              const diff = getDifference(driver.driverId);
              if (!diff) return null;
              
              return (
                <div key={driver.driverId} className="text-center">
                  <div className="font-semibold text-gray-200">{driver.driverName?.split(' ')[0]}</div>
                  <div className={`font-bold ${diff.difference > 0 ? 'text-green-400' : diff.difference < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {diff.difference > 0 ? '+' : ''}{diff.difference.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <EnhancedPodium drivers={ordered as any} />
    </GlassWrapper>
  );
}


