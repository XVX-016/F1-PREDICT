import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface StrategyComparisonProps {
    baseline: {
        name: string;
        meanTime: number;
        stdDev: number;
        winProb: number;
    };
    candidate: {
        name: string;
        meanTime: number;
        stdDev: number;
        winProb: number;
    };
    onApply?: () => void;
}

const FormatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(3);
    return `${minutes}:${seconds.padStart(6, '0')}`;
};

const DeltaBadge = ({ base, comp, inverse = false }: { base: number, comp: number, inverse?: boolean }) => {
    const delta = comp - base;
    const isPositive = delta > 0;
    const isNogood = inverse ? isPositive : !isPositive; // If inverse (like time), positive delta is bad

    if (Math.abs(delta) < 0.001) return <span className="text-slate-500">-</span>;

    return (
        <div className={`flex items-center gap-1 text-xs font-bold ${isNogood ? 'text-red-500' : 'text-green-500'}`}>
            {isNogood ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            <span>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</span>
        </div>
    );
};

const StrategyComparison: React.FC<StrategyComparisonProps> = ({ baseline, candidate, onApply }) => {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-lg p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Strategy Comparison</h3>

            <div className="grid grid-cols-3 gap-4 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                <div>Metric</div>
                <div>{baseline.name}</div>
                <div className="text-blue-400">{candidate.name}</div>
            </div>

            <div className="space-y-4">
                {/* Mean Race Time */}
                <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
                    <div className="text-xs font-bold text-slate-300">Exp. Race Time</div>
                    <div className="text-center font-mono text-slate-400">{FormatTime(baseline.meanTime)}</div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-white">{FormatTime(candidate.meanTime)}</span>
                        <DeltaBadge base={baseline.meanTime / 1000} comp={candidate.meanTime / 1000} inverse />
                    </div>
                </div>

                {/* Win Prob */}
                <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
                    <div className="text-xs font-bold text-slate-300">Win Probability</div>
                    <div className="text-center font-mono text-slate-400">{(baseline.winProb * 100).toFixed(1)}%</div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-white">{(candidate.winProb * 100).toFixed(1)}%</span>
                        <DeltaBadge base={baseline.winProb * 100} comp={candidate.winProb * 100} />
                    </div>
                </div>

                {/* Consistency (Std Dev) */}
                <div className="grid grid-cols-3 gap-4 items-center py-3">
                    <div className="text-xs font-bold text-slate-300">Consistency (σ)</div>
                    <div className="text-center font-mono text-slate-400">±{(baseline.stdDev / 1000).toFixed(2)}s</div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-white">±{(candidate.stdDev / 1000).toFixed(2)}s</span>
                        <DeltaBadge base={baseline.stdDev / 1000} comp={candidate.stdDev / 1000} inverse />
                    </div>
                </div>
            </div>

            {onApply && (
                <button
                    onClick={onApply}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 text-blue-400 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    <span>Switch to Strategy B</span>
                    <ArrowRight className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

export default StrategyComparison;
