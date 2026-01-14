import { useState, useEffect, useMemo } from 'react';
import { useRaces, useRaceProbabilities } from '../hooks/useApi';
import RaceHeader from '../components/predict/RaceHeader';
import PredictionTabs from '../components/predict/PredictionTabs';
import AIInsights from '../components/predict/AIInsights';
import SubmitPredictionBar from '../components/predict/SubmitPredictionBar';

interface PredictPageProps {
  raceData?: {
    raceName: string;
    raceId: string;
  };
  onPageChange?: (page: string) => void;
}

interface Predictions {
  winner?: string;
  podium?: { first: string; second: string; third: string };
  fastestLap?: string;
}

const PredictPage: React.FC<PredictPageProps> = ({ raceData }) => {
  const [predictions, setPredictions] = useState<Predictions>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use API hook - fetch 2026 season by default
  const { data: apiRaces, isLoading: apiLoading, error: apiError } = useRaces(2026);

  // New TanStack Query hooks for backend data
  const { data: backendProbabilities } = useRaceProbabilities(raceData?.raceId || '');
  // const { data: backendMarkets } = useRaceMarkets(raceData?.raceId || ''); // For future use

  // Intelligent initial race selection - don't redirect, just find the best match
  const [selectedRaceId, setSelectedRaceId] = useState(raceData?.raceId);

  useEffect(() => {
    if (!selectedRaceId && apiRaces && apiRaces.length > 0) {
      // Find the first upcoming race
      const upcoming = apiRaces.find(r => {
        const raceTime = new Date(`${r.race_date}T${r.time || '00:00:00'}Z`).getTime();
        return raceTime > Date.now();
      });
      if (upcoming) setSelectedRaceId(upcoming.id);
    }
  }, [apiRaces, selectedRaceId]);

  // Mock drivers data (replace with actual API call)
  const mockDrivers = [
    { id: '1', name: 'Max Verstappen', number: 1, team: 'Red Bull Racing' },
    { id: '2', name: 'Sergio Perez', number: 11, team: 'Red Bull Racing' },
    { id: '3', name: 'Lewis Hamilton', number: 44, team: 'Mercedes' },
    { id: '4', name: 'George Russell', number: 63, team: 'Mercedes' },
    { id: '5', name: 'Charles Leclerc', number: 16, team: 'Ferrari' },
    { id: '6', name: 'Carlos Sainz', number: 55, team: 'Ferrari' },
    { id: '7', name: 'Lando Norris', number: 4, team: 'McLaren' },
    { id: '8', name: 'Oscar Piastri', number: 81, team: 'McLaren' },
    { id: '9', name: 'Fernando Alonso', number: 14, team: 'Aston Martin' },
    { id: '10', name: 'Lance Stroll', number: 18, team: 'Aston Martin' }
  ];

  // Map backend probabilities to UI format
  const aiPredictions = useMemo(() => {
    if (!backendProbabilities?.probabilities) {
      // Mock fallback if nothing in DB yet
      return [
        { driver: 'Max Verstappen', probability: 68, confidence: 'high' as const },
        { driver: 'Charles Leclerc', probability: 15, confidence: 'medium' as const },
        { driver: 'Lando Norris', probability: 12, confidence: 'medium' as const }
      ];
    }

    return Object.entries(backendProbabilities.probabilities).map(([driverName, p]) => ({
      driver: driverName,
      probability: Math.round(p.win_prob * 100),
      confidence: (p.win_prob > 0.3 ? 'high' : p.win_prob > 0.1 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
    })).sort((a: any, b: any) => b.probability - a.probability).slice(0, 3);
  }, [backendProbabilities]);

  // Status calculation logic (consistent with SchedulePage)
  const getRaceStatus = (startISO: string) => {
    const raceDateTime = new Date(startISO);
    const now = new Date();
    const diff = raceDateTime.getTime() - now.getTime();
    if (diff > 2 * 60 * 60 * 1000) return 'open';
    if (diff > -3 * 60 * 60 * 1000) return 'live';
    return 'finished';
  };

  // Derive race data from API
  const displayRace = useMemo(() => {
    if (!apiRaces || apiRaces.length === 0) {
      return {
        id: 'loading',
        name: 'Loading...',
        circuit: '...',
        country: '...',
        startTime: new Date().toISOString(),
        status: 'open' as const
      };
    }

    const found = apiRaces.find(r => r.id === selectedRaceId || r.round.toString() === selectedRaceId);

    if (!found) {
      // Return the first race as fallback if still nothing
      const fallback = apiRaces[0];
      const startISO = `${fallback.race_date}T${fallback.time || '00:00'}:00Z`;
      return {
        id: fallback.id,
        name: fallback.name,
        circuit: fallback.circuit,
        country: fallback.country,
        startTime: startISO,
        status: getRaceStatus(startISO) as 'open' | 'finished' | 'closed'
      };
    }

    const startISO = `${found.race_date}T${found.time || '00:00'}:00Z`;
    return {
      id: found.id,
      name: found.name,
      circuit: found.circuit,
      country: found.country,
      startTime: startISO,
      predictionsCloseTime: found.qualifying_time || undefined,
      status: getRaceStatus(startISO) as 'open' | 'finished' | 'closed'
    };
  }, [apiRaces, selectedRaceId]);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Validation logic
  const isWinnerValid = !!predictions.winner;
  const isPodiumValid = () => {
    const { first, second, third } = predictions.podium || {};
    if (!first || !second || !third) return false;
    return first !== second && first !== third && second !== third;
  };
  const isFastestLapValid = !!predictions.fastestLap;

  // All predictions must be valid to submit
  const canSubmit = isWinnerValid && isPodiumValid() && isFastestLapValid;

  const handlePredictionChange = (newPredictions: Predictions) => {
    setPredictions(prev => ({ ...prev, ...newPredictions }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitted) return;

    try {
      // TODO: Replace with actual API call
      console.log('Submitting predictions:', predictions);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSubmitted(true);

      // Optional: Show success notification
      console.log('✓ Prediction submitted successfully!');
    } catch (err) {
      console.error('Failed to submit prediction:', err);
      setError('Failed to submit prediction. Please try again.');
    }
  };

  // Loading state
  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading race data...</div>
          <div className="text-gray-400">Please wait</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || apiError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-2">Error</div>
          <div className="text-gray-400">{error || (apiError as any)?.message || 'An error occurred'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      {/* Hero Background is handled globally in App.tsx */}

      {/* Sticky Race Header */}
      <RaceHeader race={displayRace} />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 pb-32">
        <div className="space-y-8">
          {/* Page Title */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2" style={{ fontFamily: '"Orbitron", sans-serif' }}>
              MAKE YOUR PREDICTION
            </h2>
            <p className="text-gray-400">
              Select your predictions for each category below
            </p>
          </div>

          {/* Prediction Tabs */}
          <PredictionTabs
            drivers={mockDrivers}
            onPredictionChange={handlePredictionChange}
            disabled={isSubmitted || displayRace.status !== 'open'}
          />

          {/* AI Insights - Collapsed by Default */}
          <AIInsights
            predictions={aiPredictions}
            explanation={backendProbabilities ? "Simulation results based on historical performance and current season data." : "AI analysis pending for this race session."}
            confidence={backendProbabilities ? "high" : "low"}
          />

          {/* Validation Feedback */}
          {!canSubmit && !isSubmitted && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-yellow-400 text-xl">⚠️</span>
                <div>
                  <div className="font-semibold text-yellow-300 mb-1">
                    Complete all predictions to submit
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {!isWinnerValid && <li>• Select a race winner</li>}
                    {!isPodiumValid() && <li>• Complete the podium (all 3 positions with different drivers)</li>}
                    {!isFastestLapValid && <li>• Select fastest lap driver</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Submit Bar */}
      <SubmitPredictionBar
        isValid={canSubmit}
        isSubmitted={isSubmitted}
        raceStartsIn="23h 58m"
        onSubmit={handleSubmit}
        disabled={displayRace.status !== 'open'}
      />
    </div>
  );
};

export default PredictPage;