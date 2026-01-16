import React from 'react';

interface StrategyStats {
    mean_time: number;
    std_time: number;
}

interface StrategyComparisonProps {
    comparison: {
        A: StrategyStats;
        B: StrategyStats;
        delta: StrategyStats;
    } | null;
}

const StrategyComparison: React.FC<StrategyComparisonProps> = ({ comparison }) => {
    if (!comparison) return null;

    const { A, B, delta } = comparison;

    const formatTime = (ms: number) => {
        const totalSec = ms / 1000;
        const min = Math.floor(totalSec / 60);
        const sec = (totalSec % 60).toFixed(3);
        return `${min}m ${sec}s`;
    };

    const formatDelta = (ms: number) => {
        const sec = (ms / 1000).toFixed(3);
        return `${ms > 0 ? '+' : ''}${sec}s`;
    };

    return (
        <div className="bg-slate-900/30 border border-white/5 rounded-lg p-6 mt-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Strategy Comparison</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="absolute left-1/2 top-4 bottom-4 w-[1px] bg-white/5 hidden md:block"></div>

                {/* Strategy A */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Strategy A</span>
                        <span className="text-[10px] font-mono text-slate-600">Baseline</span>
                    </div>
                    <div className="p-4 bg-black/20 rounded border border-white/5">
                        <p className="text-[9px] text-slate-500 uppercase mb-1">Expected Time</p>
                        <p className="text-xl font-mono text-white font-bold">{formatTime(A.mean_time)}</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded border border-white/5">
                        <p className="text-[9px] text-slate-500 uppercase mb-1">Uncertainty (σ)</p>
                        <p className="text-lg font-mono text-slate-300">±{(A.std_time / 1000).toFixed(2)}s</p>
                    </div>
                </div>

                {/* Strategy B */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#E10600] uppercase tracking-widest">Strategy B</span>
                        <span className="text-[10px] font-mono text-slate-600">Comparison</span>
                    </div>
                    <div className="p-4 bg-black/20 rounded border border-white/5 relative">
                        <p className="text-[9px] text-slate-500 uppercase mb-1">Expected Time</p>
                        <p className="text-xl font-mono text-white font-bold">{formatTime(B.mean_time)}</p>
                        <div className={`absolute top-4 right-4 text-[10px] font-bold font-mono ${delta.mean_time < 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatDelta(-delta.mean_time)}
                        </div>
                    </div>
                    <div className="p-4 bg-black/20 rounded border border-white/5 relative">
                        <p className="text-[9px] text-slate-500 uppercase mb-1">Uncertainty (σ)</p>
                        <p className="text-lg font-mono text-slate-300">±{(B.std_time / 1000).toFixed(2)}s</p>
                        <div className={`absolute top-4 right-4 text-[10px] font-bold font-mono ${delta.std_time < 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatDelta(-delta.std_time)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[10px] text-slate-500 italic">
                    *Comparison derived from 2,000 Monte Carlo runs with identical random seeds to isolate strategy impact from stochastic noise.
                </p>
            </div>
        </div>
    );
};

export default StrategyComparison;
