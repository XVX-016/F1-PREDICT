import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy, Calendar, MapPin } from 'lucide-react';
import { getArchiveResults } from '../api/jolpica';

interface PastRaceResultsProps {
  className?: string;
}

// Placeholder interface
interface RaceResult2025 {
  [key: string]: any;
}


export default function PastRaceResults({ className = '' }: PastRaceResultsProps) {
  const [raceResults, setRaceResults] = useState<RaceResult2025[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log('🔍 PastRaceResults: Component rendered, loading:', loading, 'raceResults:', raceResults.length);

  useEffect(() => {
    const fetchRecentResults = async () => {
      try {
        setLoading(true);
        console.log('🔍 PastRaceResults: Fetching 2025 results from Jolpica...');

        // Fetch 2025 results
        const response = await getArchiveResults(2025);
        const races = response?.MRData?.RaceTable?.Races || [];

        const mappedResults: RaceResult2025[] = races.slice(0, 15).map((race: any) => ({
          round: parseInt(race.round),
          season: race.season,
          raceName: race.raceName,
          date: race.date,
          // Jolpica/Ergast structure for results
          poleDriverId: race.Results?.[0]?.grid === "1" ? race.Results[0].Driver.driverId : undefined, // Approximation if grid data missing
          podiumDriverIds: race.Results?.slice(0, 3).map((r: any) => r.Driver.driverId) || [],
          circuitName: race.Circuit.circuitName,
          country: race.Circuit.Location.country
        })).reverse(); // Show most recent first

        console.log(`🔍 PastRaceResults: Mapped ${mappedResults.length} races`);
        setRaceResults(mappedResults);

      } catch (error) {
        console.error('Failed to fetch 2025 race results:', error);
        setRaceResults([]); // Fail gracefully to empty
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResults();
  }, []);

  // Helper to normalize driver names if needed, or use the map
  const getDriverName = (driverId: string) => {
    // Basic normalization or lookup
    const driverMap: Record<string, string> = {
      'max_verstappen': 'Max Verstappen',
      'verstappen': 'Max Verstappen',
      'leclerc': 'Charles Leclerc',
      'hamilton': 'Lewis Hamilton',
      'norris': 'Lando Norris',
      'piastri': 'Oscar Piastri',
      'russell': 'George Russell',
      'sainz': 'Carlos Sainz',
      'alonso': 'Fernando Alonso',
      'gasly': 'Pierre Gasly',
      'ocon': 'Esteban Ocon',
      'tsunoda': 'Yuki Tsunoda',
      'stroll': 'Lance Stroll',
      'albon': 'Alexander Albon',
      'hulkenberg': 'Nico Hulkenberg',
      'bottas': 'Valtteri Bottas',
      'zhou': 'Guanyu Zhou',
      'magnussen': 'Kevin Magnussen',
      'ricciardo': 'Daniel Ricciardo',
      'lawson': 'Liam Lawson',
      'bearman': 'Oliver Bearman',
      'colapinto': 'Franco Colapinto',
      'hadjar': 'Isack Hadjar',
      'antonelli': 'Kimi Antonelli'
    };
    return driverMap[driverId] || driverId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };



  if (loading) {
    return (
      <div className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
              RECENT RACE RESULTS
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto rounded-full"></div>
            <p className="text-lg text-gray-300 mt-4">Loading race results...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl w-80 h-48 shadow-2xl shadow-black/50"></div>
          </div>
        </div>
      </div>
    );
  }

  if (raceResults.length === 0) {
    return (
      <div className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
              RECENT RACE RESULTS
            </h2>
            <div className="w-24 h-1 bg-red-500 mx-auto rounded-full"></div>
            <p className="text-lg text-gray-300 mt-4">Loading race results...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentRace = raceResults[currentIndex];

  return (
    <div className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
            RECENT RACE RESULTS
          </h2>
          <div className="w-24 h-1 bg-red-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-lg text-gray-300">Past Grand Prix results and podium finishers</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={prevRace}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white p-3 rounded-full border border-white/30 transition-all duration-200 hover:scale-110 hover:border-white/50 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextRace}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white p-3 rounded-full border border-white/30 transition-all duration-200 hover:scale-110 hover:border-white/50 shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Race Result Card */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mx-16 shadow-2xl shadow-black/50 hover:bg-black/40 hover:border-white/30 transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Race Info */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-600/20 rounded-xl border border-red-400/30">
                    <Trophy className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
                      {currentRace.raceName}
                    </h3>
                    <div className="flex items-center space-x-4 text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(currentRace.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{currentRace.circuitName || currentRace.country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pole Position */}
                {currentRace.poleDriverId && (
                  <div className="bg-yellow-600/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 shadow-lg hover:bg-yellow-600/30 transition-all duration-200">
                    <div className="text-yellow-400 font-semibold mb-2">🏁 POLE POSITION</div>
                    <div className="text-white font-bold text-lg">
                      {getDriverName(currentRace.poleDriverId)}
                    </div>
                  </div>
                )}

                {/* Race Winner */}
                {currentRace.podiumDriverIds[0] && (
                  <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 shadow-lg hover:from-yellow-600/30 hover:to-yellow-700/30 transition-all duration-200">
                    <div className="text-yellow-400 font-semibold mb-2">🥇 RACE WINNER</div>
                    <div className="text-white font-bold text-xl">
                      {getDriverName(currentRace.podiumDriverIds[0])}
                    </div>
                  </div>
                )}
              </div>

              {/* Podium */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white mb-4" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
                  PODIUM FINISHERS
                </h4>

                <div className="space-y-3">
                  {currentRace.podiumDriverIds.map((driverId, index) => {
                    if (!driverId) return null;

                    const position = index + 1;
                    const positionColors = ['from-yellow-500 to-yellow-600', 'from-gray-400 to-gray-500', 'from-orange-600 to-orange-700'];
                    const positionIcons = ['🥇', '🥈', '🥉'];

                    return (
                      <motion.div
                        key={driverId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-gradient-to-r ${positionColors[index]} backdrop-blur-sm border border-white/20 rounded-xl p-4 flex items-center justify-between shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{positionIcons[index]}</span>
                          <div>
                            <div className="text-white font-bold text-lg">
                              {getDriverName(driverId)}
                            </div>
                            <div className="text-white/80 text-sm">
                              P{position}
                            </div>
                          </div>
                        </div>
                        <div className="text-white/90 font-bold text-lg">
                          #{position}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Race Indicators */}
          <div className="flex justify-center space-x-3 mt-8">
            {raceResults.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 backdrop-blur-sm border ${index === currentIndex
                  ? 'bg-red-500 scale-125 border-red-400/50 shadow-lg shadow-red-500/30'
                  : 'bg-gray-600/60 hover:bg-gray-500/80 border-gray-500/30 hover:border-gray-400/50'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
