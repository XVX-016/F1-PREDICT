import React from 'react';
<<<<<<< HEAD
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
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Expected Time</p>
                        <p className="text-lg font-mono font-bold text-white">{raceTimeStr}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Stability</p>
                        <p className="text-lg font-mono font-bold text-green-400">{stabilityScore}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Risk Profile</p>
                        <p className={`text-lg font-mono font-bold ${riskLevel === 'Low' ? 'text-blue-400' : 'text-yellow-400'}`}>{riskLevel}</p>
=======

interface StrategyStint {
    compound: 'soft' | 'medium' | 'hard';
    end_lap: number;
}

interface StrategyResult {
    name: string;
    stints: StrategyStint[];
    expected_time_loss: number;
    risk_score: number;
    robustness: number;
}

interface StrategyRecommendationCardProps {
    strategy: StrategyResult;
}

const StrategyRecommendationCard: React.FC<StrategyRecommendationCardProps> = ({ strategy }) => {
    return (
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-mono font-black text-red-600 uppercase tracking-widest">
                        Optimal Strategy Recommendation
                    </h3>
                    <p className="text-xl font-black text-white uppercase tracking-tight font-mono">
                        {strategy.name}
                    </p>
                </div>
                <div className="flex gap-4 font-mono">
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Robustness</p>
                        <p className="text-sm font-black text-green-500">{strategy.robustness.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Risk Index</p>
                        <p className={`text-sm font-black ${strategy.risk_score < 15 ? 'text-green-500' : strategy.risk_score < 40 ? 'text-amber-500' : 'text-red-500'}`}>
                            {strategy.risk_score.toFixed(1)}
                        </p>
>>>>>>> feature/redis-telemetry-replay
                    </div>
                </div>
            </div>

<<<<<<< HEAD
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
=======
            {/* Stint Timeline */}
            <div className="relative h-12 flex items-center">
                <div className="absolute inset-0 h-1 top-1/2 -translate-y-1/2 bg-[#1f1f26] rounded-full" />
                <div className="relative w-full flex justify-between">
                    {strategy.stints.map((stint, idx) => {
                        const startLap = idx === 0 ? 1 : strategy.stints[idx - 1].end_lap + 1;
                        const duration = stint.end_lap - startLap + 1;
                        const totalLaps = strategy.stints[strategy.stints.length - 1].end_lap;
                        const widthPercent = (duration / totalLaps) * 100;

                        return (
                            <div
                                key={idx}
                                style={{ width: `${widthPercent}%` }}
                                className="relative flex flex-col items-center group"
                            >
                                <div className={`w-3 h-3 rounded-full border-2 bg-[#121217] z-10 
                                    ${stint.compound === 'soft' ? 'border-red-600' :
                                        stint.compound === 'medium' ? 'border-amber-500' :
                                            'border-slate-200'}`}
                                />
                                <div className="absolute -bottom-6 flex flex-col items-center">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">{stint.compound}</span>
                                    <span className="text-[9px] font-mono text-white font-bold">L{stint.end_lap}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#1f1f26]">
                <div className="space-y-1">
                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Expected Delta (vs Field)</p>
                    <p className="text-xs font-mono font-black text-white">
                        {strategy.expected_time_loss > 0 ? '+' : ''}{(strategy.expected_time_loss / 1000).toFixed(3)}s
                    </p>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Model Confidence</p>
                    <p className="text-xs font-mono font-black text-slate-400">Deterministic Monte Carlo</p>
>>>>>>> feature/redis-telemetry-replay
                </div>
            </div>
        </div>
    );
};

export default StrategyRecommendationCard;
