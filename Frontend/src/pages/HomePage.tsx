import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import { Race } from '../types/predictions';
import { Activity, Zap, BarChart3 } from 'lucide-react';

export default function HomePage({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const { data: apiRaces, isLoading: apiLoading, error: apiError } = useRaces(2025);
  const [nextRace, setNextRace] = useState<Race | null>(null);

  // Helper for circuit images
  const toCircuitBannerImage = (circuitName: string, raceName: string): string => {
    const key = `${raceName} ${circuitName}`.toLowerCase();
    // Simple mapping logic (truncated for brevity, using same logic as before)
    if (key.includes('bahrain') || key.includes('bhr')) return '/circuits/f1_2024_bhr_outline.png';
    return '/circuits/f1_2024_aus_outline.png'; // Fallback
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
    const next = sortedRaces.filter(r => new Date(r.startDate) >= now)[0];
    if (next) setNextRace(next);
  }, [apiRaces, apiLoading, apiError]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden relative">

      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          {/* Using HeroBackground content or similar static image for now */}
          <div className="absolute inset-0 bg-[url('/hero/home-bg-new.jpg')] bg-cover bg-center opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/50 to-[#0A0A0A]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 to-transparent"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-2">
              F1 <span className="text-[#E10600]">PREDICT</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide max-w-3xl mx-auto">
              <span className="text-white font-medium">Precision</span> in every lap. <span className="text-white font-medium">Strategy</span> in every byte.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center pt-8"
          >
            <button
              onClick={() => setCurrentPage('intelligence')}
              className="group relative px-8 py-4 border border-[#E10600] text-white font-bold uppercase tracking-widest text-sm overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(225,6,0,0.4)]"
            >
              <span className="relative z-10">Intelligence Engine</span>
              <div className="absolute inset-0 bg-[#E10600]/10 group-hover:bg-[#E10600]/20 transition-colors"></div>
            </button>

            <button
              onClick={() => setCurrentPage('predict')}
              className="group px-8 py-4 bg-[#E10600] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#ff1a1a] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(225,6,0,0.6)]"
            >
              Live Forecast
            </button>
          </motion.div>
        </div>
      </section>


      {/* 2. LIVE FORECAST / SYNCHRONIZATION */}
      <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#E10600] font-mono text-xs uppercase tracking-[0.2em]">Target Session: Forecast</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black italic text-white tracking-tight mb-6">
            {nextRace ? nextRace.name.toUpperCase() : 'SYNCHRONIZING...'}
          </h2>
          <div className="flex gap-6 text-xs text-gray-400 font-mono uppercase tracking-wider">
            <span>Track: {nextRace?.circuit || '--'}</span>
            <span>Weather: Dry</span>
            <span>Safety Car Risk: Low</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Strategy Snapshot */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#141414] border border-[#2D2D2D] p-8 rounded-sm hover:border-[#E10600]/40 transition-colors shadow-lg"
          >
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-4">Strategy Snapshot</h3>
            <div className="text-3xl font-mono text-white mb-2">SOFT <span className="text-gray-600">→</span> MEDIUM</div>
            <div className="w-full bg-gray-800 h-1 mt-4 mb-2">
              <div className="bg-green-500 h-full w-[94%]"></div>
            </div>
            <p className="text-xs text-green-500 font-mono uppercase">1-Stop Robustness: 94%</p>
          </motion.div>

          {/* Card 2: Last Race Summary */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#141414] border border-[#2D2D2D] p-8 rounded-sm hover:border-[#E10600]/40 transition-colors shadow-lg"
          >
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
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#141414] border border-[#2D2D2D] p-8 rounded-sm hover:border-[#E10600]/40 transition-colors shadow-lg flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            {nextRace && (
              <img
                src={toCircuitBannerImage(nextRace.circuit, nextRace.name)}
                className="w-full h-32 object-contain opacity-80"
                alt="Circuit"
              />
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
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.4em] text-center mb-16">
            System Capabilities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Cap 1 */}
            <motion.div whileHover={{ scale: 1.02 }} className="group text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full mx-auto flex items-center justify-center mb-6 border border-white/5 group-hover:border-[#E10600] transition-colors">
                <BarChart3 className="text-white group-hover:text-[#E10600] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic mb-3">Deterministic Models</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                Physics-based tyre degradation and fuel-burn calculations derived from real-time telemetry.
              </p>
            </motion.div>

            {/* Cap 2 */}
            <motion.div whileHover={{ scale: 1.02 }} className="group text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full mx-auto flex items-center justify-center mb-6 border border-white/5 group-hover:border-[#E10600] transition-colors">
                <Activity className="text-white group-hover:text-[#E10600] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic mb-3">Monte Carlo Simulation</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                Probabilistic modeling for safety cars, red flags, and dynamic weather transitions.
              </p>
            </motion.div>

            {/* Cap 3 */}
            <motion.div whileHover={{ scale: 1.02 }} className="group text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full mx-auto flex items-center justify-center mb-6 border border-white/5 group-hover:border-[#E10600] transition-colors">
                <Zap className="text-white group-hover:text-[#E10600] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic mb-3">Strategy Visualization</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                High-density charts for pace comparison, gap evolution, and pit-window optimization.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
