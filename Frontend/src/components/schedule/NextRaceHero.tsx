import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import { resolveAssetUrl } from '../../utils/assets';

interface NextRaceHeroProps {
    race: any;
    getCountryFlag: (country: string) => string;
    onViewDetails: (race: any) => void;
}

export default function NextRaceHero({ race, getCountryFlag, onViewDetails }: NextRaceHeroProps) {
    // Fetch Weather (always call hooks at the top level)
    const { data: weather, isLoading: weatherLoading } = useWeather(race?.city || race?.country);

    if (!race) return null;

    // Calculate days until
    const daysUntil = Math.ceil((new Date(race.startISO).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer group shadow-md"
            onClick={() => onViewDetails(race)}
        >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                {race.bannerImg ? (
                    <img src={resolveAssetUrl(race.bannerImg)} className="w-full h-full object-cover opacity-100 transition-transform duration-700 group-hover:scale-105" alt="Next Race" />
                ) : (
                    <div className="w-full h-full bg-[#15151e]" />
                )}
                {/* Gradient Overlays - stronger on left for visual weight */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#E10600] via-[#E10600]/80 to-transparent mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            <div className="relative z-10 p-4 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-12">

                {/* Left Side: Race Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-white text-[#E10600] text-xs font-black px-2 py-1 rounded uppercase tracking-wider">
                            Next Race
                        </span>
                        <span className="text-white/80 font-mono text-sm uppercase tracking-widest border border-white/20 px-2 py-0.5 rounded">
                            Round {race.round}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-4xl md:text-8xl font-black italic text-white uppercase tracking-tighter leading-[0.9] break-words">
                            {race.country}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-2xl md:text-4xl">{getCountryFlag(race.country)}</span>
                            <p className="text-lg md:text-xl text-white/90 font-bold uppercase tracking-wide break-words">
                                {race.raceName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-6 min-h-[40px]">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Date</span>
                            <span className="text-lg font-mono font-bold text-white">{new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div className="w-px h-8 bg-white/20" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Time</span>
                            <span className="text-lg font-mono font-bold text-white">{race.time}</span>
                        </div>
                        {weather && !weatherLoading && (
                            <>
                                <div className="w-px h-8 bg-white/20" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Weather</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-mono font-bold text-white">{weather.temp_c}°C</span>
                                        <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded uppercase font-black">{weather.condition.text}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side: Action & Timer Tease */}
                <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-6">
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
                        <Clock className="w-5 h-5 text-white" />
                        <div>
                            <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Lights Out In</p>
                            <p className="text-2xl font-mono font-black text-white">{daysUntil} DAYS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Right Badge */}
            <div className="absolute top-0 right-0 p-6 hidden md:block">
                <div className="bg-white text-[#E10600] px-4 py-2 rounded font-black italic text-xs uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                    Next Race &gt;
                </div>
            </div>

        </motion.div>
    );
}
