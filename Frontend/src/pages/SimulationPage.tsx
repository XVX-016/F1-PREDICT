<<<<<<< HEAD
import { useState, useEffect, useMemo } from 'react';
import { useRaces, useRaceProbabilities, useSimulateRace } from '../hooks/useApi';
import { useRaceStatus } from '../hooks/useRaceStatus';
import SimulationHeader from '../components/simulation/SimulationHeader';

// New simulation-specific components will be imported here
import SimulationControls from '../components/simulation/SimulationControls';
import RunSimulationPanel from '../components/simulation/RunSimulationPanel';
import SimulationResults from '../components/simulation/SimulationResults';
import StrategyRecommendationCard from '../components/simulation/StrategyRecommendationCard';
import RaceReplay from '../components/simulation/RaceReplay';
import ModelDriftPanel from '../components/simulation/ModelDriftPanel';
import ParameterSensitivityPanel from '../components/simulation/ParameterSensitivityPanel';
import ModelExplanationPanel from '../components/simulation/ModelExplanationPanel';
import StrategyComparison from '../components/simulation/StrategyComparison';
import AIInsights from '../components/predict/AIInsights';
// import ModelExplanationPanel from '../components/simulation/ModelExplanationPanel';
=======
import {
    SimulationProvider,
    SimulationLayout,
    SimulationSidebar,
    SidebarSection,
    SeasonSelect,
    RaceSelect,
    TrackInfoBadge,
    DriverSelector,
    TyreDegMultiplier,
    FuelBurnRate,
    SafetyCarProbability,
    WeatherVariance,
    PitStrategyEditor,
    DisableSafetyCarToggle,
    OverrideGridPositions,
    SimulationMain,
    SimulationControlBar,
    RunSimulationButton,
    ReplayToggle,
    ResetSimulationButton,
    PlaybackSpeedSlider,
    AdvancedSettings,
    SimulationStatusIndicator,
    ReplayTimeline,
    LapScrubber,
    TimeScrubber,
    SimulationViewport,
    Tab,
    RacePositionChart,
    LapTimeChart,
    GapToLeaderChart,
    PitStopTimeline,
    StrategyTimeline
} from './SimulationPage.components';

