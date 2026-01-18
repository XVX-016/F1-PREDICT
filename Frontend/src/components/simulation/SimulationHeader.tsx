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
            className="bg-[#0b0b0e] border-b border-[#1f1f26] py-3 px-8 sticky top-14 z-30"
        >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                            {isLive && (
                                <span className="flex h-1.5 w-1.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                                </span>
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isLive ? 'text-red-600' : 'text-gray-500'} font-mono`}>
                                {isLive ? 'SESSION_ACTIVE' : 'SESSION_LOCKED'}
                            </span>
                        </div>
                        <h1 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                            {race.name}
                        </h1>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

                    <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-red-600" />
                            <span>{race.circuit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-red-600" />
                            <span>{formatDateTime}</span>
                        </div>
                        {!isLive && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-red-600 border border-red-600/30 rounded-full p-0.5" />
                                <span className="text-white bg-red-600/10 px-1.5 py-0.5 rounded-xs">{raceCountdown}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Weather or System Status */}
                <div className="flex items-center gap-4">
                    {race.trackTemp ? (
                        <div className="hidden md:flex items-center gap-4 bg-[#1f1f26] border border-[#2a2a35] px-4 py-1.5 rounded-md text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5" title="Track Temp">
                                <Thermometer className="w-3 h-3 text-red-600" />
                                <span>{race.trackTemp}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-[#2a2a35]"></div>
                            <div className="flex items-center gap-1.5" title="Air Temp">
                                <Thermometer className="w-3 h-3 text-gray-600" />
                                <span>{race.airTemp}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-[#2a2a35]"></div>
                            <div className="flex items-center gap-1.5" title="Humidity">
                                <Droplets className="w-3 h-3 text-blue-600" />
                                <span>{race.humidity}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-[#2a2a35]"></div>
                            <div className="flex items-center gap-1.5" title="Wind">
                                <Wind className="w-3 h-3 text-gray-600" />
                                <span>{race.windSpeed}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-[#1f1f26] border border-[#2a2a35] px-3 py-1.5 rounded-md text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                                <Cpu className="w-3 h-3 text-red-600 animate-pulse" />
                                <span className="text-gray-300">CORE_LOCK: READY</span>
                            </div>
                        </div>
                    )}

                    <div className="px-3 py-1.5 rounded-md bg-green-600/10 border border-green-600/30 text-[9px] font-bold text-green-600 uppercase tracking-widest leading-none flex items-center h-full font-mono">
                        {modelStatus === "SIMULATION" ? "VERIFIED_GEOMETRY_OK" : modelStatus}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
