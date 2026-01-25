import React from 'react';

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
                    </div>
                </div>
            </div>

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
                </div>
            </div>
        </div>
    );
};

export default StrategyRecommendationCard;