export default function SimulationPage() {
    return (
        <SimulationProvider>
            <SimulationLayout>
>>>>>>> feature/redis-telemetry-replay

                {/* ─────────────────────────────
           LEFT PANEL — INPUTS
        ───────────────────────────── */}
                <SimulationSidebar>
                    <SidebarSection title="Race Context">
                        <SeasonSelect />
                        <RaceSelect />
                        <TrackInfoBadge />
                        <div className="mt-4">
                            <DriverSelector />
                        </div>
                    </SidebarSection>

                    <SidebarSection title="Simulation Parameters">
                        <TyreDegMultiplier />
                        <FuelBurnRate />
                        <SafetyCarProbability />
                        <AdvancedSettings>
                            <WeatherVariance />
                            <PitStrategyEditor />
                            <DisableSafetyCarToggle />
                            <OverrideGridPositions />
                        </AdvancedSettings>
                    </SidebarSection>
                </SimulationSidebar>

                {/* ─────────────────────────────
           MAIN PANEL — RUN + OUTPUT
        ───────────────────────────── */}
                <SimulationMain>
                    <div className="bg-[#141821] border-b border-white/10 p-6">
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                            <span className="text-[#E10600]">Race</span> Simulation
                        </h1>
                        <p className="text-[10px] text-white/50 font-mono uppercase tracking-[0.2em] mt-1">
                            Deterministic Physics & Monte Carlo Engine
                        </p>
                    </div>

                    <SimulationControlBar>
                        <RunSimulationButton />
                        <ReplayToggle />
                        <PlaybackSpeedSlider />
                        <ResetSimulationButton />
                        <SimulationStatusIndicator />
                    </SimulationControlBar>

                    <ReplayTimeline>
                        <LapScrubber />
                        <TimeScrubber />
                    </ReplayTimeline>

                    <SimulationViewport>
                        <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                            {/* TOP ROW: POSITIONS + PACE */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-[400px] shrink-0">
                                <Tab id="positions" label="Race Positions">
                                    <RacePositionChart />
                                </Tab>
                                <Tab id="pace" label="Lap Pace">
                                    <LapTimeChart />
                                </Tab>
                            </div>

                            {/* BOTTOM ROW: GAPS + STRATEGY */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] shrink-0">
                                <Tab id="gaps" label="Gaps">
                                    <GapToLeaderChart />
                                </Tab>
                                <Tab id="strategy" label="Strategy">
                                    <StrategyTimeline />
                                </Tab>
                            </div>
                        </div>
                    </SimulationViewport>
                </SimulationMain>

            </SimulationLayout>
        </SimulationProvider>
    );
}
<<<<<<< HEAD

const SimulationPage: React.FC<SimulationPageProps> = ({ raceData }) => {
  const [results, setResults] = useState<any>(null);
  const [params, setParams] = useState({
    tyreDegMultiplier: 1.0,
    scProbability: 0.15,
    strategyAggression: 'Balanced',
    weatherScenario: 'Dry',
    gridSource: 'Qualifying'
  });
  const [seed, setSeed] = useState<number | null>(42);
  const [lockSeed, setLockSeed] = useState(false);

  // Use API hook - fetch 2026 season by default
  const { data: apiRaces, isLoading: apiLoading, error: apiError } = useRaces(2026);
  const { data: backendProbabilities } = useRaceProbabilities(raceData?.raceId || '');
  const simulationMutation = useSimulateRace();
  const { data: liveStatus } = useRaceStatus(); // Lifted to top level

  const [loading, setLoading] = useState(true);
  const error = apiError || null;

  const [selectedRaceId, setSelectedRaceId] = useState(raceData?.raceId);

  useEffect(() => {
    if (!selectedRaceId && apiRaces && apiRaces.length > 0) {
      const upcoming = apiRaces.find(r => {
        const raceTime = new Date(`${r.race_date}T${r.time || '00:00:00'}Z`).getTime();
        return raceTime > Date.now();
      });
      if (upcoming) setSelectedRaceId(upcoming.id);
    }
  }, [apiRaces, selectedRaceId]);

  // Map backend probabilities to UI format (as a baseline)
  const baselinePredictions = useMemo(() => {
    if (!backendProbabilities?.probabilities) {
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

  const getRaceStatus = (startISO: string) => {
    const raceDateTime = new Date(startISO);
    const now = new Date();
    const diff = raceDateTime.getTime() - now.getTime();
    if (diff > 2 * 60 * 60 * 1000) return 'open';
    if (diff > -3 * 60 * 60 * 1000) return 'live';
    return 'finished';
  };

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

    // Live Status Override
    // Live Status Override (Using top-level hook)

    // If we have live status and it matches the selected race (or we are defaulting), use it
    if (liveStatus && liveStatus.status === 'LIVE') {
      return {
        id: liveStatus.raceId,
        name: liveStatus.name,
        circuit: found?.circuit || 'Unknown Circuit',
        country: found?.country || 'Unknown Location',
        startTime: new Date().toISOString(), // Live now
        status: 'LIVE' as const,
        trackTemp: liveStatus.trackTemp,
        airTemp: liveStatus.airTemp,
        humidity: liveStatus.humidity,
        windSpeed: liveStatus.windSpeed
      };
    }

    if (!found) {
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
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRunSimulation = async () => {
    if (!selectedRaceId) return;

    try {
      const simulationParams = {
        ...params,
        seed: lockSeed ? seed : undefined
      };

      const response = await simulationMutation.mutateAsync({
        raceId: selectedRaceId,
        params: simulationParams
      });

      setResults(response);
    } catch (err) {
      console.error('Simulation failed:', err);
      // Optional: show notification
    }
  };

  const handleExportJSON = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `f1_simulation_${selectedRaceId || 'race'}_${results.metadata.seed}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Initializing simulation engine...</div>
          <div className="text-gray-400">Loading race geometry and physics parameters</div>
        </div>
      </div>
    );
  }

  if (error || apiError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-2">Simulation Error</div>
          <div className="text-gray-400">{error || (apiError as any)?.message || 'An error occurred'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative pt-14">
      {/* Simulation Identity Bar */}
      <div className="w-full bg-slateDark/90 border-b border-white/5 py-1.5 px-8 flex justify-between items-center z-[100] relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse"></span>
            <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Simulation Mode</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-700"></div>
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
            <span className="text-[#E10600] font-bold">10,000+ Deterministic iterations</span> per session. Resultant vectors are model output only.
          </p>
        </div>
        <div className="flex gap-4">
          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-xs ${liveStatus?.status === 'LIVE' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-[#E10600] border-slate-800 bg-black/20'}`}>
            {liveStatus?.status === 'LIVE' ? 'LIVE TELEMETRY ACTIVE' : 'NOT LIVE TELEMETRY'}
          </span>
          <span className="hidden md:block text-[9px] font-mono text-slate-600 uppercase">MODEL_V2.5.0_LGBM</span>
        </div>
      </div>

      <SimulationHeader race={displayRace} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Controls */}
          <div className="lg:col-span-1 space-y-8">
            <div className="text-left">
              <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                Race Simulation Console
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest">
                Configure parameters and execute Monte Carlo iterations
              </p>
            </div>

            <SimulationControls
              params={params}
              onChange={setParams}
            />

            <RunSimulationPanel
              isRunning={simulationMutation.isPending}
              lockSeed={lockSeed}
              seed={seed}
              onRun={handleRunSimulation}
              onLockToggle={setLockSeed}
              onSeedChange={setSeed}
            />
          </div>

          {/* Right Column: Results & Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Simulation Results Display */}
            <div className="bg-slate-900/50 border border-white/5 rounded-lg p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Simulation Results</h3>
                {results && (
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-mono text-slate-500">SEED: {results.metadata.seed !== -1 ? results.metadata.seed : 'RANDOM'}</span>
                    <button
                      onClick={handleExportJSON}
                      className="text-[9px] font-bold text-[#E10600] uppercase tracking-widest hover:underline"
                    >
                      Export JSON
                    </button>
                  </div>
                )}
              </div>

              {results && results.strategy_recommendation && (
                <div className="mb-12 space-y-6">
                  <StrategyRecommendationCard recommendation={results.strategy_recommendation} />

                  {/* Strategy Comparison Block (Week 2 Feature) */}
                  <StrategyComparison
                    baseline={{
                      name: "Recommended (Start Soft)",
                      meanTime: 5420000,
                      stdDev: 4200,
                      winProb: 0.65
                    }}
                    candidate={{
                      name: "Alt: Aggressive 2-Stop",
                      meanTime: 5418000, // Slightly faster mean
                      stdDev: 8500, // But higher variance
                      winProb: 0.55 // Lower win prob due to traffic risk
                    }}
                    onApply={() => console.log('Applying Alt Strategy')}
                  />
                </div>
              )}

              <SimulationResults
                results={results}
                isRunning={simulationMutation.isPending}
              />

              {results && results.race_trace && (
                <RaceReplay trace={results.race_trace} />
              )}

              {results && (
                <ModelDriftPanel metrics={{
                  pace_mae: 82.4,
                  calibration_error: 0.042,
                  rank_correlation: 0.94,
                  status: 'Healthy'
                }} />
              )}
            </div>

            {results && results.sensitivity && (
              <ParameterSensitivityPanel sensitivity={results.sensitivity} />
            )}

            {/* Baseline Insights (reusing AIInsights for now) */}
            <AIInsights
              predictions={baselinePredictions}
              explanation={backendProbabilities ? "Simulation results based on historical performance and current season data." : "AI analysis pending for this race session."}
              confidence={backendProbabilities ? "high" : "low"}
            />

            <ModelExplanationPanel explanations={results?.explanations} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default SimulationPage;
=======
>>>>>>> feature/redis-telemetry-replay
