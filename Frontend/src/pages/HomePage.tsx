import { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Flag, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import CountdownTimer from '../components/betting/CountdownTimer';
// import { sampleRaces } from '../data/sampleRaces'; // Removed
// import { F1_2025_CALENDAR } from '../data/f1-2025-calendar'; // Removed
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import { api } from '../services/api';
import { Race, RacePrediction } from '../types/predictions';



interface HomePageProps {

  setCurrentPage: (page: string) => void;

}



export default function HomePage({ setCurrentPage }: HomePageProps) {

  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);

  // Use API hook
  const { data: apiRaces, loading: apiLoading, error: apiError } = useRaces(2026);

  const [loadingRaces, setLoadingRaces] = useState(true);

  const [errorRaces, setErrorRaces] = useState<string | null>(null);

  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [nextRacePrediction, setNextRacePrediction] = useState<RacePrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [nextRaceName, setNextRaceName] = useState<string>('');
  const [nextRaceDateISO, setNextRaceDateISO] = useState<string>('');
  const [dynamicPrediction, setDynamicPrediction] = useState<RacePrediction | null>(null);
  const [loadingDynamicPrediction, setLoadingDynamicPrediction] = useState(false);



  const toCircuitBannerImage = (circuitName: string, raceName: string): string => {

    const key = `${raceName} ${circuitName}`.toLowerCase();

    if (key.includes('bahrain') || key.includes('bhr')) return '/circuits/f1_2024_bhr_outline.png';

    if (key.includes('saudi') || key.includes('jeddah') || key.includes('sau')) return '/circuits/f1_2024_sau_outline.png';

    if (key.includes('australia') || key.includes('melbourne') || key.includes('aus')) return '/circuits/f1_2024_aus_outline.png';

    if (key.includes('japan') || key.includes('suzuka') || key.includes('jpn')) return '/circuits/f1_2024_jap_outline.png';

    if (key.includes('china') || key.includes('shanghai') || key.includes('chn')) return '/circuits/f1_2024_chn_outline.png';

    if (key.includes('miami') || key.includes('mia')) return '/circuits/f1_2024_mia_outline.png';

    if (key.includes('emilia') || key.includes('imola') || key.includes('imo')) return '/circuits/f1_2024_ero_outline.png';

    if (key.includes('monaco') || key.includes('mon')) return '/circuits/f1_2024_mco_outline.png';

    if (key.includes('canada') || key.includes('montreal') || key.includes('can')) return '/circuits/f1_2024_can_outline.png';

    if (key.includes('spain') || key.includes('barcelona') || key.includes('spn')) return '/circuits/f1_2024_spn_outline.png';

    if (key.includes('austria') || key.includes('red bull ring') || key.includes('aut')) return '/circuits/f1_2024_aut_outline.png';

    if (key.includes('british') || key.includes('silverstone') || key.includes('united kingdom') || key.includes('gbr')) return '/circuits/f1_2024_gbr_outline.png';

    if (key.includes('hungary') || key.includes('hungaroring') || key.includes('hun')) return '/circuits/f1_2024_hun_outline.png';

    if (key.includes('belgium') || key.includes('spa') || key.includes('bel')) return '/circuits/f1_2024_bel_outline.png';

    if (key.includes('netherlands') || key.includes('dutch') || key.includes('zandvoort') || key.includes('nld')) return '/circuits/f1_2024_nld_outline.png';

    if (key.includes('italy') || key.includes('monza') || key.includes('ita')) return '/circuits/f1_2024_ita_outline.png';

    if (key.includes('azerbaijan') || key.includes('baku') || key.includes('aze')) return '/circuits/f1_2024_aze_outline.png';

    if (key.includes('singapore') || key.includes('sgp')) return '/circuits/f1_2024_sgp_outline.png';

    if (key.includes('united states') || key.includes('austin') || key.includes('usa')) return '/circuits/f1_2024_usa_outline.png';

    if (key.includes('mexico') || key.includes('mex')) return '/circuits/f1_2024_mex_outline.png';

    if (key.includes('são paulo') || key.includes('brazil') || key.includes('interlagos') || key.includes('bra')) return '/circuits/f1_2024_bra_outline.png';

    if (key.includes('las vegas') || key.includes('lve')) return '/circuits/f1_2024_lve_outline.png';

    if (key.includes('qatar') || key.includes('lusail') || key.includes('qat')) return '/circuits/f1_2024_qat_outline.png';

    if (key.includes('abu dhabi') || key.includes('yas') || key.includes('abu')) return '/circuits/f1_2024_abu_outline.png';

    return '/circuits/f1_2024_aus_outline.png';

  };



  useEffect(() => {
    if (apiLoading) {
      setLoadingRaces(true);
      return;
    }
    if (apiError) {
      setErrorRaces(apiError);
      setLoadingRaces(false);
      return;
    }

    const loadData = () => {
      try {
        const now = new Date();
        const mappedRaces: Race[] = apiRaces.map((r: ApiRace) => ({
          id: r.id,
          round: r.round,
          name: r.name,
          circuit: r.circuit,
          city: r.city,
          country: r.country,
          startDate: r.race_date,
          endDate: r.race_date,
          timezone: "UTC",
          has_sprint: !!r.sprint_time,
          status: "upcoming"
        }));

        const sortedRaces = mappedRaces.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        const upcoming = sortedRaces
          .filter(r => new Date(r.startDate) >= now)
          .slice(0, 3);
        setUpcomingRaces(upcoming);

        // Set next race data
        const next = upcoming[0];
        if (next) {
          setNextRaceName(next.name);
          setNextRaceDateISO(`${next.startDate}T${(next as any).time || '12:00'}:00Z`); // race_date is YYYY-MM-DD
          setNextRace(next);

          // Trigger predictions
          loadNextRacePredictions(next);
        }

      } catch (error) {
        setErrorRaces('Failed to load races');
        console.error('Error processing races:', error);
      } finally {
        setLoadingRaces(false);
      }
    };

    loadData();
  }, [apiRaces, apiLoading, apiError]);

  // Load prediction for the next race
  useEffect(() => {
    const loadPredictions = async () => {
      if (!nextRace) return;

      try {
        setLoadingDynamicPrediction(true);
        // Use backend API
        const response = await api.getProbabilities(nextRace.id);

        // Transform to RacePrediction format expected by UI
        if (response && response.probabilities) {
          const top3 = Object.entries(response.probabilities)
            .map(([driverId, p]) => ({
              driverName: driverId, // We might need name mapping if ID is slug
              winProbPct: p.win_prob * 100,
              team: 'F1 Team' // Placeholder until we have driver metadata
            }))
            .sort((a, b) => b.winProbPct - a.winProbPct)
            .slice(0, 3);

          setDynamicPrediction({
            top3,
            all: []
          } as any);
        }
      } catch (error) {
        console.error('Error loading predictions:', error);
      } finally {
        setLoadingDynamicPrediction(false);
      }
    };

    loadPredictions();
  }, [nextRace]);

  // Legacy function removed
  const loadNextRacePredictions = async (next: Race) => {
    // Replaced by new useEffect
  };



  const handleViewFullAnalysis = () => {

    setCurrentPage('predict');

  };



  return (

    <div className="min-h-screen text-white overflow-x-hidden">

      {/* Hero Section */}

      <section className="relative h-screen flex items-center justify-center overflow-hidden">

        <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6">

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-white via-red-400 to-white bg-clip-text text-transparent">

            🏎️ Predict. Analyze. Win.
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-300 max-w-3xl mx-auto px-2">

            Join the fastest F1 live prediction platform. Analyze real races with AI-powered insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">

            <button

              className="glass-btn px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-colors duration-200 min-h-[48px] sm:min-h-[56px]"

              onClick={() => setCurrentPage('predict')}

            >

              Start Predicting

              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />

            </button>

          </div>

        </div>

      </section>

      {/* Next Race Banner with Timer and Podium Predictions */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-black/20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Next Race Banner */}
          <div className="bg-black/20 border border-white/20 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl">
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">Next Race: {nextRaceName || 'Loading...'}</h2>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                {nextRaceDateISO ? new Date(nextRaceDateISO).toLocaleDateString() : 'TBD'}
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="mb-6">
              <CountdownTimer
                targetDate={nextRaceDateISO ? new Date(nextRaceDateISO) : undefined}
                title="Race Countdown"
                subtitle={nextRaceName && nextRaceDateISO ? `${nextRaceName} - ${new Date(nextRaceDateISO).toLocaleDateString()}` : undefined}
              />
            </div>

          </div>
        </div>
      </section>

      {/* Predicted Podium Card - Separate from Next Race Banner */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-black/20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/90 border border-white/30 rounded-2xl p-4 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white text-center" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
                  PREDICTED PODIUM
                </h2>
              </div>
              <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
                AI Powered
              </div>
            </div>

            {loadingDynamicPrediction ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Loading AI predictions...</p>
                <p className="text-gray-500 text-sm mt-2">Analyzing track data and driver performance</p>
              </div>
            ) : dynamicPrediction && dynamicPrediction.top3 && dynamicPrediction.top3.length > 0 ? (
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  {dynamicPrediction.top3.map((driver: any, index: number) => (
                    <motion.div
                      key={`${driver.driverName}-${index}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={`w-full p-3 sm:p-4 lg:p-5 rounded-xl border ${index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-500 shadow-lg shadow-yellow-500/30' :
                        index === 1 ? 'bg-gradient-to-br from-gray-500 to-gray-600 border-gray-500 shadow-lg shadow-gray-500/30' :
                          'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 shadow-lg shadow-orange-500/30'
                        }`}
                    >
                      <div className="text-center">
                        <div className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                            'text-orange-400'
                          }`}>
                          #{index + 1}
                        </div>
                        <div className="font-bold text-sm sm:text-base lg:text-lg text-white mb-1">
                          {driver.driverName || 'Unknown Driver'}
                        </div>
                        <div className="text-xs text-white/90 mb-2 font-medium">
                          {driver.team || 'Unknown Team'}
                        </div>
                        <div className="text-white font-bold text-base sm:text-lg lg:text-xl mb-1 drop-shadow-lg">
                          {driver.winProbPct ? driver.winProbPct.toFixed(1) : '0.0'}%
                        </div>
                        <div className="text-xs text-white/80 font-medium">
                          Win Probability
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Predictions Available</h3>
                <p className="text-gray-500">Unable to load predictions for this race</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleViewFullAnalysis}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-red-500/25 border border-red-500/30 flex items-center justify-center mx-auto space-x-2 min-h-[48px] sm:min-h-[56px]"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">View Full Analysis & Predict</span>
                <span className="sm:hidden">Full Analysis</span>
              </button>
              <p className="text-xs sm:text-sm text-gray-400 mt-3 px-2">
                Get detailed race analysis, driver stats, and make your own predictions
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Upcoming Race Schedule */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-12 text-center">
            Upcoming <span className="text-red-500">Grand Prix</span>
          </h2>
          {loadingRaces ? (
            <div className="text-center py-12 text-base sm:text-lg text-gray-400">Loading...</div>
          ) : errorRaces ? (
            <div className="text-center py-12 text-base sm:text-lg text-red-400">{errorRaces}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcomingRaces.map((race: Race, index: number) => (
                <div key={`${race.name}-${race.round}-${index}`} className="bg-black/60 border border-white/30 rounded-xl overflow-hidden group shadow-2xl">
                  <div className="h-24 sm:h-32 bg-black flex items-center justify-center">
                    <img
                      src={toCircuitBannerImage(race.circuit, race.name)}
                      alt={race.circuit}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{race.name}</h3>
                    <p className="text-gray-400 mb-2 text-sm sm:text-base">{race.circuit}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs sm:text-sm text-gray-400">{new Date(race.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="bg-red-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">UTC</span>
                    </div>
                    <button className="bg-red-600/80 hover:bg-red-700/80 border border-red-500/30 w-full py-2 sm:py-3 rounded-lg font-semibold text-white transition-all duration-200 text-sm sm:text-base min-h-[44px]">
                      Set Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Race Telemetry Modal */}
      {/* This section was removed as per the edit hint */}
    </div>
  );
}


