import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Cpu, Thermometer, Wind, Droplets } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface SimulationHeaderProps {
    race: {
        id: string;
        name: string;
        circuit: string;
        country: string;
        startTime: string;
        status: 'open' | 'closed' | 'finished' | 'LIVE' | 'UPCOMING' | 'COMPLETED';
        trackTemp?: string;
        airTemp?: string;
        humidity?: string;
        windSpeed?: string;
    };
    modelStatus?: string;
}

export default function SimulationHeader({ race, modelStatus = "SIMULATION" }: SimulationHeaderProps) {
    const [raceCountdown, setRaceCountdown] = useState('');

    useEffect(() => {
        const updateCountdown = () => {
            if (race.status === 'LIVE') {
                setRaceCountdown('LIVE SESSION');
                return;
            }

            const now = new Date();
            const raceDate = new Date(race.startTime);
            const diff = raceDate.getTime() - now.getTime();

            if (diff <= 0) {
                setRaceCountdown(race.status === 'finished' ? 'Finished' : 'Live');
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                if (days > 0) setRaceCountdown(`${days}d ${hours}h`);
                else setRaceCountdown(`${hours}h ${minutes}m`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, [race.startTime, race.status]);

    const formatDateTime = useMemo(() => {
        return new Date(race.startTime).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [race.startTime]);

    const isLive = race.status === 'LIVE';

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 backdrop-blur-md border-b border-white/5 py-4 px-8 sticky top-14 z-30"
        >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            {isLive && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isLive ? 'text-[#E10600]' : 'text-slate-500'}`}>
                                {isLive ? 'Live Session' : 'Active Session'}
                            </span>
                        </div>
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                            {race.name}
                        </h1>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

                    <div className="flex items-center gap-6 text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{race.circuit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDateTime}</span>
                        </div>
                        {!isLive && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-white font-bold">{raceCountdown}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Weather or System Status */}
                <div className="flex items-center gap-4">
                    {race.trackTemp ? (
                        <div className="hidden md:flex items-center gap-4 bg-black/40 border border-white/5 px-4 py-2 rounded text-[10px] font-mono text-slate-300">
                            <div className="flex items-center gap-1.5" title="Track Temp">
                                <Thermometer className="w-3 h-3 text-[#E10600]" />
                                <span>{race.trackTemp}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/10"></div>
                            <div className="flex items-center gap-1.5" title="Air Temp">
                                <Thermometer className="w-3 h-3 text-slate-500" />
                                <span>{race.airTemp}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/10"></div>
                            <div className="flex items-center gap-1.5" title="Humidity">
                                <Droplets className="w-3 h-3 text-blue-400" />
                                <span>{race.humidity}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-white/10"></div>
                            <div className="flex items-center gap-1.5" title="Wind">
                                <Wind className="w-3 h-3 text-slate-400" />
                                <span>{race.windSpeed}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-1.5 rounded text-[10px] font-mono text-slate-400">
                                <Cpu className="w-3 h-3 text-red-500" />
                                <span className="text-slate-200">ENGINE READY</span>
                            </div>
                        </div>
                    )}

                    <div className="px-3 py-1.5 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-500 uppercase tracking-widest leading-none flex items-center h-full">
                        {modelStatus === "SIMULATION" ? "Geometry Verified" : modelStatus}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
