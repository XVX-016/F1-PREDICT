import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Trophy } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface NextRaceHeroProps {
    race: {
        id: string;
        name: string;
        circuit: string;
        country: string;
        startTime: string; // ISO format
        status: 'upcoming' | 'live' | 'completed';
        predictionsCloseTime?: string; // ISO format - when predictions close
    };
    onPredict: (raceId: string) => void;
    onViewDetails: (raceId: string) => void;
}

export default function NextRaceHero({ race, onPredict, onViewDetails }: NextRaceHeroProps) {
    const [countdown, setCountdown] = useState('');
    const [predictionsCountdown, setPredictionsCountdown] = useState('');

    useEffect(() => {
        const updateCountdown = () => {
            const raceDate = new Date(race.startTime);
            const now = new Date();
            const diff = raceDate.getTime() - now.getTime();

            // Handle different states
            if (diff <= 0 && race.status === 'upcoming') {
                setCountdown('Live Now');
            } else if (diff < 0 && race.status === 'completed') {
                setCountdown('Finished');
            } else if (diff < 0) {
                setCountdown('Race Started');
            } else {
                // Calculate countdown
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (days > 0) {
                    setCountdown(`${days}d ${hours}h`);
                } else if (hours > 0) {
                    setCountdown(`${hours}h ${minutes}m`);
                } else if (minutes > 0) {
                    setCountdown(`${minutes}m ${seconds}s`);
                } else {
                    setCountdown(`${seconds}s`);
                }
            }

            // Update predictions countdown if available
            if (race.predictionsCloseTime) {
                const predictionsClose = new Date(race.predictionsCloseTime);
                const predDiff = predictionsClose.getTime() - now.getTime();

                if (predDiff <= 0) {
                    setPredictionsCountdown('Closed');
                } else {
                    const hours = Math.floor(predDiff / (1000 * 60 * 60));
                    const minutes = Math.floor((predDiff % (1000 * 60 * 60)) / (1000 * 60));

                    if (hours > 0) {
                        setPredictionsCountdown(`${hours}h ${minutes}m`);
                    } else {
                        setPredictionsCountdown(`${minutes}m`);
                    }
                }
            }
        };

        updateCountdown();
        // Update every second for live countdown
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [race.startTime, race.status, race.predictionsCloseTime]);

    const getStatusBadge = useCallback(() => {
        switch (race.status) {
            case 'live':
                return (
                    <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                    </span>
                );
            case 'completed':
                return (
                    <span className="bg-gray-600 text-gray-300 px-4 py-2 rounded-full text-sm font-bold">
                        ✓ Completed
                    </span>
                );
            default:
                return (
                    <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {predictionsCountdown && predictionsCountdown !== 'Closed'
                            ? `Predictions Open • Closes in ${predictionsCountdown}`
                            : predictionsCountdown === 'Closed'
                                ? 'Predictions Closed'
                                : 'Predictions Open'}
                    </span>
                );
        }
    }, [race.status, predictionsCountdown]);

    const formatDateTime = useMemo(() => {
        const date = new Date(race.startTime);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }, [race.startTime]);

    const isPredictEnabled = race.status === 'upcoming' && predictionsCountdown !== 'Closed';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
        >
            <div className="relative bg-gradient-to-r from-black/40 to-black/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
                {/* Subtle glow effect for upcoming/live races */}
                {(race.status === 'upcoming' || race.status === 'live') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent animate-pulse pointer-events-none"></div>
                )}

                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    {/* Left: Race Info */}
                    <div className="flex-1">
                        <p className="text-red-400 text-sm font-semibold mb-2 uppercase tracking-wider">
                            Next Race
                        </p>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                            {race.name}
                        </h2>

                        <div className="space-y-2 text-gray-300">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-base md:text-lg">{race.circuit}, {race.country}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-base md:text-lg">{formatDateTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-xl md:text-2xl font-bold text-white">
                                    ⏳ {race.status === 'completed' ? 'Finished' : `Starts in ${countdown}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col items-center md:items-end gap-4">
                        {getStatusBadge()}

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <motion.button
                                whileHover={isPredictEnabled ? { scale: 1.05 } : {}}
                                whileTap={isPredictEnabled ? { scale: 0.95 } : {}}
                                onClick={() => onPredict(race.id)}
                                disabled={!isPredictEnabled}
                                aria-label={`Predict for ${race.name}`}
                                title={!isPredictEnabled ? 'Predictions open 48 hours before the race' : undefined}
                                className={`flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black ${isPredictEnabled
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-500/50'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-60'
                                    }`}
                            >
                                <Trophy className="w-5 h-5" />
                                Predict
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onViewDetails(race.id)}
                                aria-label={`View details for ${race.name}`}
                                className="px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
                            >
                                View Details
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
