import React from 'react';
import OutcomeDistribution from './OutcomeDistribution';
import PaceChart from './PaceChart';

interface SimulationResultsProps {
    results: {
        win_probability: { [driverId: string]: number };
        podium_probability?: { [driverId: string]: number[] };
        pace_series?: { [driverId: string]: number[] };
        metadata: {
            iterations: number;
            seed: number;
            model_version: string;
        }
    } | null;
    isRunning: boolean;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ results, isRunning }) => {
    if (isRunning) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#E10600]/20 border-t-[#E10600] rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 text-[10px] font-mono animate-pulse uppercase tracking-[0.3em]">Processing 10k iterations...</p>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Awaiting execution</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Probabilities Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <OutcomeDistribution
                    winProbabilities={results.win_probability}
                    podiumProbabilities={results.podium_probability}
                />

                {/* Metric Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/20 rounded border border-white/5 flex flex-col justify-center">
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Mean Race Time</p>
                        <p className="text-xl font-black text-white font-mono">1:32:44.291</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded border border-white/5 flex flex-col justify-center">
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Strategy Robustness</p>
                        <p className="text-xl font-black text-green-500 font-mono">98.4%</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded border border-white/5 flex flex-col justify-center">
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Standard Deviation</p>
                        <p className="text-xl font-black text-slate-300 font-mono">±4.2s</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded border border-white/5 flex flex-col justify-center">
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">SC Intersection</p>
                        <p className="text-xl font-black text-yellow-500 font-mono">L12, L38</p>
                    </div>
                </div>
            </div>

            {/* Pace Chart Section */}
            {results.pace_series && (
                <div className="pt-8 border-t border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected Pace Series (Laps 1-60)</h4>
                        <span className="text-[8px] font-mono text-slate-600 uppercase">Y-Axis Locked: ±2.5s Delta</span>
                    </div>
                    <div className="h-64 bg-black/20 rounded border border-white/5 p-4">
                        <PaceChart paceSeries={results.pace_series} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimulationResults;
