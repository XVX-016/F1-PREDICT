import React from 'react';

interface SimulationResultsProps {
    results: {
        win_probability: Record<string, number>;
        dnf_risk: Record<string, number>;
        metadata: {
            iterations: number;
            seed: number;
            model_version: string;
            mode: string;
        };
    } | null;
    isRunning: boolean;
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ results, isRunning }) => {
    if (isRunning) {
        return (
            <div className="flex flex-col items-center justify-center h-48 border border-[#1f1f26] rounded-md bg-black/20">
                <div className="w-10 h-1 border-t-2 border-red-600 animate-pulse mb-4" />
                <p className="text-[#E10600] text-[9px] font-mono animate-pulse uppercase tracking-[0.4em]">
                    EXEC_MONTE_CARLO_SAMPLING
                </p>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center h-48 border border-[#1f1f26] bg-[#121217] rounded-md">
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-mono">
                    IDLE // AWAITING_RUNTIME_PARAMETERS
                </p>
            </div>
        );
    }

    // Sort drivers by win probability
    const sortedDrivers = Object.entries(results.win_probability)
        .sort(([, a], [, b]) => b - a);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Win Probability Table */}
                <div className="bg-[#121217] border border-[#1f1f26] rounded-md overflow-hidden">
                    <div className="px-4 py-2 border-b border-[#1f1f26] flex justify-between items-center">
                        <h4 className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">
                            Win Probability Dist
                        </h4>
                        <span className="text-[8px] font-mono text-slate-600 uppercase">N = {results.metadata.iterations.toLocaleString()}</span>
                    </div>
                    <div className="p-4 space-y-2">
                        {sortedDrivers.map(([driver, prob]) => (
                            <div key={driver} className="flex items-center gap-3">
                                <span className="w-8 text-[11px] font-mono font-black text-white">{driver}</span>
                                <div className="flex-1 h-1.5 bg-black rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-600 transition-all duration-1000"
                                        style={{ width: `${prob * 100}%` }}
                                    />
                                </div>
                                <span className="w-12 text-right text-[11px] font-mono font-black text-white">
                                    {(prob * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DNF Risk Table */}
                <div className="bg-[#121217] border border-[#1f1f26] rounded-md overflow-hidden">
                    <div className="px-4 py-2 border-b border-[#1f1f26] flex justify-between items-center">
                        <h4 className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">
                            DNF Risk Attr
                        </h4>
                        <span className="text-[8px] font-mono text-slate-600 uppercase">Physics + Error Risk</span>
                    </div>
                    <div className="p-4 space-y-2">
                        {Object.entries(results.dnf_risk)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10)
                            .map(([driver, risk]) => (
                                <div key={driver} className="flex justify-between items-center text-[11px] font-mono border-b border-[#1f1f26] pb-1">
                                    <span className="text-slate-500">{driver}</span>
                                    <span className={risk > 0.1 ? 'text-red-500' : 'text-slate-300'}>
                                        {(risk * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* Metadata Footer & Export */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center px-4 py-3 bg-[#0b0b0e] border border-[#1f1f26] rounded font-mono text-[9px] uppercase tracking-widest text-slate-600">
                <div className="flex gap-4">
                    <span>Model: {results.metadata.model_version}</span>
                    <span>Mode: {results.metadata.mode}</span>
                    <span>Seed: {results.metadata.seed || 'RANDOM'}</span>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-[#1f1f26] hover:bg-[#2a2a35] text-slate-400 hover:text-white transition-colors rounded-sm flex items-center gap-2">
                        <span>CSV</span>
                    </button>
                    <button className="px-3 py-1 bg-[#1f1f26] hover:bg-[#2a2a35] text-slate-400 hover:text-white transition-colors rounded-sm flex items-center gap-2">
                        <span>JSON</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimulationResults;
