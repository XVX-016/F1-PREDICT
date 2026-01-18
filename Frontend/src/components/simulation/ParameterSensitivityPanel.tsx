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
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6 mt-8">
            <div className="flex justify-between items-center mb-4 border-b border-[#1f1f26] pb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Sensitivity Analysis</h3>
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Vector Shift: ΔP per 0.1 UNIT</span>
            </div>

            <p className="text-[11px] text-gray-500 mb-6 uppercase tracking-wider leading-relaxed font-mono">
                Impact of parameter variation on leading edge probabilities. Positive values indicate increased win probability with parameter scaling.
            </p>

            <div className="space-y-8">
                {sensitivity.map((s, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] font-mono">{s.parameter.replace(/_/g, ' ')}</span>
                            <div className="h-[1px] flex-1 bg-[#1f1f26]"></div>
                            <span className="text-[10px] font-mono text-gray-600">{s.baseline} → {s.modified}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(s.deltas).slice(0, 5).map(([driverId, delta]) => {
                                const isPositive = delta > 0;
                                return (
                                    <div key={driverId} className="p-3 bg-[#1f1f26] rounded border border-[#2a2a35] flex flex-col items-center">
                                        <span className="text-[10px] font-black text-white mb-2 uppercase font-mono">{driverId}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-[11px] font-mono font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : ''}{(delta * 100).toFixed(1)}%
                                            </div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></div>
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
