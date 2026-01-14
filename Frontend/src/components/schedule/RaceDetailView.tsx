import { motion } from 'framer-motion';
import { X, Map as MapIcon, Zap, Gauge, History, Thermometer, Info } from 'lucide-react';

interface RaceDetailViewProps {
    race: any;
    onClose: () => void;
    getCountryFlag: (country: string) => string;
}

export default function RaceDetailView({ race, onClose, getCountryFlag }: RaceDetailViewProps) {
    // Mock physics data for demonstration - derived from race name or ID
    const physicsIntel = {
        tyreStress: race.round % 3 === 0 ? 'High' : race.round % 2 === 0 ? 'Medium' : 'Low',
        brakeWear: race.round % 4 === 0 ? 'Extreme' : 'Moderate',
        trackTemp: '34°C',
        strategyWindow: 'Lap 14 - 21',
        optimalCompound: 'C3 (Soft)'
    };

    const sessions = [
        { name: 'Free Practice 1', time: '11:30', day: 'Friday', status: 'completed' },
        { name: 'Free Practice 2', time: '15:00', day: 'Friday', status: 'completed' },
        { name: 'Free Practice 3', time: '12:00', day: 'Saturday', status: 'upcoming' },
        { name: 'Qualifying', time: '16:00', day: 'Saturday', status: 'upcoming' },
        { name: 'Grand Prix', time: '18:00', day: 'Sunday', status: 'upcoming' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-y-auto"
        >
            <div className="max-w-6xl mx-auto px-4 py-12 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all z-50 border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Hero Header */}
                <div className="relative h-80 rounded-3xl overflow-hidden mb-12 border border-white/10 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    <img
                        src="/hero/hero-schedule.png"
                        className="w-full h-full object-cover scale-110 blur-sm opacity-40 transition-transform duration-1000 group-hover:scale-100"
                        alt=""
                    />
                    <div className="absolute bottom-8 left-8 z-20 flex items-end gap-6">
                        <div className="text-7xl filter drop-shadow-2xl">{getCountryFlag(race.country)}</div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-red-600 rounded-full text-[10px] font-black uppercase tracking-tight">Technical Briefing</span>
                                <span className="text-gray-400 font-mono text-sm uppercase">Round {race.round}</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter">
                                {race.raceName}
                            </h1>
                            <p className="text-xl text-gray-400 font-medium">{race.circuitName}, {race.country}</p>
                        </div>
                    </div>
                </div>

                {/* Intelligence Grid */}
                <div className="track-intel-grid">
                    {/* Circuit Map Selection */}
                    <div style={{ gridArea: 'map' }} className="glass-card p-8 flex flex-col items-center justify-center relative min-h-[400px]">
                        <div className="absolute top-6 left-6 flex items-center gap-2 text-red-500 font-mono text-xs uppercase font-bold tracking-widest">
                            <MapIcon className="w-4 h-4" /> Circuit Layout
                        </div>
                        <img
                            src={`/circuits/f1_2024_${race.circuitName.toLowerCase().slice(0, 3)}_outline.png`}
                            alt="Circuit Map"
                            className="max-h-[300px] w-auto opacity-80 invert brightness-200"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/circuits/f1_2024_aus_outline.png';
                            }}
                        />
                        <div className="mt-8 grid grid-cols-3 gap-8 w-full">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Length</p>
                                <p className="text-lg font-black text-white">5.412 km</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Laps</p>
                                <p className="text-lg font-black text-white">57</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Turns</p>
                                <p className="text-lg font-black text-white">15</p>
                            </div>
                        </div>
                    </div>

                    {/* Sessions Itinerary */}
                    <div style={{ gridArea: 'sessions' }} className="glass-card p-8">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-8 flex items-center gap-2">
                            <History className="w-5 h-5 text-red-500" /> Weekend Itinerary
                        </h3>
                        <div className="itinerary-timeline">
                            {sessions.map((session, i) => (
                                <div key={i} className={`itinerary-item ${session.status === 'completed' ? 'itinerary-item-past' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-white">{session.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{session.day}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-mono font-bold text-red-500">{session.time}</p>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">{session.status}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technical Stats */}
                    <div style={{ gridArea: 'stats' }} className="space-y-4">
                        <div className="technical-stat-card">
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                <Thermometer className="w-3.5 h-3.5" /> Tyre Stress
                            </div>
                            <p className="text-2xl font-black text-white uppercase">{physicsIntel.tyreStress}</p>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500"
                                    style={{ width: physicsIntel.tyreStress === 'High' ? '90%' : physicsIntel.tyreStress === 'Medium' ? '60%' : '30%' }}
                                />
                            </div>
                        </div>

                        <div className="technical-stat-card">
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                <Gauge className="w-3.5 h-3.5" /> Brake Wear
                            </div>
                            <p className="text-2xl font-black text-white uppercase">{physicsIntel.brakeWear}</p>
                        </div>
                    </div>

                    {/* Energy Strategy Information */}
                    <div style={{ gridArea: 'strategy' }} className="glass-card p-8">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-red-500" /> Strategy Intelligence
                        </h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                        <Info className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Pit Window</p>
                                        <p className="text-sm text-white font-mono">{physicsIntel.strategyWindow}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                        <Info className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Recommended Start</p>
                                        <p className="text-sm text-white font-mono">{physicsIntel.optimalCompound}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-red-600/5 border border-red-500/20 rounded-2xl p-4">
                                <p className="text-[10px] text-red-500 uppercase font-black tracking-widest mb-2">2026 Regulation Note</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    High agility chassis required. "X-Mode" active aero likely triggered in Sector 2 straights. Battery recovery difficulty: <strong>Moderate</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
