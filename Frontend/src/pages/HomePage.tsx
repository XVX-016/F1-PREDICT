import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import { api } from '../services/api';
import { Race } from '../types/predictions';

export default function HomePage({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const { data: apiRaces, isLoading: apiLoading, error: apiError } = useRaces(2025);
  const [nextRace, setNextRace] = useState<Race | null>(null);

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
    if (apiLoading || apiError || !apiRaces) return;

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
    const next = sortedRaces
      .filter(r => new Date(r.startDate) >= now)[0];

    if (next) {
      setNextRace(next);
    }
  }, [apiRaces, apiLoading, apiError]);

  useEffect(() => {
    const loadPredictions = async () => {
      if (!nextRace) return;
      try {
        const response = await api.getProbabilities(nextRace.id);
        if (response && response.probabilities) {
          // Prediction loaded
        }
      } catch (error) {
        console.error('Error loading predictions:', error);
      } finally {
        // Prediction loading complete
      }
    };
    loadPredictions();
  }, [nextRace]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      {/* Hero Section - Quiet and Professional */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden border-b border-slateMid/60"
        style={{ minHeight: 'calc(100vh - 56px)' }}
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-carbon/80"></div>
        </div>

        <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-semibold mb-4 tracking-wide text-textPrimary uppercase">
              F1 RACE <span className="text-f1Red">INTELLIGENCE</span>
            </h1>

            <p className="text-sm md:text-base mb-12 text-textSecondary max-w-2xl mx-auto font-normal">
              A digital pit wall for Formula 1 strategy. Deterministic physics models and Monte Carlo simulations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="px-8 py-3 bg-[#141821] text-textPrimary border border-white/10 hover:border-f1Red transition-all uppercase tracking-widest text-[10px] font-black rounded-sm"
                onClick={() => setCurrentPage('intelligence')}
              >
                Intelligence Engine
              </button>

              <button
                className="px-8 py-3 bg-[#141821] text-textPrimary border border-white/10 hover:border-f1Red transition-all uppercase tracking-widest text-[10px] font-black rounded-sm"
                onClick={() => setCurrentPage('predict')}
              >
                Live Forecast
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Next Session / Status Section */}
      <section className="py-20 px-4 sm:px-6 relative z-10 bg-graphite border-b border-slateMid/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Main Info */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <p className="text-f1Red font-mono text-[10px] uppercase tracking-[0.4em] mb-4">Target Session: Forecast</p>
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
                  {nextRace?.name?.toUpperCase() || 'SYNCHRONIZING...'}
                </h2>
                <div className="flex items-center gap-6 pt-2 text-textSecondary font-mono text-xs uppercase tracking-wider">
                  <span>Track: {nextRace?.circuit}</span>
                  <span>Weather: Dry</span>
                  <span>Safety Car Risk: Low</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slateMid/40">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Strategy Snapshot</h3>
                  <div className="p-6 bg-slateDark/50 border border-slateMid/40 rounded-sm">
                    <p className="text-2xl font-mono text-textPrimary">SOFT &rarr; MEDIUM</p>
                    <p className="text-xs text-textSecondary mt-1 uppercase tracking-wider">Optimal 1-Stop robustness: 94%</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-widest">Last Race Summary</h3>
                  <div className="p-6 bg-slateDark/50 border border-slateMid/40 rounded-sm">
                    <p className="text-2xl font-mono text-textPrimary">WINNER: VER</p>
                    <p className="text-xs text-textSecondary mt-1 uppercase tracking-wider">SC: 1 | Rain: No | Intels: 54k</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar / Circuit */}
            <div className="lg:col-span-4 aspect-square bg-slateDark/30 border border-slateMid/40 rounded-sm flex items-center justify-center relative group overflow-hidden">
              <img
                src={toCircuitBannerImage(nextRace?.circuit || '', nextRace?.name || '')}
                alt="Circuit Layout"
                className="w-full h-full object-contain p-12 opacity-30 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] font-mono text-textSecondary uppercase tracking-widest">Simulation Model v2.4</span>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Platform Capabilities */}
      < section className="py-24 px-4 sm:px-6 bg-carbon/50" >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xs font-semibold text-textSecondary uppercase tracking-[0.5em] mb-12 text-center">System Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-slateMid/40 border border-slateMid/40">
            <div className="p-12 bg-graphite flex flex-col justify-center text-center">
              <h3 className="text-lg font-semibold text-textPrimary mb-4 uppercase tracking-wider">Deterministic Models</h3>
              <p className="text-sm text-textSecondary font-normal leading-relaxed">
                Physics-based tyre degradation and fuel-burn calculations derived from real-time telemetry.
              </p>
            </div>
            <div className="p-12 bg-graphite flex flex-col justify-center text-center border-x border-slateMid/40">
              <h3 className="text-lg font-semibold text-textPrimary mb-4 uppercase tracking-wider">Monte Carlo Simulation</h3>
              <p className="text-sm text-textSecondary font-normal leading-relaxed">
                Probabilistic modeling for safety cars, red flags, and dynamic weather transitions.
              </p>
            </div>
            <div className="p-12 bg-graphite flex flex-col justify-center text-center">
              <h3 className="text-lg font-semibold text-textPrimary mb-4 uppercase tracking-wider">Strategy Visualization</h3>
              <p className="text-sm text-textSecondary font-normal leading-relaxed">
                High-density D3 charts for pace comparison, gap evolution, and pit-window optimization.
              </p>
            </div>
          </div>
        </div>
      </section >
    </div >
  );
}


