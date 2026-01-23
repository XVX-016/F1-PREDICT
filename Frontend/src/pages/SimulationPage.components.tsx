
// Placeholder components for the SimulationPage layout
// These will be fleshed out in subsequent steps
import { useRaceStore } from '../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

import { useEffect } from 'react';

export const SimulationProvider = ({ children }: { children: React.ReactNode }) => {
    // Global Playback Loop
    useEffect(() => {
        const store = useRaceStore;

        // Subscribe to store changes to handle interval management
        const unsubscribe = store.subscribe((state, prevState) => {
            if (state.isPlaying !== prevState.isPlaying || state.playbackSpeed !== prevState.playbackSpeed) {
                // Re-evaluate interval
            }
        });

        const interval = setInterval(() => {
            const { isPlaying, playbackSpeed, currentLap, context, togglePlay, setCursor } = store.getState();

            if (!isPlaying) return;

            const totalLaps = context?.totalLaps ?? 70; // Default for testing
            const nextLap = currentLap + 1;

            if (nextLap > totalLaps) {
                togglePlay(); // Pause at end
            } else {
                setCursor(nextLap);
            }
        }, 1000 / store.getState().playbackSpeed);

        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, []);

    return <div className="h-screen w-full bg-[#0B0E11] text-white overflow-hidden flex flex-col pt-16">{children}</div>;
};
export const SimulationLayout = ({ children }: { children: React.ReactNode }) => <div className="flex flex-1 overflow-hidden">{children}</div>;

export const SimulationSidebar = ({ children }: { children: React.ReactNode }) => <aside className="w-80 border-r border-white/10 bg-[#141821] flex flex-col overflow-y-auto">{children}</aside>;
export const SidebarSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="p-4 border-b border-white/5">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-[#E10600] pl-2">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

export const SimulationMain = ({ children }: { children: React.ReactNode }) => <main className="flex-1 flex flex-col min-w-0 bg-[#0B0E11]">{children}</main>;
export const SimulationControlBar = ({ children }: { children: React.ReactNode }) => <div className="h-16 border-b border-white/10 flex items-center px-6 gap-4 bg-[#141821]">{children}</div>;
export const ReplayTimeline = ({ children }: { children: React.ReactNode }) => <div className="h-24 border-b border-white/10 bg-[#0F1216] px-6 py-4 flex flex-col justify-center gap-2">{children}</div>;
export const SimulationViewport = ({ children }: { children: React.ReactNode }) => <div className="flex-1 relative p-6 overflow-hidden">{children}</div>;
export const ViewportTabs = ({ children }: { children: React.ReactNode }) => <div className="h-full flex flex-col">{children}</div>;
export const Tab = ({ id, label, children }: { id: string, label: string, children: React.ReactNode }) => (
    <div className="flex-1 border border-white/10 bg-[#1A1D24] p-4 rounded-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 px-3 py-1 bg-white/5 text-[10px] font-mono text-gray-400 uppercase">{label}</div>
        <div className="mt-6 h-full">{children}</div>
    </div>
);

export const SimulationInspector = ({ children }: { children: React.ReactNode }) => <aside className="w-96 border-l border-white/10 bg-[#141821] flex flex-col overflow-y-auto">{children}</aside>;
export const InspectorTabs = ({ children }: { children: React.ReactNode }) => <div className="p-4 space-y-4">{children}</div>;


// Input Placeholders
export const SeasonSelect = () => <select className="w-full bg-black border border-white/20 p-2 text-xs rounded"><option>2024 Season</option></select>;
export const RaceSelect = () => <select className="w-full bg-black border border-white/20 p-2 text-xs rounded"><option>Japanese Grand Prix</option></select>;
export const TrackInfoBadge = () => <div className="text-[10px] text-gray-500 font-mono">SUZUKA INTERNATIONAL RACING COURSE</div>;

export const DriverSelector = () => {
    const currentFrame = useRaceStore(useShallow(s => s.currentFrame));
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));
    const selectDriver = useRaceStore(s => s.selectDriver);

    const drivers = currentFrame ? Object.values(currentFrame.drivers).sort((a, b) => a.position - b.position) : [];

    return (
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-400">Driver Focus</label>
            <select
                className="w-full bg-[#141821] border border-white/20 p-2 text-xs rounded text-white"
                value={selectedDriverId || ""}
                onChange={(e) => selectDriver(e.target.value || null)}
            >
                <option value="">-- Global View --</option>
                {drivers.map(d => (
                    <option key={d.driverId} value={d.driverId}>
                        P{d.position} - {d.name} ({d.teamId})
                    </option>
                ))}
            </select>
        </div>
    );
};

