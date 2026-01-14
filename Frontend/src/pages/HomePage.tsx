import { useState, useEffect } from 'react';
import { Activity, Trophy, Flag, Zap, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import { api } from '../services/api';
import { Race, RacePrediction } from '../types/predictions';
import { LiveGapTicker } from '../components/intelligence/LiveGapTicker';

export default function HomePage({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const { data: apiRaces, loading: apiLoading, error: apiError } = useRaces(2026);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [errorRaces, setErrorRaces] = useState<string | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
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
      setErrorRaces(apiError instanceof Error ? apiError.message : 'Unknown error');
      setLoadingRaces(false);
      return;
    }

    if (!apiRaces) return;

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

    const next = upcoming[0];
    if (next) {
      setNextRace(next);
    }
    setLoadingRaces(false);
  }, [apiRaces, apiLoading, apiError]);

  useEffect(() => {
    const loadPredictions = async () => {
      if (!nextRace) return;
      try {
        setLoadingDynamicPrediction(true);
        const response = await api.getProbabilities(nextRace.id);
        if (response && response.probabilities) {
          const top3 = Object.entries(response.probabilities)
            .map(([driverId, p]) => ({
              driverName: driverId,
              winProbPct: p.win_prob * 100,
              team: 'F1 Team'
            }))
            .sort((a, b) => b.winProbPct - a.winProbPct)
            .slice(0, 3);
          setDynamicPrediction({ top3, all: [] } as any);
        }
      } catch (error) {
        console.error('Error loading predictions:', error);
      } finally {
        setLoadingDynamicPrediction(false);
      }
    };
    loadPredictions();
  }, [nextRace]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden bg-black/40">
      {/* Live Gap Ticker */}
      <LiveGapTicker raceId={nextRace?.id || 'abu_dhabi_2024'} />

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter" style={{ fontFamily: 'Orbitron' }}>
              RACE <span className="text-red-600">INTEL</span>
            </h1>

            <p className="text-lg md:text-2xl mb-12 text-gray-400 max-w-3xl mx-auto font-mono uppercase tracking-[0.2em]">
              Deterministic Physics + Monte Carlo Strategy Simulation
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="px-8 py-4 rounded-xl font-bold text-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105"
                onClick={() => setCurrentPage('predict')}
              >
                Access Engine Room
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                className="px-8 py-4 rounded-xl font-bold text-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center gap-3 transition-all duration-300"
                onClick={() => setCurrentPage('intelligence')}
              >
                Live Pit Wall
                <Activity className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Next Race Quick Intel */}
      <section className="py-24 px-4 sm:px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter" style={{ fontFamily: 'Orbitron' }}>
                NEXT EVENT: <span className="text-red-600">{nextRace?.name?.toUpperCase() || 'LOADING...'}</span>
              </h2>
              <div className="flex items-center gap-4 text-gray-500 font-mono text-sm uppercase">
                <span className="flex items-center gap-2"><Flag className="w-4 h-4" /> {nextRace?.circuit}</span>
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Round {nextRace?.round}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Physics Confidence</p>
                <p className="text-2xl font-bold text-white">98.4%</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Monte Carlo Iterations</p>
                <p className="text-2xl font-bold text-white">50,000</p>
              </div>
            </div>

            <button
              className="text-red-500 font-mono text-xs uppercase tracking-[0.3em] flex items-center gap-2 hover:gap-4 transition-all"
              onClick={() => setCurrentPage('intelligence')}
            >
              View Live Strategy Stream <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative aspect-square md:aspect-video bg-black/40 border border-white/10 rounded-3xl overflow-hidden group">
            <img
              src={toCircuitBannerImage(nextRace?.circuit || '', nextRace?.name || '')}
              alt="Circuit Layout"
              className="w-full h-full object-contain p-12 opacity-50 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-xs font-mono text-white/50 uppercase">Verified Simulation Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Race Schedule */}
      <section className="py-24 px-4 sm:px-6 relative z-10 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase" style={{ fontFamily: 'Orbitron' }}>
                Circuit <span className="text-red-600">Calendar</span>
              </h2>
              <p className="text-gray-500 mt-2 font-mono uppercase text-xs tracking-[0.2em]">Scheduled System Deployments 2026</p>
            </div>
            <button
              className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono uppercase tracking-widest hover:bg-white/10 transition-colors"
              onClick={() => setCurrentPage('schedule')}
            >
              Full Schedule
            </button>
          </div>

          {loadingRaces ? (
            <div className="flex gap-4 py-12">
              {[1, 2, 3].map(i => <div key={i} className="flex-1 h-64 bg-white/5 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : errorRaces ? (
            <div className="text-center py-12 text-red-400 font-mono uppercase text-xs">{errorRaces}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingRaces.map((race: Race, index: number) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -10 }}
                  className="bg-black/60 border border-white/5 rounded-2xl overflow-hidden group shadow-2xl transition-all hover:border-red-500/30"
                >
                  <div className="h-40 bg-zinc-900/50 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={toCircuitBannerImage(race.circuit, race.name)}
                      alt={race.circuit}
                      className="w-full h-full object-contain p-8 opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded text-[10px] font-mono text-white/50 border border-white/10">
                      ROUND {race.round}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1 tracking-tight">{race.name}</h3>
                    <p className="text-[10px] text-red-500 font-mono uppercase tracking-[0.2em] mb-4">{new Date(race.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{race.country}</span>
                      <Zap className="w-4 h-4 text-white/20 group-hover:text-red-500 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


