import { useState } from 'react';
import {
    SimulationLayout,
    SimulationSidebar,
    SimulationMain,
} from './SimulationPage.components';
import { Play, Pause, Info } from 'lucide-react';
import { useReplay } from '../hooks/useReplay';
import { TrackMap } from '../components/replay/TrackMap';
import { DriverReplayState } from '../adapters/ReplayAdapter';

// --- Overlay Components (Repo Design) ---

const LeaderboardOverlay = ({ drivers }: { drivers: DriverReplayState[] }) => (
    <div className="absolute top-4 right-4 w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold uppercase text-white/60 tracking-widest">Leaderboard</span>
            <span className="text-[10px] font-mono font-bold text-[#E10600]">{drivers.length} Cars</span>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {drivers.map((d) => (
                <div key={d.driverId} className="flex items-center justify-between p-1.5 hover:bg-white/10 rounded transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`w-1 h-6 rounded-sm ${d.teamColor || 'bg-white/20'}`} style={{ backgroundColor: d.teamColor }} />
                        <span className="text-xs font-mono font-black text-white/40 w-4 text-right">{d.position}</span>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase leading-none tracking-tight">{d.name}</span>
                            <span className="text-[8px] font-mono text-white/40 uppercase">{d.teamName}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        {/* Gap logic would go here */}
                        <span className={`text-[8px] font-bold px-1 rounded ${d.compound === 'S' ? 'text-red-500 bg-red-500/10' : d.compound === 'M' ? 'text-yellow-500 bg-yellow-500/10' : 'text-white bg-white/10'}`}>
                            {d.compound}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const TelemetryOverlay = ({ driver }: { driver: DriverReplayState | null }) => {
    if (!driver) return null;
    return (
        <div className="absolute bottom-24 left-4 w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                    {/* Placeholder for driver face */}
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs">{driver.driverId}</div>
                </div>
                <div>
                    <div className="text-sm font-black uppercase tracking-tighter">{driver.name}</div>
                    <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{driver.teamName}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Speed</div>
                    <div className="text-2xl font-mono font-black text-white">{driver.speed.toFixed(0)} <span className="text-[10px] text-white/40">KPH</span></div>
                </div>
                <div>
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Gear</div>
                    <div className="text-2xl font-mono font-black text-[#E10600]">{driver.gear}</div>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase">
                    <span>Throttle</span>
                    <span>{driver.throttle}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${driver.throttle}%` }} />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase">
                    <span>Brake</span>
                    <span>{driver.brake}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${driver.brake}%` }} />
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${driver.drs ? 'bg-green-500 text-black' : 'bg-white/10 text-white/20'}`}>
                    DRS {driver.drs ? 'OPEN' : 'CLOSED'}
                </div>
                <div className="text-[9px] font-mono text-white/40">L{driver.tyreLife} LAPS</div>
            </div>
        </div>
    );
}

const TimelineScrubber = ({
    currentTime,
    maxTime,
    onScrub,
    playing,
    setPlaying,
    speed,
    setSpeed
}: any) => (
    <div className="absolute bottom-6 left-4 right-4 h-14 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full px-6 flex items-center gap-6">
        <button
            onClick={() => setPlaying(!playing)}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
        >
            {playing ? <Pause className="fill-black w-3 h-3" /> : <Play className="fill-black w-3 h-3 ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center gap-1 group">
            <input
                type="range"
                min={0}
                max={maxTime || 1}
                value={currentTime}
                onChange={(e) => onScrub(Number(e.target.value))} // Need to adapt scrubToLap or use currentTime setter directly
                className="w-full accent-[#E10600] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all"
            />
            <div className="flex justify-between text-[9px] font-mono text-white/30 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{(currentTime / 60).toFixed(2)}</span>
                <span>{(maxTime / 60).toFixed(2)}</span>
            </div>
        </div>

        <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
            {[1, 5, 10, 20].map(s => (
                <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 rounded-full text-[9px] font-mono font-bold transition-all ${speed === s ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                >
                    {s}x
                </button>
            ))}
        </div>
    </div>
);

const ReplayPage = () => {
    const [selectedRace, setSelectedRace] = useState('Japan');
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true); // Default collapsed for max view
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

    const {
        state,
        playing,
        setPlaying,
        speed,
        setSpeed,
        setCurrentTime,
        loading,
        currentTime,
        maxTime
    } = useReplay(selectedRace);

    const driversSorted = state?.drivers
        ? Object.values(state.drivers).sort((a, b) => a.position - b.position)
        : [];

    const activeDriver = selectedDriverId && state?.drivers[selectedDriverId]
        ? state.drivers[selectedDriverId]
        : driversSorted.length > 0 ? driversSorted[0] : null;

    return (
        <div className="min-h-screen w-full text-white flex flex-col pt-16 bg-[#0a0a0a]">
            <SimulationLayout>
                <SimulationSidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
                >
                    <div className="p-6">
                        <div className="mb-8">
                            <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.2em] mb-4">Archive</h3>
                            <button className="w-full text-left p-3 rounded bg-[#E10600]/10 border border-[#E10600]/40 text-white">
                                <div className="text-[10px] font-mono font-bold uppercase tracking-tighter">JPN - Suzuka</div>
                                <div className="text-[8px] font-mono text-white/40 mt-1">2024 • ROUND 4</div>
                            </button>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/5 rounded">
                            <div className="flex items-center gap-2 mb-2 text-[#E10600]">
                                <Info className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase">Replay Engine</span>
                            </div>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                                Deterministic playback of historical telemetry.
                                <br /><br />
                                <span className="text-white/20">VERIFIED DATA SOURCE</span>
                            </p>
                        </div>
                    </div>
                </SimulationSidebar>

                <SimulationMain>
                    <div className="relative w-full h-[calc(100vh-4rem)] bg-black overflow-hidden flex flex-col">

                        {/* 1. Main Canvas Area (Track Map) */}
                        <div className="absolute inset-0 z-0">
                            {/* We can pass activeDriver to highlight them on map */}
                            <TrackMap drivers={Object.values(state?.drivers || {})} />
                        </div>

                        {/* 2. Top Bar (Overlay) */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">
                                    <span className="text-[#E10600]">Race</span> Replay
                                </h1>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="bg-black/50 backdrop-blur px-2 py-1 border border-white/10 rounded text-[10px] font-mono font-bold">
                                        LAP <span className="text-[#E10600] text-lg">{state?.currentLap || 1}</span> <span className="text-white/40">/ {state?.totalLaps || 53}</span>
                                    </div>
                                    <div className={`text-[10px] font-mono font-bold uppercase tracking-widest ${loading ? 'text-yellow-500' : 'text-[#4ade80]'}`}>
                                        {loading ? 'BUFFERING' : 'LIVE'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Leaderboard Overlay (Right) */}
                        <div className="z-10 pointer-events-auto">
                            <LeaderboardOverlay drivers={driversSorted} />
                        </div>

                        {/* 4. Telemetry Overlay (Left) */}
                        <div className="z-10 pointer-events-auto">
                            <TelemetryOverlay driver={activeDriver} />
                        </div>

                        {/* 5. Controls Overlay (Bottom) */}
                        <div className="z-20 pointer-events-auto mt-auto">
                            <TimelineScrubber
                                currentTime={currentTime}
                                maxTime={maxTime}
                                onScrub={setCurrentTime}
                                playing={playing}
                                setPlaying={setPlaying}
                                speed={speed}
                                setSpeed={setSpeed}
                            />
                        </div>

                    </div>
                </SimulationMain>
            </SimulationLayout>
        </div>
    );
};

export default ReplayPage;