export const TyreDegMultiplier = () => {
    const value = useRaceStore(useShallow(s => s.config.tyreDegMultiplier));
    const updateConfig = useRaceStore(s => s.updateConfig);
    return (
        <div className="bg-[#141821] p-3 rounded border border-white/5">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] uppercase font-bold text-gray-400">Tyre Degradation</label>
                <span className="text-xs font-mono text-[#E10600]">{value.toFixed(2)}x</span>
            </div>
            <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={value}
                onChange={(e) => updateConfig({ tyreDegMultiplier: Number(e.target.value) })}
                className="w-full accent-[#E10600] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
};
export const FuelBurnRate = () => {
    const value = useRaceStore(useShallow(s => s.config.fuelBurnMultiplier));
    const updateConfig = useRaceStore(s => s.updateConfig);
    return (
        <div className="bg-[#141821] p-3 rounded border border-white/5">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] uppercase font-bold text-gray-400">Fuel Burn Rate</label>
                <span className="text-xs font-mono text-[#E10600]">{value.toFixed(2)}x</span>
            </div>
            <input
                type="range"
                min={0.8}
                max={1.2}
                step={0.01}
                value={value}
                onChange={(e) => updateConfig({ fuelBurnMultiplier: Number(e.target.value) })}
                className="w-full accent-[#E10600] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
};
export const SafetyCarProbability = () => {
    const value = useRaceStore(useShallow(s => s.config.scProbability));
    const updateConfig = useRaceStore(s => s.updateConfig);
    return (
        <div className="bg-[#141821] p-3 rounded border border-white/5">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] uppercase font-bold text-gray-400">SC Probability</label>
                <span className="text-xs font-mono text-[#E10600]">{(value * 100).toFixed(0)}%</span>
            </div>
            <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value}
                onChange={(e) => updateConfig({ scProbability: Number(e.target.value) })}
                className="w-full accent-[#E10600] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
};
export const WeatherVariance = () => {
    const value = useRaceStore(useShallow(s => s.config.weatherVariance));
    const updateConfig = useRaceStore(s => s.updateConfig);
    return (
        <div className="bg-[#141821] p-3 rounded border border-white/5">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] uppercase font-bold text-gray-400">Weather Variance</label>
                <span className="text-xs font-mono text-[#E10600]">{value.toFixed(1)}</span>
            </div>
            <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={value}
                onChange={(e) => updateConfig({ weatherVariance: Number(e.target.value) })}
                className="w-full accent-[#E10600] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
};

export const PitStrategyEditor = () => <button className="w-full bg-white/5 border border-white/10 p-2 text-xs hover:bg-white/10">Edit Strategy</button>;
export const DisableSafetyCarToggle = () => <div className="flex items-center gap-2 text-xs"><input type="checkbox" /> Disable SC</div>;
export const OverrideGridPositions = () => <button className="w-full bg-white/5 border border-white/10 p-2 text-xs hover:bg-white/10">Override Grid</button>;

export const FastF1Status = () => <div className="text-[10px] text-green-500">● FastF1 Connected</div>;
export const RedisReplayStatus = () => <div className="text-[10px] text-green-500">● Redis Replay Ready</div>;

