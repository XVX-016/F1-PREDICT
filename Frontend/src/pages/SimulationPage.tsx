import {
    SimulationProvider,
    SimulationLayout,
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
    LapTimeChart,
    GapToLeaderChart
} from './SimulationPage.components';
import SafetyCarTimelineChart from '../components/charts/SafetyCarTimelineChart';

import { useEffect, useState } from 'react';
import { useRaceStore } from '../stores/raceStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type StrategyEditorConfig = {
    name: string;
    openingCompound: 'medium' | 'soft' | 'hard';
    closingCompound: 'medium' | 'soft' | 'hard';
    pitLap: number;
};

type StrategyResult = {
    name: string;
    stints: Array<{ compound: 'medium' | 'soft' | 'hard'; end_lap: number }>;
    expected_time_loss: number;
    risk_score: number;
    robustness: number;
};

type ComparisonPayload = {
    race_id: string;
    baseline: {
        win_probability: Record<string, number>;
        pace_distributions: Record<string, { p10: number; p50: number; p90: number }>;
        robustness_score: Record<string, number>;
    };
    challenger: {
        win_probability: Record<string, number>;
        pace_distributions: Record<string, { p10: number; p50: number; p90: number }>;
        robustness_score: Record<string, number>;
    };
    delta: {
        focus_driver: string;
        win_probability: number;
        median_race_time_ms: number;
        risk_spread: number;
    };
};

const toStrategy = (config: StrategyEditorConfig, totalLaps: number): StrategyResult => ({
    name: config.name,
    stints: [
        { compound: config.openingCompound, end_lap: config.pitLap },
        { compound: config.closingCompound, end_lap: totalLaps },
    ],
    expected_time_loss: 0,
    risk_score: 0,
    robustness: 0,
});

