import React, { useState, useEffect } from 'react';
import { Race, RacePrediction } from '../types/predictions';
// import { sampleRaces } from '../data/sampleRaces'; // Removed
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import F1CarCarousel from '../components/F1CarCarousel';
import { motion } from 'framer-motion';
import ModelStatistics from '../components/ModelStatistics';
import ZoneFeatures from '../components/ZoneFeatures';
import PastRaceResultsCard from '../components/PastRaceResultsCard';
import GlassWrapper from '../components/GlassWrapper';
import PodiumSection from '../components/PodiumSection';
import DriverList from '../components/DriverList';
import TrackFeatureCard from '../components/TrackFeatureCard';
import { api } from '../services/api';

// Enhanced F1 Font Styles
const f1FontStyle = {
  fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif',
  fontWeight: '900',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const
};

const f1FontStyleLight = {
  fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif',
  fontWeight: '400',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const
};

interface PredictPageProps {
  raceData?: {
    raceName: string;
    raceId: string;
  };
}

const PredictPage: React.FC<PredictPageProps> = ({ raceData }) => {
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [availableRaces, setAvailableRaces] = useState<Race[]>([]);
  const [prediction, setPrediction] = useState<RacePrediction | null>(null);
  // Static data that doesn't change with race selection
  const [staticModelStats, setStaticModelStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use API hook
  const { data: apiRaces, loading: apiLoading, error: apiError } = useRaces(2025);

  useEffect(() => {
    // Add body class to prevent scrollbars
    document.body.classList.add('predict-page-active');

    // Cleanup function to remove body class
    return () => {
      document.body.classList.remove('predict-page-active');
    };
  }, []);

  useEffect(() => {
    if (apiLoading) return;
    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    initializePage();
  }, [apiRaces, apiLoading, apiError]);

  // Debug: Log driver count when prediction changes
  // Debug: Log driver count when prediction changes
  useEffect(() => {
    if (prediction?.all) {
      console.log(`🔍 Driver count: ${prediction.all.length}/20 drivers`);
    }
  }, [prediction]);

  const initializePage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load static data
      setStaticModelStats({
        overallAccuracy: 87.5,
        polePositionAccuracy: 82.3,
        podiumAccuracy: 89.1,
        trackTypePerformance: {
          street: 85.2,
          highSpeed: 88.7,
          technical: 86.4,
          hybrid: 87.9
        }
      });

      console.log('📅 Using 2025 F1 calendar from API...');

      const mappedRaces: Race[] = apiRaces.map((r: ApiRace) => ({
        id: r.id,
        round: r.round,
        name: r.name,
        circuit: r.circuit,
        city: r.city,
        country: r.country,
        startDate: r.race_date, // Using race_date directly
        endDate: r.race_date,
        timezone: "UTC", // Default to UTC as API returns UTC
        has_sprint: !!r.sprint_time,
        status: "upcoming" // TODO: proper status calculation if needed
      }));

      const allRacesSorted = mappedRaces
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      setAvailableRaces(allRacesSorted);

      const now = new Date();
      let selectedRace = allRacesSorted.find(race => new Date(race.startDate) > now) || allRacesSorted[0];

      if (raceData?.raceName) {
        const requestedRace = allRacesSorted.find(race =>
          race.name === raceData.raceName ||
          race.id === raceData.raceId ||
          race.name.toLowerCase().includes(raceData.raceName.toLowerCase())
        );
        if (requestedRace) selectedRace = requestedRace;
      }

      if (selectedRace) {
        setCurrentRace(selectedRace);
        await loadPredictions(selectedRace);
      } else {
        // Handle case where no races are found?
        // Keep loading false
      }

    } catch (err) {
      console.error('Error initializing page:', err);
      setError('Failed to initialize page');
    } finally {
      if (apiRaces.length > 0) setLoading(false);
    }
  };

  const loadPredictions = async (race: Race) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Loading predictions for:', race.name);

      const [probData, marketData] = await Promise.all([
        api.getProbabilities(race.id).catch(err => {
          console.warn('Probabilities fetch failed, using fallback', err);
          return null;
        }),
        api.getMarkets(race.id).catch(err => {
          console.warn('Markets fetch failed, using fallback', err);
          return null;
        })
      ]);

      if (!probData) {
        throw new Error('Could not load prediction data. Backend might be down.');
      }

      // Map probabilities to RacePrediction format
      const driverEntries = Object.entries(probData.probabilities);

      const allPredictions: any[] = driverEntries.map(([driverId, probs]) => {
        // Try to get driver name from market data if available
        const marketEntry = marketData?.markets.find(m => m.driver_id === driverId);
        const driverName = marketEntry?.driver_name || driverId;

        return {
          driverId,
          driverName,
          team: 'F1 Team', // TODO: Fetch from backend
          winProbPct: probs.win_prob * 100,
          podiumProbPct: probs.podium_prob * 100,
          odds: marketEntry?.odds,
          position: 0 // Will sort below
        };
      });

      // Sort by win probability and assign positions
      allPredictions.sort((a, b) => b.winProbPct - a.winProbPct);
      allPredictions.forEach((p, i) => {
        p.position = i + 1;
      });

      const predictionData: RacePrediction = {
        raceId: race.id,
        generatedAt: new Date().toISOString(),
        top3: allPredictions.slice(0, 3) as any,
        all: allPredictions as any,
        modelStats: staticModelStats || {
          accuracyPct: 87.5,
          meanErrorSec: 0.12,
          trees: 500,
          lr: 0.05
        }
      };

      setPrediction(predictionData);

      console.log('✅ Predictions loaded and mapped successfully');

      // Fire and forget: warm last race results
      // (ResultsService removed)

    } catch (err) {
      console.error('Error loading predictions:', err);
      setError(`${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRaceChange = async (raceId: string) => {
    const selectedRace = availableRaces.find(race => race.id === raceId);
    if (selectedRace) {
      setCurrentRace(selectedRace);
      await loadPredictions(selectedRace);
    }
  };

  // Removed custom prediction handlers



  // Removed custom prediction add function

  if (loading && !currentRace) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden pt-20 bg-black relative predict-page-container">

        {/* F1 Car Carousel Background */}
        <div className="f1-car-background">
          <F1CarCarousel />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <p className="text-2xl text-gray-300 mb-4" style={f1FontStyleLight}>
              Loading race data...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && !currentRace) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden pt-20 bg-gradient-to-br from-black via-gray-900 to-black relative predict-page-container">

        {/* F1 Car Carousel Background */}
        <div className="f1-car-background">
          <F1CarCarousel />
        </div>

        <div className="container mx-auto px-4 py-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <h1 className="text-7xl mb-6 text-white" style={f1FontStyle}>ERROR</h1>
            <div className="w-32 h-1 bg-red-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-2xl text-red-400 mb-8" style={f1FontStyleLight}>{error}</p>
            <button
              onClick={initializePage}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-4 rounded-xl transition-all transform hover:scale-105 glass-card"
              style={f1FontStyle}
            >
              TRY AGAIN
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!currentRace) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden pt-20 bg-gradient-to-br from-black via-gray-900 to-black relative predict-page-container">

        {/* F1 Car Carousel Background */}
        <div className="f1-car-background">
          <F1CarCarousel />
        </div>

        <div className="container mx-auto px-4 py-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <h1 className="text-7xl mb-6 text-white" style={f1FontStyle}>NO RACE AVAILABLE</h1>
            <div className="w-32 h-1 bg-red-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-2xl text-gray-300" style={f1FontStyleLight}>Please check back later for upcoming races.</p>
          </motion.div>
        </div>
      </div>
    );
  }



  // Model statistics: use static data that doesn't change with race selection
  const modelStats = staticModelStats || {
    overallAccuracy: 87.5,
    polePositionAccuracy: 82.3,
    podiumAccuracy: 89.1,
    trackTypePerformance: {
      street: 85.2,
      highSpeed: 88.7,
      technical: 86.4,
      hybrid: 87.9
    }
  };

  // Circuit information for current race
  const getCircuitInfo = (raceName: string) => {
    const circuitMap: Record<string, { name: string; laps: number; length: number; prediction: string; keyFactors: string[] }> = {
      'Australian GP': {
        name: 'Albert Park Circuit',
        laps: 58,
        length: 5.278,
        prediction: 'Technical circuit with multiple overtaking opportunities. Weather can significantly impact tire strategy.',
        keyFactors: ['Weather', 'Overtaking', 'Tire Strategy', 'Technical']
      },
      'Chinese GP': {
        name: 'Shanghai International Circuit',
        laps: 56,
        length: 5.451,
        prediction: 'Technical circuit with long straights and challenging corners. Tire degradation and strategy will be crucial.',
        keyFactors: ['Tire Wear', 'Strategy', 'Technical Corners', 'Straight Speed']
      },
      'Japanese GP': {
        name: 'Suzuka International Racing Course',
        laps: 53,
        length: 5.807,
        prediction: 'High-speed technical circuit with the famous 130R corner. Weather and tire strategy will be key factors.',
        keyFactors: ['High Speed', 'Technical', 'Weather', 'Tire Strategy']
      },
      'Bahrain GP': {
        name: 'Bahrain International Circuit',
        laps: 57,
        length: 5.412,
        prediction: 'Our model predicts overtaking opportunities will be limited with tire degradation playing a crucial role in race strategy.',
        keyFactors: ['Tire Wear', 'Braking', 'Top Speed', 'Corners']
      },
      'Saudi Arabian GP': {
        name: 'Jeddah Corniche Circuit',
        laps: 50,
        length: 6.175,
        prediction: 'High-speed street circuit with multiple DRS zones. Safety car probability is elevated due to tight barriers.',
        keyFactors: ['Speed', 'DRS Zones', 'Safety Car', 'Barriers']
      },
      'Miami GP': {
        name: 'Miami International Autodrome',
        laps: 57,
        length: 5.412,
        prediction: 'Street circuit with multiple overtaking opportunities. Tire strategy and track evolution will be crucial.',
        keyFactors: ['Street Circuit', 'Overtaking', 'Tire Strategy', 'Track Evolution']
      },
      'Emilia Romagna GP': {
        name: 'Autodromo Enzo e Dino Ferrari',
        laps: 63,
        length: 4.909,
        prediction: 'Technical circuit with elevation changes and challenging corners. Tire degradation and strategy will be key.',
        keyFactors: ['Elevation', 'Technical', 'Tire Wear', 'Strategy']
      },
      'Monaco GP': {
        name: 'Circuit de Monaco',
        laps: 78,
        length: 3.337,
        prediction: 'Ultimate test of precision and concentration. Overtaking is extremely difficult, making qualifying crucial.',
        keyFactors: ['Precision', 'Qualifying', 'Concentration', 'Strategy']
      },
      'Spanish GP': {
        name: 'Circuit de Barcelona-Catalunya',
        laps: 66,
        length: 4.675,
        prediction: 'Technical circuit with high tire degradation. Strategy and tire management will be crucial for success.',
        keyFactors: ['Tire Degradation', 'Strategy', 'Technical', 'Endurance']
      },
      'Canadian GP': {
        name: 'Circuit Gilles Villeneuve',
        laps: 70,
        length: 4.361,
        prediction: 'High-speed circuit with multiple overtaking opportunities. Weather and safety cars can change the race.',
        keyFactors: ['Speed', 'Overtaking', 'Weather', 'Safety Cars']
      },
      'Austrian GP': {
        name: 'Red Bull Ring',
        laps: 71,
        length: 4.318,
        prediction: 'Short, fast circuit with multiple DRS zones. Tire strategy and track position will be crucial.',
        keyFactors: ['Speed', 'DRS Zones', 'Tire Strategy', 'Track Position']
      },
      'British GP': {
        name: 'Silverstone Circuit',
        laps: 52,
        length: 5.891,
        prediction: 'High-speed circuit with challenging corners. Weather and tire strategy will play a major role.',
        keyFactors: ['High Speed', 'Weather', 'Tire Strategy', 'Technical']
      },
      'Belgian GP': {
        name: 'Circuit de Spa-Francorchamps',
        laps: 44,
        length: 7.004,
        prediction: 'Longest circuit on the calendar with high speeds and elevation changes. Weather is always a factor.',
        keyFactors: ['High Speed', 'Elevation', 'Weather', 'Endurance']
      },
      'Hungarian GP': {
        name: 'Hungaroring',
        laps: 70,
        length: 4.381,
        prediction: 'Technical circuit with limited overtaking opportunities. Qualifying position and strategy will be crucial.',
        keyFactors: ['Technical', 'Qualifying', 'Strategy', 'Overtaking']
      },
      'Dutch GP': {
        name: 'Circuit Zandvoort',
        laps: 72,
        length: 4.259,
        prediction: 'High-speed circuit with banking. Tire degradation and weather changes can create strategic opportunities.',
        keyFactors: ['Banking', 'Weather', 'Tire Wear', 'Speed']
      },
      'Italian GP': {
        name: 'Autodromo Nazionale di Monza',
        laps: 53,
        length: 5.793,
        prediction: 'Temple of Speed with long straights and high speeds. Engine power and slipstreaming will be crucial.',
        keyFactors: ['Speed', 'Engine Power', 'Slipstreaming', 'Strategy']
      },
      'Azerbaijan GP': {
        name: 'Baku City Circuit',
        laps: 51,
        length: 6.003,
        prediction: 'Street circuit with long straights and tight corners. Safety cars and strategy will be key factors.',
        keyFactors: ['Street Circuit', 'Safety Cars', 'Strategy', 'Speed']
      },
      'Singapore GP': {
        name: 'Marina Bay Street Circuit',
        laps: 61,
        length: 5.063,
        prediction: 'Night race on a street circuit with high humidity. Tire degradation and strategy will be crucial.',
        keyFactors: ['Night Race', 'Humidity', 'Tire Wear', 'Strategy']
      },
      'United States GP': {
        name: 'Circuit of the Americas',
        laps: 56,
        length: 5.513,
        prediction: 'Technical circuit with elevation changes and multiple overtaking opportunities.',
        keyFactors: ['Elevation', 'Technical', 'Overtaking', 'Strategy']
      },
      'Mexican GP': {
        name: 'Autódromo Hermanos Rodríguez',
        laps: 71,
        length: 4.304,
        prediction: 'High altitude circuit affecting engine performance. Tire strategy and track position will be crucial.',
        keyFactors: ['Altitude', 'Engine Performance', 'Tire Strategy', 'Track Position']
      },
      'Brazilian GP': {
        name: 'Autódromo José Carlos Pace',
        laps: 71,
        length: 4.309,
        prediction: 'Technical circuit with elevation changes. Weather and tire strategy will play a major role.',
        keyFactors: ['Elevation', 'Weather', 'Tire Strategy', 'Technical']
      },
      'Las Vegas GP': {
        name: 'Las Vegas Strip Circuit',
        laps: 50,
        length: 6.201,
        prediction: 'Street circuit with long straights and tight corners. Night race conditions will add complexity.',
        keyFactors: ['Street Circuit', 'Night Race', 'Speed', 'Strategy']
      },
      'Qatar GP': {
        name: 'Lusail International Circuit',
        laps: 57,
        length: 5.419,
        prediction: 'High-speed circuit with challenging corners. Tire degradation and strategy will be key factors.',
        keyFactors: ['High Speed', 'Tire Wear', 'Strategy', 'Technical']
      },
      'Abu Dhabi GP': {
        name: 'Yas Marina Circuit',
        laps: 58,
        length: 5.281,
        prediction: 'Season finale with day-to-night transition. Strategy and tire management will be crucial.',
        keyFactors: ['Day-to-Night', 'Strategy', 'Tire Management', 'Technical']
      }
    };

    return circuitMap[raceName] || {
      name: 'Circuit Information',
      laps: 50,
      length: 5.0,
      prediction: 'AI-powered predictions based on historical data and current form.',
      keyFactors: ['Performance', 'Strategy', 'Conditions', 'History']
    };
  };

  const circuitInfo = getCircuitInfo(currentRace.name);



  return (
    <div className="min-h-screen text-white overflow-x-hidden pt-24 md:pt-28 relative predict-page-container">
      {/* Background only: car carousel. Removed extra overlay layers to avoid page-wide glass/tint. */}

      {/* F1 Car Carousel Background */}
      <div className="f1-car-background" aria-hidden="true">
        <F1CarCarousel />
      </div>
      {/* Subtle dark overlay to keep text readable while allowing background to show */}
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" aria-hidden="true"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">

        {/* Page Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-black mb-3 text-white" style={f1FontStyle}>RACE PREDICTIONS</h1>
          <div className="w-24 h-1 bg-red-500 mx-auto mb-4 rounded-full"></div>
          <p className="text-lg md:text-xl text-gray-300" style={f1FontStyleLight}>AI-powered predictions with track-specific calibration</p>
        </div>

        {/* Enhanced Race Selector with Glassmorphism */}
        {availableRaces.length > 0 && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center space-x-4 backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/20 shadow-2xl shadow-black/50">
              <span className="text-gray-300 font-medium">Select Race:</span>
              <div className="relative">
                <select
                  value={currentRace?.id || ''}
                  onChange={(e) => {
                    const selectedRace = availableRaces.find(race => race.id === e.target.value);
                    if (selectedRace) {
                      handleRaceChange(selectedRace.id);
                    }
                  }}
                  className="appearance-none pr-8 backdrop-blur-sm bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 hover:border-white/40"
                  style={{ direction: 'ltr' }}
                >
                  {availableRaces.map((race) => (
                    <option key={race.id} value={race.id} className="bg-gray-900 text-white">
                      {race.name}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        )}



        {error && (
          <GlassWrapper className="p-8 mb-12 text-center bg-black/70 border-white/10">
            <h2 className="text-3xl mb-4 text-red-400" style={f1FontStyle}>ERROR LOADING PREDICTIONS</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="text-sm text-gray-400 mb-4">
              <p>This could be due to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Backend services not running</li>
                <li>Network connectivity issues</li>
                <li>Data service temporarily unavailable</li>
              </ul>
            </div>
            <button
              onClick={() => loadPredictions(currentRace)}
              className="glass-card bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-xl transition-all transform hover:scale-105 hover:bg-white/5"
              style={f1FontStyle}
            >
              RETRY
            </button>
          </GlassWrapper>
        )}



        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading predictions...</p>
          </div>
        ) : prediction ? (
          <div className="space-y-10">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(() => {
                const circuitInfo = getCircuitInfo(currentRace.name);
                const circuitFeatures = {
                  track: circuitInfo.name,
                  number_of_laps: circuitInfo.laps,
                  circuit_length_km: circuitInfo.length,
                  features: circuitInfo.keyFactors.map(f => `${f}: High impact`)
                };

                return (
                  <TrackFeatureCard
                    raceName={currentRace.name}
                    circuitName={circuitFeatures.track}
                    laps={circuitFeatures.number_of_laps}
                    lengthKm={circuitFeatures.circuit_length_km}
                    features={circuitFeatures.features}
                  />
                );
              })()}

              {/* Predicted Podium */}
              <div className="mb-12">
                {prediction.top3 && prediction.top3.length >= 3 ? (
                  <PodiumSection
                    drivers={prediction.top3 as any}
                    title="PREDICTED PODIUM"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Loading podium predictions...</p>
                  </div>
                )}
              </div>

              {/* Complete Driver Predictions */}
              {prediction.all ? (
                <DriverList
                  drivers={prediction.all as any}
                />
              ) : (
                <GlassWrapper className="p-8 mb-12">
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading driver predictions...</p>
                  </div>
                </GlassWrapper>
              )}

              <GlassWrapper className="p-8 mb-12">
                {modelStats ? (
                  <ModelStatistics stats={modelStats} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading model statistics...</p>
                  </div>
                )}
              </GlassWrapper>

              {/* Past Race Results Card */}
              <PastRaceResultsCard className="mb-12" />

            </div>
          </div>
        ) : (
          <GlassWrapper className="p-8 text-center">
            <h2 className="text-3xl mb-4" style={f1FontStyle}>NO PREDICTIONS AVAILABLE</h2>
            <p className="text-gray-300">Unable to load predictions for this race. Please try again later.</p>
          </GlassWrapper>
        )}

        {/* Zone Features at bottom */}
        <div className="mt-8">
          <ZoneFeatures />
        </div>
      </div>
    </div>
  );
};

export default PredictPage;