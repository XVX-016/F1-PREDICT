import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy, Calendar, MapPin } from 'lucide-react';
import RaceResults2025Service, { RaceResult2025 } from '../services/2025RaceResultsService';

interface PastRaceResultsProps {
  className?: string;
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
        console.log('🔍 PastRaceResults: Starting to fetch 2025 race results...');
        
        const service = RaceResults2025Service.getInstance();
        const results = await service.get2025RaceResults();
        
        console.log('🔍 PastRaceResults: Received results:', results);
        console.log('🔍 PastRaceResults: Results count:', results.length);
        
        // Take all available races (up to 15 races)
        const recentResults = results.slice(0, 15);
        console.log('🔍 PastRaceResults: Recent results:', recentResults);
        setRaceResults(recentResults);
      } catch (error) {
        console.warn('Failed to fetch 2025 race results:', error);
        
        // Fallback to sample data for 2025 season
        const sampleResults: RaceResult2025[] = [
          {
            round: 1,
            season: '2025',
            raceName: 'Australian Grand Prix',
            date: '2025-03-16',
            poleDriverId: 'landonorris',
            podiumDriverIds: ['landonorris', 'maxverstappen', 'georgerussell'],
            circuitName: 'Albert Park Circuit',
            country: 'Australia'
          },
          {
            round: 2,
            season: '2025',
            raceName: 'Chinese Grand Prix',
            date: '2025-03-23',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'landonorris', 'georgerussell'],
            circuitName: 'Shanghai International Circuit',
            country: 'China'
          },
          {
            round: 3,
            season: '2025',
            raceName: 'Japanese Grand Prix',
            date: '2025-04-06',
            poleDriverId: 'maxverstappen',
            podiumDriverIds: ['maxverstappen', 'landonorris', 'oscarpiastri'],
            circuitName: 'Suzuka International Racing Course',
            country: 'Japan'
          },
          {
            round: 4,
            season: '2025',
            raceName: 'Bahrain Grand Prix',
            date: '2025-03-02',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'georgerussell', 'landonorris'],
            circuitName: 'Bahrain International Circuit',
            country: 'Bahrain'
          },
          {
            round: 5,
            season: '2025',
            raceName: 'Saudi Arabian Grand Prix',
            date: '2025-03-09',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'maxverstappen', 'charlesleclerc'],
            circuitName: 'Jeddah Corniche Circuit',
            country: 'Saudi Arabia'
          },
          {
            round: 6,
            season: '2025',
            raceName: 'Miami Grand Prix',
            date: '2025-05-04',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'landonorris', 'georgerussell'],
            circuitName: 'Miami International Autodrome',
            country: 'USA'
          },
          {
            round: 7,
            season: '2025',
            raceName: 'Emilia Romagna Grand Prix',
            date: '2025-05-18',
            poleDriverId: 'maxverstappen',
            podiumDriverIds: ['maxverstappen', 'landonorris', 'oscarpiastri'],
            circuitName: 'Autodromo Enzo e Dino Ferrari',
            country: 'Italy'
          },
          {
            round: 8,
            season: '2025',
            raceName: 'Monaco Grand Prix',
            date: '2025-05-25',
            poleDriverId: 'landonorris',
            podiumDriverIds: ['landonorris', 'charlesleclerc', 'oscarpiastri'],
            circuitName: 'Circuit de Monaco',
            country: 'Monaco'
          },
          {
            round: 9,
            season: '2025',
            raceName: 'Spanish Grand Prix',
            date: '2025-06-01',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'landonorris', 'charlesleclerc'],
            circuitName: 'Circuit de Barcelona-Catalunya',
            country: 'Spain'
          },
          {
            round: 10,
            season: '2025',
            raceName: 'Canadian Grand Prix',
            date: '2025-06-15',
            poleDriverId: 'georgerussell',
            podiumDriverIds: ['georgerussell', 'maxverstappen', 'andreakimiantonelli'],
            circuitName: 'Circuit Gilles Villeneuve',
            country: 'Canada'
          },
          {
            round: 11,
            season: '2025',
            raceName: 'Austrian Grand Prix',
            date: '2025-06-29',
            poleDriverId: 'landonorris',
            podiumDriverIds: ['landonorris', 'oscarpiastri', 'charlesleclerc'],
            circuitName: 'Red Bull Ring',
            country: 'Austria'
          },
          {
            round: 12,
            season: '2025',
            raceName: 'British Grand Prix',
            date: '2025-07-13',
            poleDriverId: 'landonorris',
            podiumDriverIds: ['landonorris', 'oscarpiastri', 'nicohulkenberg'],
            circuitName: 'Silverstone Circuit',
            country: 'United Kingdom'
          },
          {
            round: 13,
            season: '2025',
            raceName: 'Belgian Grand Prix',
            date: '2025-08-03',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'landonorris', 'charlesleclerc'],
            circuitName: 'Circuit de Spa-Francorchamps',
            country: 'Belgium'
          },
          {
            round: 14,
            season: '2025',
            raceName: 'Hungarian Grand Prix',
            date: '2025-07-27',
            poleDriverId: 'landonorris',
            podiumDriverIds: ['landonorris', 'oscarpiastri', 'georgerussell'],
            circuitName: 'Hungaroring',
            country: 'Hungary'
          },
          {
            round: 15,
            season: '2025',
            raceName: 'Dutch Grand Prix',
            date: '2025-08-24',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'maxverstappen', 'isackhadjar'],
            circuitName: 'Circuit Zandvoort',
            country: 'Netherlands'
          }
        ];
        
        setRaceResults(sampleResults);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResults();
  }, []);

  // Ensure we always have some data to display
  useEffect(() => {
    if (!loading && raceResults.length === 0) {
      console.log('🔍 PastRaceResults: No data available, using fallback sample data');
      const fallbackResults: RaceResult2025[] = [
        {
          round: 1,
          season: '2025',
          raceName: 'Australian Grand Prix',
          date: '2025-03-16',
          poleDriverId: 'landonorris',
          podiumDriverIds: ['landonorris', 'maxverstappen', 'georgerussell'],
          circuitName: 'Albert Park Circuit',
          country: 'Australia'
        },
        {
          round: 2,
          season: '2025',
          raceName: 'Chinese Grand Prix',
          date: '2025-03-23',
          poleDriverId: 'oscarpiastri',
          podiumDriverIds: ['oscarpiastri', 'landonorris', 'georgerussell'],
          circuitName: 'Shanghai International Circuit',
          country: 'China'
        },
        {
          round: 3,
          season: '2025',
          raceName: 'Japanese Grand Prix',
          date: '2025-04-06',
          poleDriverId: 'maxverstappen',
          podiumDriverIds: ['maxverstappen', 'landonorris', 'oscarpiastri'],
          circuitName: 'Suzuka International Racing Course',
          country: 'Japan'
        },
        {
          round: 4,
          season: '2025',
          raceName: 'Bahrain Grand Prix',
          date: '2025-03-02',
          poleDriverId: 'oscarpiastri',
          podiumDriverIds: ['oscarpiastri', 'georgerussell', 'landonorris'],
          circuitName: 'Bahrain International Circuit',
          country: 'Bahrain'
        },
        {
          round: 5,
          season: '2025',
          raceName: 'Saudi Arabian Grand Prix',
          date: '2025-03-09',
          poleDriverId: 'oscarpiastri',
          podiumDriverIds: ['oscarpiastri', 'maxverstappen', 'charlesleclerc'],
          circuitName: 'Jeddah Corniche Circuit',
          country: 'Saudi Arabia'
        },
        {
          round: 6,
          season: '2025',
          raceName: 'Miami Grand Prix',
          date: '2025-05-04',
          poleDriverId: 'oscarpiastri',
          podiumDriverIds: ['oscarpiastri', 'landonorris', 'georgerussell'],
          circuitName: 'Miami International Autodrome',
          country: 'USA'
        },
        {
          round: 7,
          season: '2025',
          raceName: 'Emilia Romagna Grand Prix',
          date: '2025-05-18',
          poleDriverId: 'maxverstappen',
          podiumDriverIds: ['maxverstappen', 'landonorris', 'oscarpiastri'],
          circuitName: 'Autodromo Enzo e Dino Ferrari',
          country: 'Italy'
        },
        {
          round: 8,
          season: '2025',
          raceName: 'Monaco Grand Prix',
          date: '2025-05-25',
          poleDriverId: 'landonorris',
          podiumDriverIds: ['landonorris', 'charlesleclerc', 'oscarpiastri'],
          circuitName: 'Circuit de Monaco',
          country: 'Monaco'
        },
        {
          round: 9,
          season: '2025',
          raceName: 'Spanish Grand Prix',
          date: '2025-06-01',
          poleDriverId: 'oscarpiastri',
          podiumDriverIds: ['oscarpiastri', 'landonorris', 'charlesleclerc'],
          circuitName: 'Circuit de Barcelona-Catalunya',
          country: 'Spain'
        },
        {
          round: 10,
          season: '2025',
          raceName: 'Canadian Grand Prix',
          date: '2025-06-15',
          poleDriverId: 'georgerussell',
          podiumDriverIds: ['georgerussell', 'maxverstappen', 'andreakimiantonelli'],
          circuitName: 'Circuit Gilles Villeneuve',
          country: 'Canada'
        },
        {
          round: 11,
          season: '2025',
          raceName: 'Austrian Grand Prix',
          date: '2025-06-29',
          poleDriverId: 'landonorris',
          podiumDriverIds: ['landonorris', 'oscarpiastri', 'charlesleclerc'],
          circuitName: 'Red Bull Ring',
          country: 'Austria'
        },
        {
          round: 12,
          season: '2025',
          raceName: 'British Grand Prix',
          date: '2025-07-13',
          poleDriverId: 'landonorris',
          podiumDriverIds: ['landonorris', 'oscarpiastri', 'nicohulkenberg'],
          circuitName: 'Silverstone Circuit',
          country: 'United Kingdom'
        },
        {
          round: 13,
          season: '2025',
          raceName: 'Belgian Grand Prix',
          date: '2025-08-03',
          poleDriverId: 'oscarpiastri',
          podiumDriverIds: ['oscarpiastri', 'landonorris', 'charlesleclerc'],
          circuitName: 'Circuit de Spa-Francorchamps',
          country: 'Belgium'
        },
        {
          round: 14,
          season: '2025',
          raceName: 'Hungarian Grand Prix',
          date: '2025-07-27',
          poleDriverId: 'landonorris',
          podiumDriverIds: ['landonorris', 'oscarpiastri', 'georgerussell'],
          circuitName: 'Hungaroring',
          country: 'Hungary'
        },
                  {
            round: 15,
            season: '2025',
            raceName: 'Dutch Grand Prix',
            date: '2025-08-24',
            poleDriverId: 'oscarpiastri',
            podiumDriverIds: ['oscarpiastri', 'maxverstappen', 'isackhadjar'],
            circuitName: 'Circuit Zandvoort',
            country: 'Netherlands'
          }
      ];
      setRaceResults(fallbackResults);
    }
  }, [loading, raceResults.length]);

  const nextRace = () => {
    setCurrentIndex((prev) => (prev + 1) % raceResults.length);
  };

  const prevRace = () => {
    setCurrentIndex((prev) => (prev - 1 + raceResults.length) % raceResults.length);
  };

  const getDriverName = (driverId: string) => {
    const driverMap: Record<string, string> = {
      'maxverstappen': 'Max Verstappen',
      'charlesleclerc': 'Charles Leclerc',
      'lewishamilton': 'Lewis Hamilton',
      'landonorris': 'Lando Norris',
      'oscarpiastri': 'Oscar Piastri',
      'georgerussell': 'George Russell',
      'carlossainz': 'Carlos Sainz',
      'fernandoalonso': 'Fernando Alonso',
      'pierregasly': 'Pierre Gasly',
      'estebanocon': 'Esteban Ocon',
      'yukitsunoda': 'Yuki Tsunoda',
      'lancestroll': 'Lance Stroll',
      'alexanderalbon': 'Alexander Albon',
      'nicohulkenberg': 'Nico Hulkenberg',
      'valtteribottas': 'Valtteri Bottas',
      'guanyuzhou': 'Guanyu Zhou',
      'kevinmagnussen': 'Kevin Magnussen',
      'danielricciardo': 'Daniel Ricciardo',
      'andreakimiantonelli': 'Andrea Kimi Antonelli',
      'kimiantonelli': 'Kimi Antonelli',
      'francocolapinto': 'Franco Colapinto',
      'gabrielbortoleto': 'Gabriel Bortoleto',
      'jackdoohan': 'Jack Doohan',
      'isackhadjar': 'Isack Hadjar',
      'liamlawson': 'Liam Lawson',
      'oliverbearman': 'Oliver Bearman'
    };
    return driverMap[driverId] || driverId;
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
                className={`w-3 h-3 rounded-full transition-all duration-200 backdrop-blur-sm border ${
                  index === currentIndex 
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
