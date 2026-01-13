import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface RaceHeaderProps {
    race: {
        id: string;
        name: string;
        circuit: string;
        country: string;
        startTime: string; // ISO format
        predictionsCloseTime?: string; // ISO format
        status: 'open' | 'closed' | 'finished';
    };
}

export default function RaceHeader({ race }: RaceHeaderProps) {
    const [raceCountdown, setRaceCountdown] = useState('');
    const [predictionsCountdown, setPredictionsCountdown] = useState('');

    useEffect(() => {
        const updateCountdowns = () => {
            const now = new Date();

            // Race countdown
            const raceDate = new Date(race.startTime);
            const raceDiff = raceDate.getTime() - now.getTime();

            if (raceDiff <= 0) {
                setRaceCountdown(race.status === 'finished' ? 'Finished' : 'Live Now');
            } else {
                const days = Math.floor(raceDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((raceDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((raceDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((raceDiff % (1000 * 60)) / 1000);

                if (days > 0) {
                    setRaceCountdown(`${days}d ${hours}h ${minutes}m`);
                } else if (hours > 0) {
                    setRaceCountdown(`${hours}h ${minutes}m ${seconds}s`);
                } else if (minutes > 0) {
                    setRaceCountdown(`${minutes}m ${seconds}s`);
                } else {
                    setRaceCountdown(`${seconds}s`);
                }
            }

            // Predictions countdown
            if (race.predictionsCloseTime) {
                const predClose = new Date(race.predictionsCloseTime);
                const predDiff = predClose.getTime() - now.getTime();

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

        updateCountdowns();
        const interval = setInterval(updateCountdowns, 1000);

        return () => clearInterval(interval);
    }, [race.startTime, race.predictionsCloseTime, race.status]);

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

    const getStatusDisplay = () => {
        if (race.status === 'finished') {
            return (
                <div className="flex items-center gap-2 bg-gray-600/30 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-300 font-semibold">Race Completed</span>
                </div>
            );
        }

        if (race.status === 'closed' || predictionsCountdown === 'Closed') {
            return (
                <div className="flex items-center gap-2 bg-red-600/30 px-4 py-2 rounded-full">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 font-semibold">Predictions Closed</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 bg-green-600/30 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-semibold">
                    Predictions close in {predictionsCountdown}
                </span>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-red-500/30 shadow-lg"
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Race Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                            {race.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span>{race.circuit}, {race.country}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span>{formatDateTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span className="font-bold text-white">
                                    {race.status === 'finished' ? 'Finished' : `Starts in ${raceCountdown}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Status */}
                    <div className="flex items-center justify-start md:justify-end">
                        {getStatusDisplay()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