// Control Placeholders
export const RunSimulationButton = () => {
    const runSimulation = useRaceStore(s => s.runSimulation);
    // Add simple loading state if needed, for now just fire and forget
    const handleClick = () => {
        runSimulation();
    };

    return (
        <button
            onClick={handleClick}
            className="bg-[#E10600] text-white px-4 py-2 font-bold text-xs uppercase hover:bg-red-700 transition-colors"
        >
            Run Simulation
        </button>
    );
};
export const ReplayToggle = () => {
    const isPlaying = useRaceStore(useShallow(s => s.isPlaying));
    const togglePlay = useRaceStore(s => s.togglePlay);

    return (
        <button
            onClick={togglePlay}
            className={`px-4 py-2 font-bold text-xs uppercase border border-white/10 transition-colors w-32 flex items-center justify-center gap-2 ${isPlaying ? 'bg-[#E10600] text-white border-[#E10600]' : 'bg-white/5 text-white hover:bg-white/10'
                }`}
        >
            {isPlaying ? (
                <><span>⏸</span> Pause</>
            ) : (
                <><span>▶</span> Play Replay</>
            )}
        </button>
    );
};
export const ResetSimulationButton = () => <button className="bg-transparent text-gray-400 px-4 py-2 font-bold text-xs uppercase hover:text-white">Reset</button>;
export const SimulationStatusIndicator = () => <div className="ml-auto text-[10px] font-mono text-gray-500">IDLE</div>;

// Timeline Placeholders
export const LapScrubber = () => {
    const currentLap = useRaceStore(useShallow(s => s.currentLap));
    const totalLaps = useRaceStore(useShallow(s => s.context?.totalLaps ?? 70));
    const setCursor = useRaceStore(s => s.setCursor);

    return (
        <div className="relative w-full h-6 flex items-center">
            <input
                type="range"
                min={1}
                max={totalLaps}
                value={currentLap}
                onChange={(e) => setCursor(Number(e.target.value))}
                className="w-full accent-[#E10600] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer z-10 relative"
            />
            {/* Progress Fill Hack (since standard input range doesn't always support fill styling easily across browsers) */}
            <div
                className="absolute h-1 bg-[#E10600] rounded-l-lg top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ width: `${(currentLap / totalLaps) * 100}%` }}
            />
        </div>
    );
};
export const TimeScrubber = () => {
    const currentLap = useRaceStore(useShallow(s => s.currentLap));
    const totalLaps = useRaceStore(useShallow(s => s.context?.totalLaps ?? 70));

    // Mock time calculation for now (approx 90s per lap)
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentTime = currentLap * 90;
    const totalTime = totalLaps * 90;

    return (
        <div className="text-xs text-center font-mono text-gray-500 flex justify-between w-full px-1">
            <span>Lap {currentLap} / {totalLaps}</span>
            <span>{formatTime(currentTime)} / {formatTime(totalTime)}</span>
        </div>
    );
};

// Component Placeholders
import LapTimeChart from '../components/charts/LapTimeChart';

export const RacePositionChart = () => <div className="h-full flex items-center justify-center text-gray-600 text-xs">Chart: Race Positions</div>;
export { LapTimeChart }; // Export the imported component
export const GapToLeaderChart = () => <div className="h-full flex items-center justify-center text-gray-600 text-xs">Chart: Gaps</div>;
export const PitStopTimeline = () => <div className="h-full flex items-center justify-center text-gray-600 text-xs">Chart: Strategy</div>;

export const RaceOutcomeTable = () => <div className="h-32 bg-black/20 mb-4 rounded border border-white/5"></div>;
export const PodiumPrediction = () => <div className="h-20 bg-black/20 rounded border border-white/5"></div>;
export const CounterfactualDeltaTable = () => <div className="h-32 bg-black/20 mb-4 rounded border border-white/5"></div>;
export const WhatChangedExplanation = () => <div className="text-xs text-gray-500">Explanation...</div>;
export const PhysicsVsMLChart = () => <div className="h-32 bg-black/20 mb-4 rounded border border-white/5"></div>;
export const ResidualErrorStats = () => <div className="text-xs text-gray-500">Residuals...</div>;
export const SimulationStateJSON = () => {
    const currentFrame = useRaceStore(useShallow(s => s.currentFrame));
    const currentLap = useRaceStore(useShallow(s => s.currentLap));

    // Create a debug view object
    const debugView = {
        cursor: { lap: currentLap },
        frame: currentFrame || "No Data (Run Sim or Scrub)"
    };

    return <pre className="text-[10px] text-gray-400 font-mono overflow-auto h-full p-2">{JSON.stringify(debugView, null, 2)}</pre>;
};
