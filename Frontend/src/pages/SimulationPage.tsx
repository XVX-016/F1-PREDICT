import { useState } from 'react';
import { useSimulateRace } from '../hooks/useApi';
import SimulationControls from '../components/simulation/SimulationControls';
import SimulationResults from '../components/simulation/SimulationResults';
import StrategyRecommendationCard from '../components/simulation/StrategyRecommendationCard';
import { Activity, AlertTriangle, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { formatLabel } from '../utils/formatters';

const TRACKS = {
  'bahrain': { name: 'Bahrain International Circuit', length: '5.412 km', pit_loss: '23.1s', sc_baseline: '12%' },
  'jeddah': { name: 'Jeddah Corniche Circuit', length: '6.174 km', pit_loss: '21.5s', sc_baseline: '48%' },
  'melbourne': { name: 'Albert Park Circuit', length: '5.278 km', pit_loss: '20.8s', sc_baseline: '54%' },
  'baku': { name: 'Baku City Circuit', length: '6.003 km', pit_loss: '21.0s', sc_baseline: '50%' },
  'miami': { name: 'Miami International Autodrome', length: '5.412 km', pit_loss: '24.2s', sc_baseline: '35%' },
  'imola': { name: 'Autodromo Enzo e Dino Ferrari', length: '4.909 km', pit_loss: '26.8s', sc_baseline: '40%' },
  'monaco': { name: 'Circuit de Monaco', length: '3.337 km', pit_loss: '25.0s', sc_baseline: '60%' },
  'barcelona': { name: 'Circuit de Barcelona-Catalunya', length: '4.657 km', pit_loss: '22.4s', sc_baseline: '6%' },
  'montreal': { name: 'Circuit Gilles-Villeneuve', length: '4.361 km', pit_loss: '19.5s', sc_baseline: '52%' },
  'austria': { name: 'Red Bull Ring', length: '4.318 km', pit_loss: '21.8s', sc_baseline: '25%' },
  'silverstone': { name: 'Silverstone Circuit', length: '5.891 km', pit_loss: '20.4s', sc_baseline: '55%' },
  'hungary': { name: 'Hungaroring', length: '4.381 km', pit_loss: '21.2s', sc_baseline: '8%' },
  'spa': { name: 'Circuit de Spa-Francorchamps', length: '7.004 km', pit_loss: '21.8s', sc_baseline: '30%' },
  'zandvoort': { name: 'Circuit Zandvoort', length: '4.259 km', pit_loss: '20.5s', sc_baseline: '22%' },
  'monza': { name: 'Autodromo Nazionale Monza', length: '5.793 km', pit_loss: '24.5s', sc_baseline: '45%' },
  'singapore': { name: 'Marina Bay Street Circuit', length: '4.940 km', pit_loss: '28.5s', sc_baseline: '100%' },
  'suzuka': { name: 'Suzuka International Racing Course', length: '5.807 km', pit_loss: '22.8s', sc_baseline: '45%' },
  'qatar': { name: 'Lusail International Circuit', length: '5.419 km', pit_loss: '23.5s', sc_baseline: '15%' },
  'austin': { name: 'Circuit of the Americas', length: '5.513 km', pit_loss: '21.5s', sc_baseline: '32%' },
  'mexico': { name: 'Autodromo Hermanos Rodriguez', length: '4.304 km', pit_loss: '22.5s', sc_baseline: '35%' },
  'brazil': { name: 'Autodromo Jose Carlos Pace', length: '4.309 km', pit_loss: '21.8s', sc_baseline: '55%' },
  'vegas': { name: 'Las Vegas Strip Circuit', length: '6.201 km', pit_loss: '21.5s', sc_baseline: '45%' },
  'abu_dhabi': { name: 'Yas Marina Circuit', length: '5.281 km', pit_loss: '22.5s', sc_baseline: '18%' },
};

const SimulationPage = () => {
  const [params, setParams] = useState({
    track_id: 'abu_dhabi',
    tyre_deg_multiplier: 1.0,
    sc_probability: 0.18,
    strategy_aggression: 'balanced' as const,
    weather_scenario: 'dry' as const,
    use_ml: true,
    iterations: 10000
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [results, setResults] = useState<any>(null);
  const simulationMutation = useSimulateRace();

  // Derived from params to keep sync
  const track = TRACKS[params.track_id as keyof typeof TRACKS] || TRACKS['abu_dhabi'];

  const handleRunSimulation = async () => {
    try {
      const response = await simulationMutation.mutateAsync({
        raceId: params.track_id,
        params: params
      });
      setResults(response);
    } catch (err) {
      console.error('Simulation failed:', err);
    }
  };

  const isLoading = simulationMutation.isPending;
  const error = simulationMutation.isError ? (simulationMutation.error as any)?.message || 'Simulation execution failed' : null;
  const simulationResults = results;

  const onChange = (newParams: any) => {
    setParams(newParams);
  };

  return (
    <div className="min-h-screen pt-14 flex flex-col bg-[#0b0b0e]">

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Collapsible Control Sidebar */}
        <aside
          className={`bg-[#121217] border-r border-[#1f1f26] shadow-2xl z-30 transition-all duration-300 ease-in-out flex flex-col relative
            ${isSidebarOpen ? 'w-[320px]' : 'w-[64px]'}`}
        >
          {/* Toggle Handle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-8 w-6 h-6 bg-[#1f1f26] border border-slate-700/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#2a2a35] transition-colors z-50 shadow-lg"
          >
            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Sidebar Content */}
          <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 ${!isSidebarOpen && 'hidden'}`}>
            <div className="space-y-6">
              <div className="border-l-4 border-red-600 pl-4 py-1 mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Simulation</h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">V2.4 Control Panel</p>
              </div>

              <SimulationControls
                params={params}
                onChange={onChange}
                availableTracks={TRACKS}
              />

              <div className="bg-black/40 border border-[#1f1f26] p-4 rounded space-y-3">
                <h4 className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-[0.2em]">Environmental Data</h4>
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between"><span className="text-slate-500 uppercase">Venue</span><span className="text-white text-right truncate max-w-[120px]">{track.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 uppercase">Pit Loss</span><span className="text-white">{track.pit_loss}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 uppercase">SC Base</span><span className="text-white">{track.sc_baseline}</span></div>
                </div>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isLoading}
                className={`w-full py-4 mt-4 font-mono font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3
                      ${isLoading ? 'bg-red-600/20 text-red-600 cursor-wait' : 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]'}`}
              >
                {isLoading ? 'Executing...' : 'Run Engine'}
              </button>
            </div>
          </div>

          {/* Collapsed Vertical Title */}
          {!isSidebarOpen && (
            <div className="flex-1 flex flex-col items-center pt-24 pb-8 gap-8">
              <div className="w-[1px] h-16 bg-red-600"></div>
              <div className="writing-vertical-lr rotate-180 text-xs font-mono font-bold uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">
                Simulation Parameters
              </div>
              <Settings2 size={20} className="text-slate-500" />
            </div>
          )}
        </aside>

        {/* Fluid Results Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#0b0b0e] custom-scrollbar p-8 relative transition-all duration-300">
          <div className="max-w-6xl mx-auto space-y-8">
            {isLoading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full" />
                  <Activity size={48} className="text-red-600 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter font-mono">Simulating Race</h3>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Running Monte Carlo N={params.iterations.toLocaleString()}...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                <AlertTriangle size={48} className="text-red-600" />
                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter font-mono">Simulation Error</h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase leading-relaxed">{error}</p>
                  <button
                    onClick={handleRunSimulation}
                    className="mt-6 px-6 py-2 bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                  >
                    Retry Simulation
                  </button>
                </div>
              </div>
            ) : simulationResults ? (
              <>
                <StrategyRecommendationCard strategy={simulationResults.strategy_recommendation} />
                <SimulationResults results={simulationResults} isRunning={isLoading} />
              </>
            ) : (
              <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full" />
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="w-16 h-[2px] bg-red-600 mx-auto" />
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.5em]">System Idle</p>
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter max-w-2xl mx-auto">
                    Initialize <span className="text-red-600">Race Engine</span>
                  </h2>
                  <p className="text-slate-400 font-mono text-[11px] uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
                    Configure stochastic parameters to begin high-fidelity monte carlo analysis for {track.name}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SimulationPage;