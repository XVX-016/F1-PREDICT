import { useState } from 'react';
import { Trophy, Medal, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Driver {
    id: string;
    name: string;
    number: number;
    team: string;
    teamColor?: string;
    photoUrl?: string; // Driver photo
}

interface PredictionTabsProps {
    drivers: Driver[];
    onPredictionChange: (predictions: {
        winner?: string;
        podium?: { first: string; second: string; third: string };
        fastestLap?: string;
    }) => void;
    disabled?: boolean;
}

type TabType = 'winner' | 'podium' | 'fastestLap';

export default function PredictionTabs({ drivers, onPredictionChange, disabled = false }: PredictionTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('winner');
    const [winner, setWinner] = useState<string>('');
    const [podium, setPodium] = useState({ first: '', second: '', third: '' });
    const [fastestLap, setFastestLap] = useState<string>('');

    const handleWinnerChange = (driverId: string) => {
        setWinner(driverId);
        onPredictionChange({ winner: driverId, podium, fastestLap });
    };

    const handlePodiumChange = (position: 'first' | 'second' | 'third', driverId: string) => {
        const newPodium = { ...podium, [position]: driverId };
        setPodium(newPodium);
        onPredictionChange({ winner, podium: newPodium, fastestLap });
    };

    const handleFastestLapChange = (driverId: string) => {
        setFastestLap(driverId);
        onPredictionChange({ winner, podium, fastestLap: driverId });
    };

    const tabs = [
        { id: 'winner' as TabType, label: 'Race Winner', icon: Trophy },
        { id: 'podium' as TabType, label: 'Podium', icon: Medal },
        { id: 'fastestLap' as TabType, label: 'Fastest Lap', icon: Zap }
    ];

    const isPodiumValid = () => {
        const { first, second, third } = podium;
        if (!first || !second || !third) return false;
        return first !== second && first !== third && second !== third;
    };

    // Driver Card Component with Photo
    const DriverCard = ({ driver, isSelected, onClick }: { driver: Driver; isSelected: boolean; onClick: () => void }) => (
        <motion.button
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
            onClick={onClick}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 transition-all text-left ${isSelected
                    ? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/30'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-center gap-3">
                {/* Driver Photo */}
                {driver.photoUrl ? (
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isSelected ? 'border-red-400' : 'border-white/20'
                        } shadow-lg`}>
                        <img
                            src={driver.photoUrl}
                            alt={driver.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isSelected ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'
                        }`}>
                        {driver.number}
                    </div>
                )}

                {/* Driver Info */}
                <div className="flex-1">
                    <div className="font-bold text-white">{driver.name}</div>
                    <div className="text-sm text-gray-400">{driver.team}</div>
                </div>

                {/* Driver Number */}
                <div className={`text-2xl font-bold ${isSelected ? 'text-red-400' : 'text-gray-500'}`}>
                    #{driver.number}
                </div>
            </div>
        </motion.button>
    );

    return (
        <div className="space-y-6">
            {/* Tab Headers */}
            <div className="flex flex-wrap gap-2 bg-black/30 p-2 rounded-xl border border-white/10">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <motion.button
                            key={tab.id}
                            whileHover={!disabled ? { scale: 1.02 } : {}}
                            whileTap={!disabled ? { scale: 0.98 } : {}}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={disabled}
                            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${isActive
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                >
                    {activeTab === 'winner' && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Select Race Winner
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {drivers.map((driver) => (
                                    <DriverCard
                                        key={driver.id}
                                        driver={driver}
                                        isSelected={winner === driver.id}
                                        onClick={() => handleWinnerChange(driver.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'podium' && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Medal className="w-5 h-5 text-yellow-500" />
                                Select Podium Finish
                            </h3>
                            <div className="space-y-4">
                                {/* 1st Place */}
                                <div>
                                    <label className="block text-sm font-semibold text-yellow-400 mb-2">
                                        🥇 1st Place
                                    </label>
                                    <select
                                        value={podium.first}
                                        onChange={(e) => handlePodiumChange('first', e.target.value)}
                                        disabled={disabled}
                                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select driver...</option>
                                        {drivers.map((driver) => (
                                            <option key={driver.id} value={driver.id} disabled={podium.second === driver.id || podium.third === driver.id}>
                                                #{driver.number} {driver.name} ({driver.team})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 2nd Place */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        🥈 2nd Place
                                    </label>
                                    <select
                                        value={podium.second}
                                        onChange={(e) => handlePodiumChange('second', e.target.value)}
                                        disabled={disabled}
                                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select driver...</option>
                                        {drivers.map((driver) => (
                                            <option key={driver.id} value={driver.id} disabled={podium.first === driver.id || podium.third === driver.id}>
                                                #{driver.number} {driver.name} ({driver.team})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3rd Place */}
                                <div>
                                    <label className="block text-sm font-semibold text-orange-400 mb-2">
                                        🥉 3rd Place
                                    </label>
                                    <select
                                        value={podium.third}
                                        onChange={(e) => handlePodiumChange('third', e.target.value)}
                                        disabled={disabled}
                                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select driver...</option>
                                        {drivers.map((driver) => (
                                            <option key={driver.id} value={driver.id} disabled={podium.first === driver.id || podium.second === driver.id}>
                                                #{driver.number} {driver.name} ({driver.team})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!isPodiumValid() && (podium.first || podium.second || podium.third) && (
                                    <div className="text-sm text-yellow-400 flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span>All three positions must be filled with different drivers</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'fastestLap' && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-purple-500" />
                                Select Fastest Lap Driver
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {drivers.map((driver) => (
                                    <DriverCard
                                        key={driver.id}
                                        driver={driver}
                                        isSelected={fastestLap === driver.id}
                                        onClick={() => handleFastestLapChange(driver.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
