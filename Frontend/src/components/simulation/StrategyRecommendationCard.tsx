import React from 'react';
import { Target, Shield, Zap } from 'lucide-react';

interface Stint {
    compound: string;
    end_lap: number;
}

interface StrategyRecommendation {
    strategy: {
        name: string;
        stints: Stint[];
    };
    mean_time: number;
    std_time: number;
    score: number;
}

interface StrategyRecommendationCardProps {
    recommendation: StrategyRecommendation | null;
}

const StrategyRecommendationCard: React.FC<StrategyRecommendationCardProps> = ({ recommendation }) => {
    if (!recommendation) return null;

    const { strategy, mean_time, std_time } = recommendation;

    // Derived metrics
    const stabilityScore = Math.max(0, 100 - (std_time / 1000)).toFixed(1);
    const raceTimeStr = new Date(mean_time).toISOString().substr(11, 12);
    const riskLevel = std_time > 5000 ? "High" : (std_time > 2000 ? "Moderate" : "Low");

    return (
        <div className="bg-slate-900/40 border border-[#E10600]/30 rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target size={80} className="text-[#E10600]" />
            </div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xs font-bold text-[#E10600] uppercase tracking-[0.2em] mb-1">Recommended Strategy</h3>
                    <p className="text-xl font-black text-white uppercase tracking-tight">{strategy.name}</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Stability</p>
                        <p className="text-lg font-mono font-bold text-green-400">{stabilityScore}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Risk Profile</p>
                        <p className={`text-lg font-mono font-bold ${riskLevel === 'Low' ? 'text-blue-400' : 'text-yellow-400'}`}>{riskLevel}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {strategy.stints.map((stint, idx) => (
                    <div key={idx} className="p-3 bg-black/40 rounded border border-white/5 flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 uppercase mb-2">Stint {idx + 1}</span>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-[10px] mb-2
              ${stint.compound === 'Soft' ? 'border-red-500 text-red-500' :
                                stint.compound === 'Medium' ? 'border-yellow-500 text-yellow-500' :
                                    'border-white/50 text-white/50'}`}>
                            {stint.compound[0]}
                        </div>
                        <span className="text-xs font-mono text-white">Until Lap {stint.end_lap}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[#E10600]" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Physics-Validated</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-yellow-500" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Optimum E[T]</span>
                </div>
                <div className="ml-auto text-[10px] font-mono text-slate-600">
                    σ = {(std_time / 1000).toFixed(3)}s
                </div>
            </div>
        </div>
    );
};

export default StrategyRecommendationCard;
