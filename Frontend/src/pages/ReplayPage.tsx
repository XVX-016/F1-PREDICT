import { useEffect, useMemo, useState } from 'react';
import {
    SimulationLayout,
    SimulationMain,
} from './SimulationPage.components';
import { Play, Pause, Activity, Navigation, Timer } from 'lucide-react';
import { useReplay } from '../hooks/useReplay';
import { TrackMap } from '../components/replay/TrackMap';
import { DriverState } from '../utils/ReplayEngine';
import { SEASON_2025_SCHEDULE } from '../data/season2025';
import { resolveAssetUrl } from '../utils/assets';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// --- Overlay Components (Refined for High-Density Telemetry) ---

const LeaderboardOverlay = ({
    drivers,
    selectedDriverId,
    onSelectDriver,
}: {
    drivers: DriverState[];
    selectedDriverId?: string | null;
    onSelectDriver?: (id: string) => void;
}) => (
    <div className="absolute top-4 right-4 w-56 lg:w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex flex-col max-h-[70vh] lg:max-h-[80vh] shadow-2xl">
        <div className="p-2 bg-white/5 border-b border-white/10 flex justify-between items-center px-4">
            <span className="text-[10px] font-mono font-black uppercase text-white tracking-[0.2em] flex items-center gap-2">
                <Navigation className="w-3 h-3 text-[#E10600]" />
                Driver Rankings
            </span>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {drivers.map((d: DriverState) => (
                <button
                    key={d.id}
                    type="button"
                    onClick={() => onSelectDriver?.(d.id)}
                    className={`w-full text-left flex items-center justify-between p-1.5 rounded transition-colors group cursor-pointer border ${
                        selectedDriverId === d.id
                            ? 'bg-white/10 border-white/20'
                            : 'border-transparent hover:border-white/5 hover:bg-white/10'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 rounded-sm" style={{ backgroundColor: d.teamColor }} />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase leading-none tracking-tight">
                                P{d.position} {d.name}
                            </span>
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
                </button>
            ))}
        </div>
    </div>
);

const TelemetryOverlay = ({ driver }: { driver: DriverState | null }) => {
    if (!driver) return null;
    return (
        <div className="absolute bottom-24 left-4 w-64 lg:w-72 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl p-4 lg:p-5 space-y-4 lg:space-y-5 shadow-2xl ring-1 ring-white/5">
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

interface TimelineScrubberProps {
    currentTime: number;
    maxTime: number;
    onScrub: (t: number) => void;
    playing: boolean;
    setPlaying: (p: boolean) => void;
    speed: number;
    setSpeed: (s: number) => void;
}

const TimelineScrubber = ({
    currentTime,
    maxTime,
    onScrub,
    playing,
    setPlaying,
    speed,
    setSpeed
}: TimelineScrubberProps) => {
    const formatTime = (seconds: number) => {
        const total = Math.max(0, Math.floor(seconds));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = Math.floor(total % 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute bottom-1 lg:bottom-2 left-[48.5%] -translate-x-1/2 w-[95%] lg:w-[90%] max-w-4xl h-14 lg:h-16 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl px-3 sm:px-4 lg:px-6 grid grid-cols-[56px_1fr_136px] sm:grid-cols-[112px_1fr_112px] lg:grid-cols-[172px_1fr_172px] items-center gap-2 sm:gap-3 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-center">
                <button
                    onClick={() => setPlaying(!playing)}
                    className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-lg"
                >
                    {playing ? <Pause className="fill-black w-4 h-4" /> : <Play className="fill-black w-4 h-4 ml-0.5" />}
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-2 group relative py-1 -ml-8 pr-6">
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
                    <span>{formatTime(maxTime)}</span>
                </div>
            </div>

            <div className="flex items-center justify-end">
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
        </div>
    );
};

const REPLAY_WHITELIST = ["4_2025"];

const ReplayPage = () => {
    const replay2024 = [
        {
            id: 'Bahrain',
            raceName: 'Bahrain Grand Prix',
            circuit: 'Bahrain International Circuit',
            trackImg: '/circuits/f1_2024_bhr_outline.png',
        },
    ];
    const replay2025 = SEASON_2025_SCHEDULE.map((race) => ({
        ...race,
        id: `${race.round}_2025`,
    }));

    const [availableReplayIds, setAvailableReplayIds] = useState<string[] | null>(null);
    const [selectedRace, setSelectedRace] = useState(REPLAY_WHITELIST.includes(replay2025[3]?.id) ? (replay2025[3]?.id ?? replay2024[0].id) : replay2024[0].id);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [hasStarted, setHasStarted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const {
        state,
        playing,
        setPlaying,
        speed,
        setSpeed,
        setCurrentTime,
        loading,
        currentTime,
        maxTime,
        trackPath
    } = useReplay(selectedRace);
    const showCircuitImage = false;

    useEffect(() => {
        let isMounted = true;
        const fetchAvailable = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/races/replay/available`);
                if (!res.ok) return;
                const payload = await res.json();
                if (!isMounted) return;
                if (payload?.available && Array.isArray(payload.available)) {
                    // Filter available IDs by whitelist
                    const filtered = payload.available.filter((id: string) => REPLAY_WHITELIST.includes(id));
                    setAvailableReplayIds(filtered);
                } else {
                    setAvailableReplayIds([]);
                }
            } catch {
                if (isMounted) setAvailableReplayIds(null);
            }
        };
        fetchAvailable();
        return () => {
            isMounted = false;
        };
    }, []);

    const { filtered2024, filtered2025, allReplayOptions } = useMemo(() => {
        const availableSet = new Set(availableReplayIds ?? REPLAY_WHITELIST); // Fallback to whitelist if nothing fetched

        const filtered2024 = replay2024.filter((race) => availableSet.has(race.id));
        const filtered2025 = replay2025.filter((race) => availableSet.has(race.id));
        
        return {
            filtered2024,
            filtered2025,
            allReplayOptions: [...filtered2024, ...filtered2025],
        };
    }, [availableReplayIds]);

    useEffect(() => {
        if (allReplayOptions.length === 0) return;
        const stillValid = allReplayOptions.some((race) => race.id === selectedRace);
        if (!stillValid) {
            setSelectedRace(allReplayOptions[0].id);
        }
    }, [allReplayOptions, selectedRace]);

    // Trigger hasStarted when play is first clicked
    useEffect(() => {
        if (playing && !hasStarted) {
            setHasStarted(true);
        }
    }, [playing, hasStarted]);

    useEffect(() => {
        const applyMobileState = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
        };
        applyMobileState();
        window.addEventListener('resize', applyMobileState);
        return () => window.removeEventListener('resize', applyMobileState);
    }, []);

    const driversSorted = state?.drivers
        ? Object.values(state.drivers).sort((a, b) => a.position - b.position)
        : [];

    const selectedRaceInfo = allReplayOptions.find((race) => race.id === selectedRace)
        ?? [...replay2024, ...replay2025].find((race) => race.id === selectedRace);

    const activeDriver = selectedDriverId && state?.drivers[selectedDriverId]
        ? state.drivers[selectedDriverId]
        : driversSorted.length > 0 ? driversSorted[0] : null;

    const mapShiftX = !isMobile ? -2 : 0;
    const mapShiftY = !isMobile ? -4 : -2;

    return (
        <div className="min-h-screen w-full text-white flex flex-col pt-16 bg-[#050505]">
            <SimulationLayout>
                <SimulationMain>
                    <div className="relative w-full h-[calc(100svh-4rem)] bg-[#050505] overflow-hidden flex flex-col">

                        {/* 1. Main Canvas Area (Track Map) Area */}
                        <div className="absolute inset-0 z-0 flex items-center justify-center px-2 sm:px-4 lg:px-8 pt-16 pb-20">
                            <div
                                className="w-full h-full max-w-[1580px]"
                                style={{ transform: `translate(${mapShiftX}px, ${mapShiftY}px)` }}
                            >
                                <TrackMap
                                    drivers={driversSorted}
                                    loading={loading}
                                    circuitImage={showCircuitImage ? resolveAssetUrl(selectedRaceInfo?.trackImg) : undefined}
                                    circuitLabel={selectedRaceInfo?.circuit}
                                    trackPath={trackPath}
                                    circuitKey={`${selectedRaceInfo?.raceName || ''} ${selectedRaceInfo?.circuit || ''} ${selectedRace}`}
                                />
                            </div>
                        </div>

                        {/* 2. Top Bar (Overlay) */}
                        <div className="absolute top-0 left-0 right-0 p-4 lg:p-8 z-10 pointer-events-none">
                            <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="pointer-events-auto">
                                    <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-[0.14em] uppercase">
                                        REPLAY
                                    </h1>
                                    <div className="flex items-center gap-3 lg:gap-4 mt-3">
                                        <div className="h-9 bg-black/70 backdrop-blur-xl px-3 border border-white/10 rounded-lg flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Lap</span>
                                            <span className="text-[#E10600] text-lg font-black leading-none">{state?.currentLap || 1}</span>
                                            <span className="text-white/30 text-[10px]">/ {state?.totalLaps || 53}</span>
                                        </div>
                                        <div className="h-9 bg-black/70 backdrop-blur-xl px-3 border border-white/10 rounded-lg flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${loading ? 'text-yellow-500' : 'text-white/40'}`}>
                                                {loading ? 'SYNCHRONIZING' : 'OPERATIONAL'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pointer-events-auto w-full lg:w-auto flex justify-center lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-0">
                                    <div className="w-full max-w-xs lg:max-w-sm">
                                        <label className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block mb-2 text-center">Select Event</label>
                                        <div className="relative">
                                            <select
                                                value={selectedRace}
                                                onChange={(e) => {
                                                    setSelectedRace(e.target.value);
                                                    setHasStarted(false);
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#E10600]/50 transition-colors appearance-none cursor-pointer"
                                            >
                                                <optgroup label="2024 Replay Cache" className="bg-[#15151e]" style={{ color: '#000', backgroundColor: '#fff' }}>
                                                    {filtered2024.map((r) => (
                                                        <option
                                                            key={r.id}
                                                            value={r.id}
                                                            style={{ color: '#000', backgroundColor: '#fff' }}
                                                        >
                                                            {r.raceName} (2024)
                                                        </option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="2025 Season" className="bg-[#15151e]" style={{ color: '#000', backgroundColor: '#fff' }}>
                                                    {filtered2025.map(r => (
                                                        <option
                                                            key={r.id}
                                                            value={r.id}
                                                            style={{ color: '#000', backgroundColor: '#fff' }}
                                                        >
                                                            {r.raceName}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                                <Navigation className="w-3 h-3 rotate-180" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Leaderboard Overlay (Right) */}
                        {hasStarted && !isMobile && (
                            <div className="z-10 pointer-events-auto">
                                <LeaderboardOverlay
                                    drivers={driversSorted}
                                    selectedDriverId={selectedDriverId}
                                    onSelectDriver={setSelectedDriverId}
                                />
                            </div>
                        )}

                        {/* 4. Telemetry Overlay (Left) */}
                        {!isMobile && (
                            <div className="z-10 pointer-events-auto">
                            <TelemetryOverlay driver={activeDriver} />
                            </div>
                        )}

                        {/* 5. Controls Overlay (Bottom) */}
                        <div className="z-20 pointer-events-auto mt-auto mb-2 lg:mb-8">
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
