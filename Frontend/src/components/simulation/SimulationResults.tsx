import React from 'react';
import { SimulationResponse } from '../../types/domain';
import { ShieldCheck, Target, Zap, Waves } from 'lucide-react';

interface SimulationResultsProps {
    results: SimulationResponse | null;
    isRunning: boolean;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ results, isRunning }) => {
    if (isRunning) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-[#1f1f26] rounded-md bg-black/20">
                <div className="w-12 h-1 bg-red-600 animate-pulse mb-6" />
                <div className="space-y-2 text-center">
                    <p className="text-[#E10600] text-[10px] font-mono animate-pulse uppercase tracking-[0.4em]">
                        CALCULATING_PROBABILITIES
                    </p>
                    <p className="text-slate-600 text-[8px] font-mono uppercase tracking-[0.2em]">Executing deep Monte Carlo sampling</p>
                </div>
            </div>
        );
    }

    if (!results) return null;

    // Pick top drivers by win probability
    const topDrivers = Object.entries(results.win_probability)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Primary Outcome: Win Probabilities */}
                <div className="lg:col-span-8 bg-[#121217] border border-[#1f1f26] rounded-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#1f1f26] flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-red-600" />
                            <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-widest">
                                Victory Probability Dist
                            </h4>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {topDrivers.map(([driver, prob]) => (
                            <div key={driver} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-white">{driver}</span>
                                        <span className="text-[9px] font-mono text-slate-500 uppercase">P50: {(results.pace_distributions[driver]?.p50 / 1000).toFixed(3)}s</span>
                                    </div>
                                    <span className="text-xs font-mono font-black text-red-600">
                                        {(prob * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-black rounded-full overflow-hidden border border-[#1f1f26] p-[1px]">
                                    <div
                                        className="h-full bg-red-600 transition-all duration-1000 rounded-full shadow-[0_0_8px_rgba(225,6,0,0.4)]"
                                        style={{ width: `${prob * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Robustness & Stability */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={14} className="text-green-500" />
                            <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-widest">Strategy Robustness</h4>
                        </div>
                        {topDrivers.slice(0, 3).map(([driver]) => {
                            const score = results.robustness_score[driver] || 0;
                            // Lower spread means higher robustness. Score is (p95-p05)/p50. 
                            // Let's normalize it for display: 1 - (score * multiplier)
                            const displayRobustness = Math.max(0, 1 - (score * 50));
                            return (
                                <div key={driver + '_robust'} className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest">
                                        <span className="text-slate-400">{driver} Reliability</span>
                                        <span className="text-white">{(displayRobustness * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1 bg-black rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-1000"
                                            style={{ width: `${displayRobustness * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        <p className="text-[8px] font-mono text-slate-600 uppercase leading-relaxed mt-4">
                            Model stability based on P05-P95 pace variation over {results.meta.iterations} iterations.
                        </p>
                    </div>

                    <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6 flex-1 flex flex-col justify-center text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center mx-auto">
                            <Zap size={18} className="text-red-600" />
                        </div>
                        <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-widest">Physics Core Active</h4>
                        <p className="text-[9px] font-mono text-slate-500 uppercase leading-relaxed">
                            Full collision avoidance and tyre wear models applied to simulation trace.
                        </p>
                    </div>
                </div>
            </div>

            {/* Pace Distributions */}
            <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6 overflow-x-auto">
                <div className="flex items-center gap-2 mb-6">
                    <Waves size={14} className="text-blue-500" />
                    <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-widest">Pace Distribution Map (P05/P50/P95)</h4>
                </div>
                <div className="flex gap-4 min-w-[600px]">
                    {topDrivers.map(([driver]) => {
                        const dist = results.pace_distributions[driver];
                        if (!dist) return null;
                        return (
                            <div key={driver + '_dist'} className="flex-1 bg-black/40 border border-[#1f1f26] p-4 rounded text-center space-y-3">
                                <span className="text-xs font-black text-white">{driver}</span>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase"><span>Aggressive</span><span>{(dist.p05 / 1000).toFixed(3)}s</span></div>
                                    <div className="flex justify-between text-[9px] font-mono text-red-500 font-bold uppercase"><span>Median</span><span>{(dist.p50 / 1000).toFixed(3)}s</span></div>
                                    <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase"><span>Defensive</span><span>{(dist.p95 / 1000).toFixed(3)}s</span></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default SimulationResults;
