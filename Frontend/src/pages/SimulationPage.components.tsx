import { useRaceStore } from '../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useRef, useState } from 'react';
import { Settings, Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react';
import { SEASON_2026_DRIVERS } from '../data/season2026';
import { SEASON_2026_SCHEDULE } from '../data/season2026';
import { SEASON_2025_SCHEDULE } from '../data/season2025';
import { normalizeCircuitId } from '../utils/circuitIds';

// Components
import LapTimeChart from '../components/charts/LapTimeChart';
import RacePositionChart from '../components/charts/RacePositionChart';
import GapToLeaderChart from '../components/charts/GapToLeaderChart';
import PitStopTimeline from '../components/charts/PitStopTimeline';
import StrategyTimeline from '../components/charts/StrategyTimeline';

export { LapTimeChart, RacePositionChart, GapToLeaderChart, PitStopTimeline, StrategyTimeline };

export const SimulationProvider = ({ children }: { children: React.ReactNode }) => {
    const isPlaying = useRaceStore(useShallow(s => s.isPlaying));
    const playbackSpeed = useRaceStore(useShallow(s => s.playbackSpeed));
    const simulationResult = useRaceStore(useShallow(s => s.simulationResult));
    const context = useRaceStore(useShallow(s => s.context));
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!isPlaying) return;

        const totalLaps = simulationResult?.meta.totalLaps ?? context?.totalLaps ?? 58;

        intervalRef.current = setInterval(() => {
            const state = useRaceStore.getState();
            const nextLap = state.currentLap + 1;

            if (nextLap > totalLaps) {
                useRaceStore.setState({ isPlaying: false });
            } else {
                useRaceStore.setState({ currentLap: nextLap });
            }
        }, 1000 / playbackSpeed);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, playbackSpeed, simulationResult, context]);

    return <div className="min-h-screen w-full bg-black/20 text-white flex flex-col">{children}</div>;
};

export const SimulationLayout = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col lg:flex-row flex-1 border-t border-white/10">{children}</div>;

export const SimulationSidebar = ({
    children,
    isCollapsed: propIsCollapsed,
    onToggle
}: {
    children: React.ReactNode;
    isCollapsed?: boolean;
    onToggle?: () => void;
}) => {
    const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : false;

    return (
        <aside className={`${isCollapsed ? 'w-16 lg:w-16' : 'w-full lg:w-80'} shrink-0 transition-all duration-300 lg:border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col overflow-y-auto overflow-x-hidden relative lg:h-screen lg:sticky top-0 z-[50]`}>
            <button
                onClick={onToggle}
                className={`absolute top-6 ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-4'} text-white/40 hover:text-white transition-all duration-300 z-50 hover:scale-110 active:scale-90`}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {isCollapsed ? (
                <div className="flex flex-col items-center pt-20 gap-6">
                    <button className="p-2 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        <Settings className="w-4 h-4" />
                    </button>

                    <div className="w-6 h-px bg-white/10" />

                    <div className="flex flex-col gap-4">
                        <div className="group relative flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse" />
                            <div className="absolute left-full ml-4 px-2 py-1 bg-black text-[8px] text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 z-[100]">Live Context</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>

                    <div className="flex-1" />

                    <div className="pb-12 h-40 relative flex items-center justify-center">
                        <div className="text-[9px] text-white/10 font-mono -rotate-90 whitespace-nowrap tracking-[0.3em] uppercase select-none absolute">
                            INSTRUMENTATION
                        </div>
                    </div>
                </div>
            ) : (
                <div className="pt-0">
                    {children}
                </div>
            )}
        </aside>
    );
};

