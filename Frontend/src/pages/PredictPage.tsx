import React, { useState, useEffect } from 'react';
import { Race, RacePrediction } from '../types/predictions';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import F1CarCarousel from '../components/F1CarCarousel';
import { motion } from 'framer-motion';
import PastRaceResultsCard from '../components/PastRaceResultsCard';
import GlassWrapper from '../components/GlassWrapper';
import PodiumSection from '../components/PodiumSection';
import DriverList from '../components/DriverList';
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


      </div>
    </div>
  );
};

export default PredictPage;