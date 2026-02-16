import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import { Race } from '../types/predictions';
import { Activity, Zap, BarChart3 } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { SEASON_2026_SCHEDULE } from '../data/season2026';

export default function HomePage({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const { data: apiRaces, isLoading: apiLoading, error: apiError } = useRaces(2025);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const toCircuitBannerImage = (circuitName: string, raceName: string): string => {
    const key = `${raceName} ${circuitName}`.toLowerCase();
    if (key.includes('bahrain')) return '/circuits/f1_2024_bhr_outline.png';
    if (key.includes('melbourne') || key.includes('albert park')) return '/circuits/f1_2024_aus_outline.png';
    if (key.includes('jeddah')) return '/circuits/f1_2024_sau_outline.png';
    if (key.includes('suzuka')) return '/circuits/f1_2024_jap_outline.png';
    if (key.includes('shanghai')) return '/circuits/f1_2024_chn_outline.png';
    if (key.includes('miami')) return '/circuits/f1_2024_mia_outline.png';
    if (key.includes('imola')) return '/circuits/f1_2024_ero_outline.png';
    if (key.includes('monaco')) return '/circuits/f1_2024_mco_outline.png';
    if (key.includes('barcelona')) return '/circuits/f1_2024_spn_outline.png';
    if (key.includes('montreal') || key.includes('villeneuve')) return '/circuits/f1_2024_can_outline.png';
    if (key.includes('spielberg') || key.includes('red bull ring')) return '/circuits/f1_2024_aut_outline.png';
    if (key.includes('silverstone')) return '/circuits/f1_2024_gbr_outline.png';
    if (key.includes('hungaroring')) return '/circuits/f1_2024_hun_outline.png';
    if (key.includes('spa')) return '/circuits/f1_2024_bel_outline.png';
    if (key.includes('zandvoort')) return '/circuits/f1_2024_nld_outline.png';
    if (key.includes('monza')) return '/circuits/f1_2024_ita_outline.png';
    if (key.includes('baku')) return '/circuits/f1_2024_aze_outline.png';
    if (key.includes('marina bay')) return '/circuits/f1_2024_sgp_outline.png';
    if (key.includes('austin') || key.includes('americas')) return '/circuits/f1_2024_usa_outline.png';
    if (key.includes('mexico')) return '/circuits/f1_2024_mex_outline.png';
    if (key.includes('interlagos') || key.includes('sao paulo')) return '/circuits/f1_2024_bra_outline.png';
    if (key.includes('las vegas')) return '/circuits/f1_2024_lve_outline.png';
    if (key.includes('lusail')) return '/circuits/f1_2024_qat_outline.png';
    if (key.includes('yas marina')) return '/circuits/f1_2024_abu_outline.png';
    return '/circuits/f1_2024_aus_outline.png';
  };

  useEffect(() => {
    // Determine next race from API or fallback
    const now = new Date();

    if (apiRaces && apiRaces.length > 0) {
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
      const next = sortedRaces.filter(r => new Date(r.startDate) >= now)[0];
      if (next) setNextRace(next);
    } else if (!apiLoading) {
      // Fallback to SEASON_2026_SCHEDULE if API is offline/empty
      const next = SEASON_2026_SCHEDULE.find(r => new Date(r.date) >= now);
      if (next) {
        setNextRace({
          id: `2026-${next.round}`,
          round: next.round,
          name: next.raceName,
          circuit: next.circuit,
          city: next.city,
          country: next.country,
          startDate: next.date,
          endDate: next.date,
          timezone: "UTC",
          has_sprint: !!next.isSprint,
          status: "upcoming"
        } as any);
      }
    }
  }, [apiRaces, apiLoading, apiError]);

  const { data: weather } = useWeather(nextRace?.city || nextRace?.country);

  // Function to get track image safely
  const getTrackImage = (circuit: string, name: string) => {
    // Try to find in 2026 schedule first for verified paths
    const staticRace = SEASON_2026_SCHEDULE.find(r => r.circuit === circuit || r.raceName === name);
    if (staticRace?.trackImg) return staticRace.trackImg;
    return toCircuitBannerImage(circuit, name);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden relative">
      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/hero/home-bg-new.jpg')] bg-cover bg-center opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/50 to-[#0A0A0A]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-2">
              F1 <span className="text-[#E10600]">PREDICT</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide max-w-3xl mx-auto">
              <span className="text-white font-medium">Precision</span> in every lap. <span className="text-white font-medium">Strategy</span> in every byte.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <button onClick={() => setCurrentPage('intelligence')} className="group relative px-8 py-4 bg-[#E10600] text-white font-bold uppercase tracking-widest text-sm transition-all hover:bg-[#ff1a1a] hover:scale-105">
              Intelligence Engine
            </button>
            <button onClick={() => setCurrentPage('simulation')} className="group px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all relative overflow-hidden">
              <span className="relative z-10">Race Simulation</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. LIVE FORECAST / SYNCHRONIZATION */}
      <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto min-h-[600px]">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#E10600] font-mono text-xs uppercase tracking-[0.2em]">Target Session: Forecast</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black italic text-white tracking-tight mb-6 uppercase">
            {nextRace ? nextRace.name : 'SYNCHRONIZING...'}
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-xs text-gray-400 font-mono uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="text-gray-600">Track:</span> {nextRace?.circuit || '--'}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-gray-600">Weather:</span>
              <span className="text-white font-bold">{weather?.condition?.text || 'Clear'}</span>
              {weather && <span className="text-[#E10600] font-bold">{weather.temp_c}°C</span>}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-gray-600">Safety Car Risk:</span> <span className="text-green-500">Low</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div whileHover={{ y: -5 }} className="bg-[#141414] border border-[#2D2D2D] p-8 rounded-sm hover:border-[#E10600]/40 transition-colors shadow-lg h-[200px] flex flex-col justify-center">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-4">Strategy Snapshot</h3>
            <div className="text-3xl font-mono text-white mb-2">SOFT <span className="text-gray-600">→</span> MEDIUM</div>
            <div className="w-full bg-gray-800 h-1 mt-4 mb-2">
              <div className="bg-green-500 h-full w-[94%]"></div>
            </div>
            <p className="text-xs text-green-500 font-mono uppercase">1-Stop Robustness: 94%</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-[#141414] border border-[#2D2D2D] p-8 rounded-sm hover:border-[#E10600]/40 transition-colors shadow-lg h-[200px] flex flex-col justify-center">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-4">Last Race Delta</h3>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-3xl font-mono text-white mb-1">VER</div>
                <span className="text-[10px] bg-[#E10600]/20 text-[#E10600] px-2 py-1 rounded">WINNER</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono text-gray-400">54k</div>
                <div className="text-[10px] text-gray-600 uppercase">Data Points</div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Track Layout */}
          <motion.div whileHover={{ y: -5 }} className="bg-[#141414] border border-[#2D2D2D] p-8 rounded-sm hover:border-[#E10600]/40 transition-colors shadow-lg flex items-center justify-center relative overflow-hidden h-[200px]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            {nextRace && (
              <img src={getTrackImage(nextRace.circuit, nextRace.name)} className="w-full h-32 object-contain opacity-80" alt="Circuit" />
            )}

            <div className="absolute bottom-4 left-4 text-[10px] text-gray-600 font-mono">
              TRACK MAP // {nextRace?.circuit}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. SYSTEM CAPABILITIES */}
      <section className="py-24 px-6 bg-[#0F0F0F] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.4em] text-center mb-16">System Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div whileHover={{ scale: 1.02 }} className="group text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full mx-auto flex items-center justify-center mb-6 border border-white/5 group-hover:border-[#E10600] transition-colors">
                <BarChart3 className="text-white group-hover:text-[#E10600] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic mb-3">Deterministic Models</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">Physics-based tyre degradation and fuel-burn calculations derived from real-time telemetry.</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="group text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full mx-auto flex items-center justify-center mb-6 border border-white/5 group-hover:border-[#E10600] transition-colors">
                <Activity className="text-white group-hover:text-[#E10600] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic mb-3">Monte Carlo Simulation</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">Probabilistic modeling for safety cars, red flags, and dynamic weather transitions.</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="group text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full mx-auto flex items-center justify-center mb-6 border border-white/5 group-hover:border-[#E10600] transition-colors">
                <Zap className="text-white group-hover:text-[#E10600] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic mb-3">Strategy Visualization</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">High-density charts for pace comparison, gap evolution, and pit-window optimization.</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