export const SidebarSection = ({ title, children, isFirst = false }: { title: string, children: React.ReactNode, isFirst?: boolean }) => (
    <div className={`p-4 border-b border-white/5 ${isFirst ? 'pt-6' : ''}`}>
        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-[#E10600] pl-2">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

export const SimulationMain = ({ children }: { children: React.ReactNode }) => <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">{children}</main>;
export const SimulationControlBar = ({ children }: { children: React.ReactNode }) => <div className="min-h-16 flex flex-wrap items-center px-4 lg:px-6 gap-2 lg:gap-4 bg-black/60 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5">{children}</div>;
export const ReplayTimeline = ({ children }: { children: React.ReactNode }) => <div className="min-h-24 border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 lg:px-6 py-4 flex flex-col justify-center gap-2 sticky top-16 z-40">{children}</div>;
export const SimulationViewport = ({ children }: { children: React.ReactNode }) => <div className="flex-1 relative p-0">{children}</div>;

export const ViewportTabs = ({ children }: { children: React.ReactNode }) => <div className="h-full flex flex-col">{children}</div>;

export const Tab = ({ label, children, className = "" }: { id?: string, label: string, children: React.ReactNode, className?: string }) => (
    <div className={`flex-1 border border-white/10 bg-white/5 backdrop-blur-sm p-4 rounded-sm relative overflow-hidden group ${className}`}>
        <div className="absolute top-0 left-0 px-3 py-1 bg-white/5 text-[10px] font-mono text-gray-400 uppercase">{label}</div>
        <div className="mt-6 h-full">{children}</div>
    </div>
);

export const SimulationInspector = ({ children }: { children: React.ReactNode }) => <aside className="w-96 border-l border-white/10 bg-white/5 backdrop-blur-md flex flex-col overflow-y-auto">{children}</aside>;
export const InspectorTabs = ({ children }: { children: React.ReactNode }) => <div className="p-4 space-y-4">{children}</div>;

// Input components
const TRACK_LAPS: Record<string, number> = {
    albert_park: 58,
    shanghai: 56,
    suzuka: 53,
    bahrain: 57,
    jeddah: 50,
    miami: 57,
    imola: 63,
    monaco: 78,
    catalunya: 66,
    montreal: 70,
    spielberg: 71,
    silverstone: 52,
    spa: 44,
    hungaroring: 70,
    zandvoort: 72,
    monza: 53,
    baku: 51,
    marina_bay: 62,
    cota: 56,
    mexico_city: 71,
    interlagos: 71,
    las_vegas: 50,
    lusail: 57,
    yas_marina: 58,
};

const SEASON_2025_DRIVER_IDS = [
    'VER', 'NOR', 'LEC', 'HAM', 'SAI', 'PIA', 'RUS', 'PER', 'ALO', 'STR',
    'GAS', 'OCO', 'ALB', 'TSU', 'HUL', 'MAG', 'BOT', 'ZHO', 'RIC', 'SAR'
];

export const SeasonSelect = () => {
    const context = useRaceStore(useShallow(s => s.context));
    const loadRaceContext = useRaceStore(s => s.loadRaceContext);

    return (
        <select
            className="w-full bg-black border border-white/20 p-2 text-xs rounded text-white"
            value={context?.season ?? 2026}
            onChange={(e) => {
                const season = Number(e.target.value);
                const schedule = season === 2026 ? SEASON_2026_SCHEDULE : SEASON_2025_SCHEDULE;
                const firstRace = schedule[0];
                const circuitId = normalizeCircuitId(firstRace.circuit);
                loadRaceContext({
                    season,
                    round: firstRace.round,
                    raceName: firstRace.raceName,
                    circuitId,
                    totalLaps: TRACK_LAPS[circuitId] || 58
                });
            }}
        >
            <option value={2026}>2026 Season</option>
            <option value={2025}>2025 Season</option>
        </select>
    );
};

export const RaceSelect = () => {
    const context = useRaceStore(useShallow(s => s.context));
    const loadRaceContext = useRaceStore(s => s.loadRaceContext);
    const season = context?.season ?? 2026;
    const schedule = season === 2026 ? SEASON_2026_SCHEDULE : SEASON_2025_SCHEDULE;

    return (
        <select
            className="w-full bg-black border border-white/20 p-2 text-xs rounded text-white"
            value={context?.round ?? schedule[0].round}
            onChange={(e) => {
                const round = Number(e.target.value);
                const race = schedule.find(r => r.round === round) || schedule[0];
                const circuitId = normalizeCircuitId(race.circuit);
                loadRaceContext({
                    season,
                    round: race.round,
                    raceName: race.raceName,
                    circuitId,
                    totalLaps: TRACK_LAPS[circuitId] || 58
                });
            }}
        >
            {schedule.map(r => (
                <option key={r.round} value={r.round}>
                    R{r.round} - {r.raceName}
                </option>
            ))}
        </select>
    );
};

export const TrackInfoBadge = () => {
    const context = useRaceStore(useShallow(s => s.context));
    return (
        <div className="text-[10px] text-gray-500 font-mono uppercase">
            {context?.circuitId?.replace(/_/g, ' ') || 'ALBERT PARK'} | {context?.totalLaps ?? 58} LAPS
        </div>
    );
};

export const DriverSelector = () => {
    const currentFrame = useRaceStore(useShallow(s => s.currentFrame));
    const simulationResult = useRaceStore(useShallow(s => s.simulationResult));
    const context = useRaceStore(useShallow(s => s.context));
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));
    const selectDriver = useRaceStore(s => s.selectDriver);

    const drivers = currentFrame
        ? Object.values(currentFrame.drivers).sort((a, b) => a.position - b.position)
        : simulationResult
            ? Object.values(simulationResult.baseline.drivers)
                .sort((a, b) => a.finishPosition - b.finishPosition)
                .map(d => ({
                    driverId: d.driverId,
                    name: d.driverId,
                    teamId: 'FIELD',
                    position: d.finishPosition
                }))
            : (context?.season === 2026
                ? SEASON_2026_DRIVERS.map((d, idx) => ({
                    driverId: d.id.toUpperCase(),
                    name: d.name,
                    teamId: d.teamId.toUpperCase(),
                    position: idx + 1
                }))
                : SEASON_2025_DRIVER_IDS.map((id, idx) => ({
                    driverId: id,
                    name: id,
                    teamId: 'FIELD',
                    position: idx + 1
                })));

    return (
        <select
            className="w-full bg-black border border-white/20 p-2 text-xs rounded text-white"
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
    );
};

