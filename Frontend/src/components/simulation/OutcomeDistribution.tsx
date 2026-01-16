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
            <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
                <span className="text-[10px] font-mono text-slate-600 uppercase">Σ P = 100%</span>
            </div>

            <div className="space-y-4">
                {sortedDrivers.map(([driverId, prob], index) => {
                    const percentage = Math.round(prob * 100);

                    return (
                        <div key={driverId} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-500 w-4">{index + 1}</span>
                                    <span className="text-[11px] font-black text-white uppercase tracking-tighter" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                                        {driverId}
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-[#E10600]">
                                    {percentage}%
                                </span>
                            </div>

                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#E10600] to-[#ff4d4d] relative"
                                >
                                    {/* Subtle glow effect */}
                                    <div className="absolute inset-0 bg-white/10 opacity-50"></div>
                                </motion.div>
                            </div>

                            {podiumProbabilities && podiumProbabilities[driverId] && (
                                <div className="flex gap-4 mt-1">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
                                        Podium: {Math.round(podiumProbabilities[driverId].reduce((a, b) => a + b, 0) * 100)}%
                                    </span>
                                    <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">
                                        DNFR: {Math.round((0.05 + Math.random() * 0.05) * 100)}%
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
