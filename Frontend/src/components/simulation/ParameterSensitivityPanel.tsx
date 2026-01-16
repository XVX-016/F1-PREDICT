import React from 'react';

interface SensitivityEntry {
    parameter: string;
    baseline: number;
    modified: number;
    deltas: { [driverId: string]: number };
}

interface ParameterSensitivityPanelProps {
    sensitivity: SensitivityEntry[];
}

const ParameterSensitivityPanel: React.FC<ParameterSensitivityPanelProps> = ({ sensitivity }) => {
    if (!sensitivity || sensitivity.length === 0) return null;

    return (
        <div className="bg-slate-900/30 border border-white/5 rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sensitivity Analysis</h3>
                <span className="text-[10px] font-mono text-slate-600 uppercase">Vector Shift: ΔP per 0.1 param</span>
            </div>

            <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-wider leading-relaxed">
                Visualizing the impact of parameter variation on leading edge probabilities. Positive values indicate increased win probability with parameter increase.
            </p>

            <div className="space-y-8">
                {sensitivity.map((s, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#E10600] uppercase tracking-widest">{s.parameter.replace(/_/g, ' ')}</span>
                            <div className="h-[1px] flex-1 bg-white/5"></div>
                            <span className="text-[9px] font-mono text-slate-600">{s.baseline} → {s.modified}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(s.deltas).slice(0, 5).map(([driverId, delta]) => {
                                const isPositive = delta > 0;
                                return (
                                    <div key={driverId} className="p-3 bg-black/40 rounded border border-white/5 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-white mb-2 uppercase">{driverId}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-[11px] font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : ''}{(delta * 100).toFixed(1)}%
                                            </div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParameterSensitivityPanel;
