
import { motion } from 'framer-motion';

interface RaceCardProps {
    race: any;
    getCountryFlag: (country: string) => string;
    onViewDetails: (race: any) => void;
    isNext?: boolean;
}

const RaceCard = ({ race, getCountryFlag, onViewDetails, isNext }: RaceCardProps) => {
    // Format dates: "06 - 08 MAR"
    const formatDateRange = (strDate: string) => {
        try {
            const date = new Date(strDate);
            const startDay = date.toLocaleDateString('en-GB', { day: '2-digit' });
            // Estimate end date (Sunday) from Friday (usually +2 days)
            const endDate = new Date(date);
            endDate.setDate(date.getDate() + 2);
            const endDay = endDate.toLocaleDateString('en-GB', { day: '2-digit' });
            const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

            return `${startDay} - ${endDay} ${month}`;
        } catch {
            return 'TBD';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#15151e] border-t-4 border-[#e10600] text-white overflow-hidden rounded-br-2xl shadow-2xl transition-transform hover:scale-[1.02] flex flex-col h-full group cursor-pointer"
            onClick={() => onViewDetails(race)}
        >
            {/* Top Banner Area */}
            <div className="relative h-40 w-full bg-black/50">
                {race.bannerImg ? (
                    <img src={race.bannerImg} className="w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-80" alt={race.raceName} />
                ) : (
                    <div className="w-full h-full bg-slate-800 opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#15151e] to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#e10600] drop-shadow-md">Round {race.round}</span>
                    {isNext && (
                        <span className="bg-white text-[#E10600] text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse">NEXT</span>
                    )}
                </div>

                {/* Flag in top right */}
                <div className="absolute top-4 right-4 text-2xl drop-shadow-md">
                    {getCountryFlag(race.country)}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex justify-between items-end flex-grow">
                <div className="flex-1 pr-4">
                    <h2 className="text-lg font-black uppercase italic leading-tight mb-1">{race.country}</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 line-clamp-1">{race.raceName}</p>

                    <div className="border-l-2 border-[#e10600] pl-3">
                        <p className="text-lg font-mono font-bold tracking-tight text-white">{formatDateRange(race.date)}</p>
                    </div>
                </div>

                {/* Track Layout - High Contrast White/Grey */}
                {race.trackImg && (
                    <div className="w-20 h-20 flex-shrink-0">
                        <img
                            src={race.trackImg}
                            className="w-full h-full object-contain filter invert brightness-200 opacity-80"
                            alt="Track Layout"
                        />
                    </div>
                )}
            </div>


        </motion.div>
    );
};

export default RaceCard;