export const TyreDegMultiplier = () => {
    const value = useRaceStore(useShallow(s => s.config.tyreDegMultiplier));
    const updateConfig = useRaceStore(s => s.updateConfig);
    return (
        <div className="bg-white/5 p-3 rounded border border-white/5">
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
        <div className="bg-white/5 p-3 rounded border border-white/5">
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
        <div className="bg-white/5 p-3 rounded border border-white/5">
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
        <div className="bg-white/5 p-3 rounded border border-white/5">
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

export const AdvancedSettings = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 p-2 text-[10px] uppercase font-black text-white/40 mb-2 bg-white/5 border border-white/10 rounded"
            >
                <span className="flex items-center gap-2">
                <Settings className="w-3 h-3 text-[#E10600]" />
                Advanced Parameters
                </span>
                <span className="text-white/60">{open ? 'Hide' : 'Show'}</span>
            </button>
            {open && <div className="space-y-4 pl-2 border-l border-white/10">{children}</div>}
        </div>
    );
};

export const PitStrategyEditor = () => <button className="w-full bg-white/5 border border-white/10 p-2 text-[10px] uppercase font-bold text-gray-400 hover:bg-white/10">Edit Strategy</button>;
export const DisableSafetyCarToggle = () => {
    const value = useRaceStore(useShallow(s => s.config.enableSafetyCar));
    const updateConfig = useRaceStore(s => s.updateConfig);
    return (
        <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-gray-400">
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateConfig({ enableSafetyCar: e.target.checked })}
                className="accent-[#E10600]"
            />
            Enable Safety Car
        </div>
    );
};
export const OverrideGridPositions = () => <button className="w-full bg-white/5 border border-white/10 p-2 text-[10px] uppercase font-bold text-gray-400 hover:bg-white/10">Override Grid</button>;