export default function SimulationPage() {
    const [isMobile, setIsMobile] = useState(false);
    const context = useRaceStore((s) => s.context);
    const selectedDriverId = useRaceStore((s) => s.selectedDriverId);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);
    const [comparisonResults, setComparisonResults] = useState<ComparisonPayload | null>(null);
    const [baselineConfig, setBaselineConfig] = useState<StrategyEditorConfig>({ name: 'Config A', openingCompound: 'medium', closingCompound: 'hard', pitLap: 18 });
    const [challengerConfig, setChallengerConfig] = useState<StrategyEditorConfig>({ name: 'Config B', openingCompound: 'medium', closingCompound: 'hard', pitLap: 22 });

    useEffect(() => {
        const applyMobileLayout = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        applyMobileLayout();
        window.addEventListener('resize', applyMobileLayout);
        return () => window.removeEventListener('resize', applyMobileLayout);
    }, []);

    const runComparison = async () => {
        setComparisonLoading(true);
        setComparisonError(null);

        try {
            const focusDriver = selectedDriverId || 'VER';
            const totalLaps = context?.totalLaps ?? 58;
            const raceId = context?.circuitId || 'bahrain';
            const body = {
                track_id: raceId,
                iterations: 500,
                seed: 42,
                use_ml: true,
                params: {
                    focus_driver: focusDriver,
                },
                strategies: [
                    toStrategy(baselineConfig, totalLaps),
                    toStrategy(challengerConfig, totalLaps),
                ],
            };

            const response = await fetch(`${API_BASE}/api/races/${raceId}/compare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const detail = await response.text();
                throw new Error(detail || 'Comparison request failed');
            }

            setComparisonResults(await response.json());
        } catch (error) {
            setComparisonError(error instanceof Error ? error.message : 'Comparison request failed');
        } finally {
            setComparisonLoading(false);
        }
    };

    return (
        <SimulationProvider>
            <div className="px-4 lg:px-6 pt-20 lg:pt-24 pb-4 lg:pb-6 border-b border-white/5 bg-black/40 relative z-10">
                <header className="border-l-4 border-[#E10600] pl-4 lg:pl-6 py-1">
                    <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase italic">
                        <span className="text-[#E10600]">Race</span> Simulation
                    </h1>
                </header>
                <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.1fr_1.1fr_1.4fr] gap-4">
                    {[baselineConfig, challengerConfig].map((config, index) => (
                        <div key={config.name} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{index === 0 ? 'Baseline Strategy' : 'Challenger Strategy'}</div>
                            <input
                                value={config.name}
                                onChange={(e) => (index === 0 ? setBaselineConfig({ ...config, name: e.target.value }) : setChallengerConfig({ ...config, name: e.target.value }))}
                                className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={config.openingCompound}
                                    onChange={(e) => (index === 0 ? setBaselineConfig({ ...config, openingCompound: e.target.value as StrategyEditorConfig['openingCompound'] }) : setChallengerConfig({ ...config, openingCompound: e.target.value as StrategyEditorConfig['openingCompound'] }))}
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-xs text-white"
                                >
                                    <option value="soft">Soft</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                                <select
                                    value={config.closingCompound}
                                    onChange={(e) => (index === 0 ? setBaselineConfig({ ...config, closingCompound: e.target.value as StrategyEditorConfig['closingCompound'] }) : setChallengerConfig({ ...config, closingCompound: e.target.value as StrategyEditorConfig['closingCompound'] }))}
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-xs text-white"
                                >
                                    <option value="soft">Soft</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">
                                    <span>Pit Lap</span>
                                    <span>L{config.pitLap}</span>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={Math.max(6, (context?.totalLaps ?? 58) - 5)}
                                    value={config.pitLap}
                                    onChange={(e) => (index === 0 ? setBaselineConfig({ ...config, pitLap: Number(e.target.value) }) : setChallengerConfig({ ...config, pitLap: Number(e.target.value) }))}
                                    className="w-full accent-[#E10600]"
                                />
                            </div>
                        </div>
                    ))}
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-2">Strategy Delta</div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-3">Pit Lap 18 vs 22 style head-to-head</h2>
                            <p className="text-xs text-white/60 leading-relaxed">
                                Runs both strategies under the same seed and race context so the delta reflects pit timing and compound choice, not random drift.
                            </p>
                        </div>
                        <div className="mt-4 space-y-3">
                            <button
                                onClick={runComparison}
                                disabled={comparisonLoading}
                                className="w-full bg-[#E10600] text-white px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-60"
                            >
                                {comparisonLoading ? 'Comparing...' : 'Run Side-by-Side Comparison'}
                            </button>
                            {comparisonError && <div className="text-xs text-red-400">{comparisonError}</div>}
                            {comparisonResults && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-[9px] uppercase tracking-widest text-white/40">Win Delta</div>
                                        <div className="text-lg font-black text-white">{(comparisonResults.delta.win_probability * 100).toFixed(1)}%</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-[9px] uppercase tracking-widest text-white/40">Median Time</div>
                                        <div className="text-lg font-black text-white">{(comparisonResults.delta.median_race_time_ms / 1000).toFixed(2)}s</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-[9px] uppercase tracking-widest text-white/40">Risk Spread</div>
                                        <div className="text-lg font-black text-white">{comparisonResults.delta.risk_spread.toFixed(3)}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <SimulationLayout>
                <SimulationMain>
                    <SimulationControlBar>
                        <RunSimulationButton />
                        <ReplayToggle />
                        <PlaybackSpeedSlider />
                        <ResetSimulationButton />
                        <SimulationStatusIndicator />
                    </SimulationControlBar>

                    <div className="border-b border-white/10 bg-black/55 backdrop-blur-xl px-4 lg:px-6 py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Season</div>
                                <SeasonSelect />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Race</div>
                                <RaceSelect />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Driver Focus</div>
                                <DriverSelector />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center">
                                <TrackInfoBadge />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                            <TyreDegMultiplier />
                            <FuelBurnRate />
                            <SafetyCarProbability />
                            <WeatherVariance />
                        </div>

                        <AdvancedSettings>
                            <PitStrategyEditor />
                            <DisableSafetyCarToggle />
                            <OverrideGridPositions />
                        </AdvancedSettings>
                    </div>

                    <ReplayTimeline>
                        <LapScrubber />
                        <TimeScrubber />
                    </ReplayTimeline>

                    <SimulationViewport>
                        <div className="mx-auto w-full max-w-[1500px] p-3 sm:p-4 lg:p-6 pt-6 lg:pt-8">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 items-stretch">
                                <div className="h-[340px] sm:h-[380px] lg:h-[460px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset">
                                    <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">01 // Lap Pace (Baseline vs Counterfactual)</span>
                                        <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: MS / LAP</span>
                                    </div>
                                    <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6">
                                        <LapTimeChart />
                                    </div>
                                </div>

                                <div className="h-[340px] sm:h-[380px] lg:h-[460px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset">
                                    <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">02 // Field Compression (Gap to Leader)</span>
                                        <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: SEC / GAP</span>
                                    </div>
                                    <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6">
                                        <GapToLeaderChart />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 lg:mt-6 h-[300px] sm:h-[340px] lg:h-[380px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset">
                                <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">03 // Safety Car Timeline</span>
                                    <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: LAP STATE</span>
                                </div>
                                <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6">
                                    <SafetyCarTimelineChart />
                                </div>
                            </div>
                        </div>
                    </SimulationViewport>
                </SimulationMain>
            </SimulationLayout>

            <div className={`pb-16 lg:pb-24 flex flex-col items-center justify-center ${isMobile ? 'mt-10' : 'mt-20 lg:mt-32'}`}>
                <div className="h-px w-full max-w-7xl bg-white/10 mb-16" />
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] leading-relaxed font-mono text-center max-w-2xl px-8">
                    Physics Sandbox: These charts reflect deterministic trajectories under selected parameters.
                    Probabilistic aggregates (Win %, Podium Likelihood) are restricted to the <span className="text-white/40 font-bold decoration-[#E10600] underline underline-offset-4 cursor-pointer hover:text-white" onClick={() => (window.location.hash = '/intelligence')}>Intelligence Page</span>.
                </p>
            </div>
        </SimulationProvider>
    );
}
