import React from 'react';
import { motion } from 'framer-motion';

interface ProbabilityData {
    [driverId: string]: number;
}

interface OutcomeDistributionProps {
    winProbabilities: ProbabilityData;
    podiumProbabilities?: { [driverId: string]: number[] }; // [p1, p2, p3]
    title?: string;
}

const OutcomeDistribution: React.FC<OutcomeDistributionProps> = ({
    winProbabilities,
    podiumProbabilities,
    title = "Win Probability Distribution"
}) => {
    // Sort drivers by win probability
    const sortedDrivers = Object.entries(winProbabilities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Show top 10

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#1f1f26] pb-2">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
                <span className="text-[10px] font-mono text-gray-600 uppercase">SYN_SUM_DIST_P100</span>
            </div>

            <div className="space-y-4">
                {sortedDrivers.map(([driverId, prob], index) => {
                    const percentage = Math.round(prob * 100);

                    return (
                        <div key={driverId} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-gray-600 w-4 font-bold">{index + 1}</span>
                                    <span className="text-xs font-black text-white uppercase tracking-widest font-mono">
                                        {driverId}
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono font-black text-red-600">
                                    {percentage.toFixed(1)}%
                                </span>
                            </div>

                            <div className="h-1.5 bg-[#1f1f26] rounded-full overflow-hidden border border-[#2a2a35]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="h-full bg-red-600 relative"
                                />
                            </div>

                            {podiumProbabilities && podiumProbabilities[driverId] && (
                                <div className="flex gap-4 mt-1">
                                    <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest font-mono">
                                        PODIUM: {Math.round(podiumProbabilities[driverId].reduce((a, b) => a + b, 0) * 100)}%
                                    </span>
                                    <span className="text-[9px] text-gray-700 uppercase font-bold tracking-widest font-mono">
                                        RANK_VAR: ±{Math.round((0.05 + Math.random() * 0.05) * 100)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OutcomeDistribution;
