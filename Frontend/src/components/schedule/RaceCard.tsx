import React from 'react';
import { MapPin, Bell, Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface RaceCardProps {
    race: {
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
    onPredict: (raceId: string, raceName: string) => void;
    onViewDetails: (race: any) => void;
    getCountryFlag: (country: string) => string;
    getStatusColor: (status: string) => string;
    getCountdown: (date: string) => string | null;
}

export default function RaceCard({
    race,
    onPredict,
    onViewDetails,
    getCountryFlag,
    getStatusColor,
    getCountdown
}: RaceCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card hover:border-red-500/50 transition-all cursor-pointer p-6"
            onClick={() => onViewDetails(race)}
        >
            <div className="grid md:grid-cols-4 gap-6 items-center">
                {/* Race Info */}
                <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="text-3xl filter drop-shadow-md">{getCountryFlag(race.country)}</div>
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                                {race.raceName}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400">
                                <MapPin className="w-4 h-4 text-red-500/70" />
                                <span className="text-sm font-medium">{race.circuitName}, {race.city}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(race.status)}`}>
                            {race.status}
                        </span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Round {race.round}
                        </span>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="text-center md:border-x border-white/10 px-4">
                    <div className="text-lg font-black text-white mb-1">
                        {new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm font-bold mb-2">
                        <Clock className="w-4 h-4" />
                        {race.time} UTC
                    </div>
                    {race.status === 'upcoming' && getCountdown(race.date) && (
                        <div className="bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold inline-block">
                            Starts in {getCountdown(race.date)}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        className="glass-btn secondary py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Reminder logic
                        }}
                    >
                        <Bell className="w-4 h-4" />
                        Remind Me
                    </button>
                    <button
                        className="glass-btn primary py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPredict(race.round.toString(), race.raceName);
                        }}
                    >
                        <Target className="w-4 h-4" />
                        Predict
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
