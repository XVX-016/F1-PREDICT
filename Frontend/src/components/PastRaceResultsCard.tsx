import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Flag, Calendar } from 'lucide-react';
import GlassWrapper from './GlassWrapper';
// import { F1_2025_RESULTS } from '../data/f1-2025-results'; // Removed

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

import { getArchiveResults } from '../api/jolpica';

const PastRaceResultsCard: React.FC<PastRaceResultsCardProps> = ({ className = '' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [raceResults, setRaceResults] = React.useState<RaceResult[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        // Fetch 2025 results (or recent past seasons if 2025 empty, but assuming 2025 context)
        const response = await getArchiveResults(2025);
        const races = response?.MRData?.RaceTable?.Races || [];

        const mappedResults: RaceResult[] = races.map((race: any) => {
          const winner = race.Results?.[0];
          return {
            raceName: race.raceName,
            date: race.date,
            winner: winner?.Driver?.familyName || 'Unknown',
            team: winner?.Constructor?.name || 'Unknown',
            fastestLap: winner?.FastestLap?.Time?.time || 'N/A',
            polePosition: race.Results?.find((r: any) => r.grid === "1")?.Driver?.familyName || 'Unknown', // Approximate
            country: race.Circuit.Location.country,
            flag: '🏁', // Could map country to flag
            podium: race.Results?.slice(0, 3).map((r: any, idx: number) => ({
              position: idx + 1,
              driverName: r.Driver.familyName,
              constructorName: r.Constructor.name,
              time: r.Time?.time || r.status,
              gap: idx === 0 ? '-' : (r.Time?.time || r.status)
            })) || []
          };
        }).reverse();

        setRaceResults(mappedResults);
      } catch (err) {
        console.error('Failed to load past race results card:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {raceResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full min-h-[200px] border border-gray-700/50 rounded-lg bg-gray-800/30">
            <Calendar className="w-12 h-12 text-gray-500 mb-3 opacity-50" />
            <p className="text-gray-400 text-sm">No race results available for the 2025 season yet.</p>
          </div>
        ) : (
          raceResults.map((result, index) => (
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
                      <div key={posIndex} className={`flex items-center justify-between p-2 rounded ${posIndex === 0 ? 'bg-yellow-600/10 border border-yellow-500/20' :
                        posIndex === 1 ? 'bg-gray-600/10 border border-gray-500/20' :
                          'bg-orange-600/10 border border-orange-500/20'
                        }`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${posIndex === 0 ? 'bg-yellow-500 text-black' :
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
          ))
        )}
      </div>
    </GlassWrapper>
  );
};

export default PastRaceResultsCard;
