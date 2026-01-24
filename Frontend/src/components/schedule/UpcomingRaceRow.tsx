import { motion } from 'framer-motion';

interface UpcomingRaceRowProps {
    races: any[];
    getCountryFlag: (country: string) => string;
    onViewDetails: (race: any) => void;
}

export default function UpcomingRaceRow({ races, getCountryFlag, onViewDetails }: UpcomingRaceRowProps) {
    if (!races || races.length === 0) return null;

    return (
        <div className="w-full mb-12">
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-[#E10600] rounded-full animate-pulse" />
                Upcoming
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {races.map((race, index) => (
                    <motion.div
                        key={race.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-[#1e1e24] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#E10600] transition-colors"
                        onClick={() => onViewDetails(race)}
                    >
                        {/* Track BG */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none p-4 flex items-center justify-center">
                            {race.trackImg ? (
                                <img src={race.trackImg} className="w-full h-full object-contain filter invert" alt="" />
                            ) : null}
                        </div>

                        <div className="relative p-6 h-full flex flex-col justify-between min-h-[160px]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                        Rd {race.round}
                                    </span>
                                </div>
                                <span className="text-2xl">{getCountryFlag(race.country)}</span>
                            </div>

                            <div>
                                <h4 className="text-xl font-black text-white italic uppercase leading-none mb-1">
                                    {race.country}
                                </h4>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide truncate">
                                    {new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {race.circuitName}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
