import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface RaceCardProps {
    race: {
        id: string;
        round: number;
        raceName: string;
        circuitName: string;
        country: string;
        city: string;
        date: string;
        time: string;
        status: 'upcoming' | 'live' | 'completed';
        startISO?: string;
    };
    trackImage?: string | null;
    onViewDetails: (race: any) => void;
    isHero?: boolean;
    compact?: boolean;
}

const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
        'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵', 'China': '🇨🇳',
        'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨', 'Spain': '🇪🇸', 'Canada': '🇨🇦',
        'Austria': '🇦🇹', 'United Kingdom': '🇬🇧', 'Hungary': '🇭🇺', 'Belgium': '🇧🇪',
        'Netherlands': '🇳🇱', 'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'Mexico': '🇲🇽',
        'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪'
    };
    return flags[country?.trim()] || '🏁';
};

export default function RaceCard({
    race,
    trackImage,
    onViewDetails,
    isHero = false,
    compact = false
}: RaceCardProps) {
    const isPast = race.status === 'completed';

    // Format Dates (e.g. 06 - MAR 08)
    const raceDate = new Date(race.date);
    const monthStr = raceDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const endDay = raceDate.toLocaleDateString('en-US', { day: '2-digit' });

    const startObj = new Date(raceDate);
    startObj.setDate(raceDate.getDate() - 2);
    const startDay = startObj.toLocaleDateString('en-US', { day: '2-digit' });

    // Format: "06 - MAR 08"
    const formattedDateRange = `${startDay} - ${monthStr} ${endDay}`;

    // Hero Red Styling vs Standard Black
    const cardBg = isHero
        ? 'bg-gradient-to-br from-[#E10600] to-[#980400]'
        : 'bg-black border border-white/10 hover:border-white/30';

    const textColor = isHero ? 'text-white' : 'text-white';
    const subTextColor = isHero ? 'text-white/80' : 'text-gray-500';

    return (
        <motion.div
            layoutId={`card-${race.id}`}
            onClick={() => onViewDetails(race)}
            className={`
                relative overflow-hidden cursor-pointer group rounded-xl transition-all duration-300
                ${cardBg}
                ${isHero ? 'min-h-[300px] p-8' : compact ? 'p-4 min-h-[140px]' : 'p-6 min-h-[220px]'}
            `}
        >
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    {/* Header: Round & Tag */}
                    <div className="flex justify-between items-start mb-4">
                        <span className={`font-bold uppercase tracking-widest ${subTextColor} ${isHero ? 'text-xs' : 'text-[10px]'}`}>
                            {race.status === 'live' ? <span className="text-white animate-pulse">LIVE NOW</span> : `ROUND ${race.round}`}
                        </span>

                        {isHero && (
                            <div className="bg-white text-[#E10600] text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                                Next Race &gt;
                            </div>
                        )}
                    </div>

                    {/* Flag & Country Section */}
                    <div className="flex flex-col gap-3">
                        {!compact && (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg overflow-hidden border border-white/5 shadow-sm">
                                {getCountryFlag(race.country)}
                            </div>
                        )}

                        <div>
                            <h3 className={`font-black uppercase tracking-tighter leading-none ${textColor} ${isHero ? 'text-6xl mb-2' : compact ? 'text-xl' : 'text-3xl mb-1'}`}>
                                {race.country}
                            </h3>
                            {!compact && (
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isHero ? 'text-white/80' : 'text-gray-500'}`}>
                                    {race.raceName} 2026
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Date & Track */}
                <div className="flex justify-between items-end mt-4 relative">
                    <div className={`font-black uppercase tracking-widest ${isHero ? 'text-white text-xl z-20' : 'text-white text-sm z-20'}`}>
                        {formattedDateRange}
                    </div>

                    {trackImage && (
                        <div className={`absolute bottom-[-10px] right-[-10px] transition-transform duration-500 group-hover:scale-110 ${isHero ? 'w-80 opacity-20 group-hover:opacity-40' : compact ? 'w-20 opacity-30' : 'w-32 opacity-80 group-hover:opacity-100'}`}>
                            <img
                                src={trackImage}
                                alt={`${race.circuitName} outline`}
                                className="w-full h-full object-contain invert"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Background Pattern for Hero */}
            {isHero && (
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay pointer-events-none"></div>
            )}
        </motion.div>
    );
}
