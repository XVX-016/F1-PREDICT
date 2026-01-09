import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Flag, Calendar } from 'lucide-react';
import GlassWrapper from './GlassWrapper';
import { F1_2025_RESULTS } from '../data/f1-2025-results';

interface RaceResult {
  raceName: string;
  date: string;
  winner: string;
  team: string;
  fastestLap: string;
  polePosition: string;
  country: string;
  flag: string;
  podium: Array<{
    position: number;
    driverName: string;
    constructorName: string;
    time: string;
    gap: string;
  }>;
}

interface PastRaceResultsCardProps {
  className?: string;
}

const PastRaceResultsCard: React.FC<PastRaceResultsCardProps> = ({ className = '' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get race results from F1_2025_RESULTS data, up to Italian GP
  const getRaceResults = (): RaceResult[] => {
    const raceOrder = [
      'Australian Grand Prix',
      'Chinese Grand Prix', 
      'Japanese Grand Prix',
      'Bahrain Grand Prix',
      'Saudi Arabian Grand Prix',
      'Miami Grand Prix',
      'Emilia Romagna Grand Prix',
      'Monaco Grand Prix',
      'Spanish Grand Prix',
      'Canadian Grand Prix',
      'Austrian Grand Prix',
      'British Grand Prix',
      'Belgian Grand Prix',
      'Hungarian Grand Prix',
      'Dutch Grand Prix',
      'Italian Grand Prix'
    ];

    const countryFlags: Record<string, string> = {
      'Australian Grand Prix': '🇦🇺',
      'Chinese Grand Prix': '🇨🇳',
      'Japanese Grand Prix': '🇯🇵',
      'Bahrain Grand Prix': '🇧🇭',
      'Saudi Arabian Grand Prix': '🇸🇦',
      'Miami Grand Prix': '🇺🇸',
      'Emilia Romagna Grand Prix': '🇮🇹',
      'Monaco Grand Prix': '🇲🇨',
      'Spanish Grand Prix': '🇪🇸',
      'Canadian Grand Prix': '🇨🇦',
      'Austrian Grand Prix': '🇦🇹',
      'British Grand Prix': '🇬🇧',
      'Belgian Grand Prix': '🇧🇪',
      'Hungarian Grand Prix': '🇭🇺',
      'Dutch Grand Prix': '🇳🇱',
      'Italian Grand Prix': '🇮🇹'
    };

    const raceDates: Record<string, string> = {
      'Australian Grand Prix': '2025-03-16',
      'Chinese Grand Prix': '2025-03-23',
      'Japanese Grand Prix': '2025-04-06',
      'Bahrain Grand Prix': '2025-04-13',
      'Saudi Arabian Grand Prix': '2025-04-20',
      'Miami Grand Prix': '2025-05-05',
      'Emilia Romagna Grand Prix': '2025-05-18',
      'Monaco Grand Prix': '2025-05-25',
      'Spanish Grand Prix': '2025-06-01',
      'Canadian Grand Prix': '2025-06-15',
      'Austrian Grand Prix': '2025-06-29',
      'British Grand Prix': '2025-07-06',
      'Belgian Grand Prix': '2025-07-27',
      'Hungarian Grand Prix': '2025-08-03',
      'Dutch Grand Prix': '2025-08-31',
      'Italian Grand Prix': '2025-09-07'
    };

    return raceOrder.map(raceName => {
      const results = F1_2025_RESULTS[raceName];
      if (!results || results.length === 0) {
        return {
          raceName: raceName.replace(' Grand Prix', ' GP'),
          date: raceDates[raceName] || 'TBD',
          winner: 'TBD',
          team: 'TBD',
          fastestLap: 'TBD',
          polePosition: 'TBD',
          country: raceName.split(' ')[0],
          flag: countryFlags[raceName] || '🏁',
          podium: []
        };
      }

      const winner = results[0];
      const fastestLapDriver = results.find(r => r.fastestLap) || results[0];
      const poleDriver = results.find(r => r.grid === 1) || results[0];

      return {
        raceName: raceName.replace(' Grand Prix', ' GP'),
        date: raceDates[raceName] || 'TBD',
        winner: winner.driverName,
        team: winner.constructorName,
        fastestLap: fastestLapDriver.driverName,
        polePosition: poleDriver.driverName,
        country: raceName.split(' ')[0],
        flag: countryFlags[raceName] || '🏁',
        podium: results.slice(0, 3)
      };
    });
  };

  const raceResults = getRaceResults();

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320, // Width of one card + gap
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320, // Width of one card + gap
        behavior: 'smooth'
      });
    }
  };

  const f1FontStyle = {
    fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif',
    fontWeight: '900',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const
  };

  return (
    <GlassWrapper className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-800/20 rounded-lg border border-gray-600/30">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <h2 className="text-2xl text-white" style={f1FontStyle}>PAST RACE RESULTS</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-lg bg-gray-800/50 border border-gray-600/30 hover:bg-gray-700/50 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <span className="text-sm text-gray-400 px-2">
            {raceResults.length} Races
          </span>
          <button
            onClick={scrollRight}
            className="p-2 rounded-lg bg-gray-800/50 border border-gray-600/30 hover:bg-gray-700/50 transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Horizontal scrolling container */}
      <div 
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
      >
        {raceResults.map((result, index) => (
          <div 
            key={`${result.raceName}-${index}`} 
            className="flex-shrink-0 w-80 bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 hover:border-yellow-500/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{result.flag}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">{result.raceName}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {result.date}
                  </p>
                </div>
              </div>
              <Flag className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {/* Winner */}
              <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-400/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400">WINNER</span>
                </div>
                <p className="text-white font-bold text-sm">{result.winner}</p>
                <p className="text-gray-400 text-xs">{result.team}</p>
              </div>

              {/* Podium */}
              {result.podium.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">PODIUM</h4>
                  {result.podium.map((driver, posIndex) => (
                    <div key={posIndex} className={`flex items-center justify-between p-2 rounded ${
                      posIndex === 0 ? 'bg-yellow-600/10 border border-yellow-500/20' :
                      posIndex === 1 ? 'bg-gray-600/10 border border-gray-500/20' :
                      'bg-orange-600/10 border border-orange-500/20'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          posIndex === 0 ? 'bg-yellow-500 text-black' :
                          posIndex === 1 ? 'bg-gray-400 text-black' :
                          'bg-orange-500 text-black'
                        }`}>
                          {posIndex + 1}
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">{driver.driverName}</p>
                          <p className="text-gray-400 text-xs">{driver.constructorName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-300 text-xs">{driver.gap}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-700/30 rounded p-2">
                  <p className="text-gray-400 mb-1">Pole Position</p>
                  <p className="text-white font-semibold">{result.polePosition}</p>
                </div>
                <div className="bg-gray-700/30 rounded p-2">
                  <p className="text-gray-400 mb-1">Fastest Lap</p>
                  <p className="text-white font-semibold">{result.fastestLap}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassWrapper>
  );
};

export default PastRaceResultsCard;