export const RunSimulationButton = () => {
    const runSimulation = useRaceStore(s => s.runSimulation);
    return (
        <button
            onClick={() => runSimulation()}
            className="bg-[#E10600] text-white px-4 py-2 font-bold text-xs uppercase hover:bg-red-700 transition-colors shadow-lg shadow-[#E10600]/20 min-w-[128px] text-center"
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
            className={`px-4 py-2 font-bold text-xs uppercase border border-white/10 transition-colors min-w-[112px] sm:w-32 flex items-center justify-center gap-2 ${isPlaying ? 'bg-[#E10600] text-white border-[#E10600]' : 'bg-white/5 text-white hover:bg-white/10'
                }`}
        >
            {isPlaying ? (
                <>
                    <Pause className="w-3 h-3" /> Pause
                </>
            ) : (
                <>
                    <Play className="w-3 h-3" /> Replay
                </>
            )}
        </button>
    );
};

export const PlaybackSpeedSlider = () => {
    const speed = useRaceStore(useShallow(s => s.playbackSpeed));
    const setPlaybackSpeed = useRaceStore(s => s.setPlaybackSpeed);
    return (
        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-sm border border-white/10 w-full sm:w-auto sm:min-w-[220px]">
            <span className="text-[10px] font-bold text-white uppercase whitespace-nowrap">Speed: {speed}x</span>
            <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={speed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="w-full accent-[#E10600] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
};

export const ResetSimulationButton = () => {
    const [confirming, setConfirming] = useState(false);
    return confirming ? (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#E10600]">ARE YOU SURE?</span>
            <button onClick={() => window.location.reload()} className="text-white text-[10px] font-bold hover:underline">YES</button>
            <button onClick={() => setConfirming(false)} className="text-gray-500 text-[10px] font-bold hover:underline">NO</button>
        </div>
    ) : (
        <button
            onClick={() => setConfirming(true)}
            className="bg-transparent text-gray-400 px-4 py-2 font-bold text-xs uppercase hover:text-white"
        >
            Reset
        </button>
    );
};

export const SimulationStatusIndicator = () => {
    const simulationState = useRaceStore(useShallow(s => s.simulationState));
    const isPlaying = useRaceStore(useShallow(s => s.isPlaying));

    let status = "READY";
    let color = "text-gray-500";

    switch (simulationState) {
        case "running":
            status = "SIMULATING...";
            color = "text-[#E10600] animate-pulse";
            break;
        case "complete":
            status = isPlaying ? "PLAYING" : "COMPLETE";
            color = isPlaying ? "text-green-500" : "text-white";
            break;
        case "sample":
            status = "SAMPLE DATA";
            color = "text-yellow-500";
            break;
        case "error":
            status = "ERROR";
            color = "text-red-500";
            break;
    }

    return <div className={`w-full sm:w-auto sm:ml-auto text-right text-[10px] font-mono font-bold ${color}`}>{status}</div>;
};

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

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="text-xs text-center font-mono text-white flex justify-between w-full px-1">
            <span>Lap {currentLap} / {totalLaps}</span>
            <span>{formatTime(currentLap * 90)} / {formatTime(totalLaps * 90)}</span>
        </div>
    );
};

export const RaceOutcomeTable = () => <div className="h-32 bg-white/5 rounded border border-white/5"></div>;
export const PodiumPrediction = () => <div className="h-20 bg-white/5 rounded border border-white/5"></div>;

export const SimulationStateJSON = () => {
    const currentFrame = useRaceStore(useShallow(s => s.currentFrame));
    const currentLap = useRaceStore(useShallow(s => s.currentLap));
    const debugView = { cursor: { lap: currentLap }, frame: currentFrame || "No Data" };
    return <pre className="text-[10px] text-gray-400 font-mono overflow-auto h-full p-2">{JSON.stringify(debugView, null, 2)}</pre>;
};
