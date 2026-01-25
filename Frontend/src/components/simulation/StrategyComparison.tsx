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
    // For time (inverse=true): positive delta is bad (slower)
    // For win probability (inverse=false): positive delta is good (more likely)
    const isBad = inverse ? isPositive : !isPositive;

    if (Math.abs(delta) < 0.001) return <span className="text-gray-600 font-mono text-[10px]">-</span>;

    return (
        <div className={`flex items-center gap-1 text-[10px] font-bold font-mono ${isBad ? 'text-red-500' : 'text-green-500'}`}>
            <span>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</span>
            <span className="text-[8px]">{isBad ? '▼' : '▲'}</span>
        </div>
    );
};

const StrategyComparison: React.FC<StrategyComparisonProps> = ({ baseline, candidate, onApply }) => {
    return (
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Strategy Comparison</h3>

            <div className="grid grid-cols-3 gap-4 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center border-b border-[#1f1f26] pb-2">
                <div className="text-left">Metric</div>
                <div>{baseline.name}</div>
                <div className="text-blue-500">{candidate.name}</div>
            </div>

            <div className="space-y-4">
                {/* Mean Race Time */}
                <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-[#1f1f26]">
                    <div className="text-xs font-bold text-gray-400">E[RACE_TIME]</div>
                    <div className="text-center font-mono text-gray-500 text-sm">{FormatTime(baseline.meanTime)}</div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-white text-sm">{FormatTime(candidate.meanTime)}</span>
                        <DeltaBadge base={baseline.meanTime / 1000} comp={candidate.meanTime / 1000} inverse />
                    </div>
                </div>

                {/* Win Prob */}
                <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-[#1f1f26]">
                    <div className="text-xs font-bold text-gray-400">WIN_PROBABILITY</div>
                    <div className="text-center font-mono text-gray-500 text-sm">{(baseline.winProb * 100).toFixed(1)}%</div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-white text-sm">{(candidate.winProb * 100).toFixed(1)}%</span>
                        <DeltaBadge base={baseline.winProb * 100} comp={candidate.winProb * 100} />
                    </div>
                </div>

                {/* Consistency (Std Dev) */}
                <div className="grid grid-cols-3 gap-4 items-center py-3">
                    <div className="text-xs font-bold text-gray-400">CONSISTENCY (σ)</div>
                    <div className="text-center font-mono text-gray-500 text-sm">±{(baseline.stdDev / 1000).toFixed(2)}s</div>
                    <div className="flex flex-col items-center">
                        <span className="font-mono text-white text-sm">±{(candidate.stdDev / 1000).toFixed(2)}s</span>
                        <DeltaBadge base={baseline.stdDev / 1000} comp={candidate.stdDev / 1000} inverse />
                    </div>
                </div>
            </div>

            {onApply && (
                <button
                    onClick={onApply}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors font-mono"
                >
                    <span>SWITCH_TO_CANDIDATE_STRATEGY</span>
                    <ArrowRight className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

export default StrategyComparison;
