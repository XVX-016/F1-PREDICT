import { useState } from 'react';
import {
    SimulationLayout,
    SimulationSidebar,
    SimulationMain,
} from './SimulationPage.components';
import { Play, Pause, Info, Activity, Navigation, Timer } from 'lucide-react';
import { useReplay } from '../hooks/useReplay';
import { TrackMap } from '../components/replay/TrackMap';
import { DriverState } from '../utils/ReplayEngine';

// --- Overlay Components (Refined for High-Density Telemetry) ---

const LeaderboardOverlay = ({ drivers }: { drivers: DriverState[] }) => (
    <div className="absolute top-4 right-4 w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
        <div className="p-2 bg-white/5 border-b border-white/10 flex justify-between items-center px-4">
            <span className="text-[10px] font-mono font-black uppercase text-white tracking-[0.2em] flex items-center gap-2">
                <Navigation className="w-3 h-3 text-[#E10600]" />
                Classification
            </span>
            <span className="text-[9px] font-mono text-white/40 uppercase">120HZ BASE</span>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {drivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-1.5 hover:bg-white/10 rounded transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 rounded-sm" style={{ backgroundColor: d.teamColor }} />
                        <span className="text-xs font-mono font-black text-white/40 w-4 text-right">{d.position}</span>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase leading-none tracking-tight">{d.name}</span>
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{d.id}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end pr-2">
                        <span className="text-[10px] font-mono font-bold text-white">
                            {d.position === 1 ? 'INTERVAL' : `+${d.gapToLeader.toFixed(3)}s`}
                        </span>
                        <span className={`text-[8px] font-bold px-1 rounded uppercase ${d.drs ? 'text-green-500' : 'text-white/20'}`}>
                            {d.drs ? 'DRS' : ''}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const TelemetryOverlay = ({ driver }: { driver: DriverState | null }) => {
    if (!driver) return null;
    return (
        <div className="absolute bottom-24 left-4 w-72 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl p-5 space-y-5 shadow-2xl ring-1 ring-white/5">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-lg text-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    {driver.id}
                </div>
                <div>
                    <div className="text-sm font-black uppercase tracking-tighter text-white">{driver.name}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: driver.teamColor }} />
                        Telemetry Master
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] mb-1">Velocity</div>
                    <div className="text-3xl font-mono font-black text-white flex items-baseline gap-1">
                        {driver.speed.toFixed(0)}
                        <span className="text-[10px] text-white/30 font-normal">KPH</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] mb-1">Transmission</div>
                    <div className="text-3xl font-mono font-black text-[#E10600]">{driver.gear}</div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Activity className="w-2 h-2" /> Throttle</span>
                        <span>{driver.throttle.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-all duration-75" style={{ width: `${driver.throttle}%` }} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase tracking-widest">
                        <span className="flex items-center gap-1 text-red-500"><Activity className="w-2 h-2" /> Brake</span>
                        <span>{driver.brake.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all duration-75" style={{ width: `${driver.brake}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-2">
                <div className={`px-2 py-1 rounded text-[9px] font-mono font-black uppercase tracking-widest border transition-all ${driver.drs ? 'bg-[#E10600] border-[#E10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.4)]' : 'bg-white/5 border-white/10 text-white/20'}`}>
                    DRS {driver.drs ? 'ENABLED' : 'STDBY'}
                </div>
                <div className="text-[9px] font-mono text-white/30 flex items-center gap-1 uppercase tracking-widest">
                    <Timer className="w-3 h-3" />
                    LIVE PHYSICS
                </div>
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
}: any) => {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl h-16 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl px-6 flex items-center gap-8 shadow-2xl ring-1 ring-white/10">
            <button
                onClick={() => setPlaying(!playing)}
                className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-lg"
            >
                {playing ? <Pause className="fill-black w-4 h-4" /> : <Play className="fill-black w-4 h-4 ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-2 group relative py-2">
                <input
                    type="range"
                    min={0}
                    max={maxTime || 1}
                    step={0.008} // 120Hz steps
                    value={currentTime}
                    onChange={(e) => onScrub(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer hover:accent-red-400 transition-all"
                />
                <div className="flex justify-between text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] font-bold">
                    <span>{formatTime(currentTime)}</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white/60">REPLAY MASTER</span>
                    <span>{formatTime(maxTime)}</span>
                </div>
            </div>

            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
                {[1, 2, 5, 10].map(s => (
                    <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`w-10 h-8 rounded-lg text-[10px] font-mono font-black transition-all ${speed === s ? 'bg-white text-black shadow-md' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        {s}x
                    </button>
                ))}
            </div>
        </div>
    );
};

const ReplayPage = () => {
    const [selectedRace, _setSelectedRace] = useState('bahrain_2024');
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
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
        <div className="min-h-screen w-full text-white flex flex-col pt-16 bg-[#050505]">
            <SimulationLayout>
                <SimulationSidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
                >
                    <div className="p-6">
                        <div className="mb-8">
                            <h3 className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.3em] mb-6">Archive Explorer</h3>
                            <div className="space-y-3">
                                <button className="w-full text-left p-4 rounded-xl bg-[#E10600]/10 border border-[#E10600]/30 text-white relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#E10600]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="text-[11px] font-mono font-black uppercase tracking-widest relative z-10">BHR - Sakhir</div>
                                    <div className="text-[9px] font-mono text-[#E10600]/60 mt-1 relative z-10">2024 • ROUND 1 • OFFICIAL</div>
                                </button>

                                <div className="px-2 py-4 border-t border-white/5 mt-6">
                                    <h4 className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-4">Quick Legend</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#E10600] shadow-[0_0_8px_rgba(225,6,0,0.6)]" />
                                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">Deterministic Spline</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">Interpolated Physics</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3 text-[#E10600]">
                                <Activity className="w-3 h-3 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Replay Engine V2</span>
                            </div>
                            <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                                <span className="text-white/60">120HZ COMPUTE</span><br />
                                Deterministic playback of session data via WebWorker. Zero-jitter interpolation.
                            </p>
                        </div>
                    </div>
                </SimulationSidebar>

                <SimulationMain>
                    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#050505] overflow-hidden flex flex-col">

                        {/* 1. Main Canvas Area (Track Map) Area */}
                        <div className="absolute inset-0 z-0">
                            <TrackMap
                                drivers={driversSorted}
                                loading={loading}
                            />
                        </div>

                        {/* 2. Top Bar (Overlay) */}
                        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10 pointer-events-none">
                            <div className="max-w-md">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="px-2 py-1 bg-[#E10600] text-black text-[10px] font-black uppercase tracking-tighter rounded italic">PREMIUM REPLAY</div>
                                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">RECONSTRUCTED STREAM</div>
                                </div>
                                <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase drop-shadow-2xl">
                                    SAKHIR <span className="text-white/20">REPLAY</span>
                                </h1>
                                <div className="flex items-center gap-6 mt-4">
                                    <div className="bg-black/80 backdrop-blur-xl px-4 py-2 border border-white/20 rounded-xl flex items-baseline gap-3 shadow-2xl">
                                        <span className="text-[10px] font-mono font-black text-white/30 uppercase tracking-widest">LAP</span>
                                        <span className="text-[#E10600] text-2xl font-black font-mono italic leading-none">{state?.currentLap || 1}</span>
                                        <span className="text-white/20 font-mono text-xs">/ {state?.totalLaps || 53}</span>
                                    </div>
                                    <div className="bg-black/80 backdrop-blur-xl px-4 py-2 border border-white/20 rounded-xl flex items-center gap-3 shadow-2xl">
                                        <span className="text-[10px] font-mono font-black text-white/30 uppercase tracking-widest">STATUS</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`} />
                                            <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${loading ? 'text-yellow-500' : 'text-white'}`}>
                                                {loading ? 'SYNCHRONIZING' : 'OPERATIONAL'}
                                            </span>
                                        </div>
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
                        <div className="z-20 pointer-events-auto mt-auto mb-8">
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
