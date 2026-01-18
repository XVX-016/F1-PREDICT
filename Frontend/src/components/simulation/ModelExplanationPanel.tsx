import React from 'react';

interface ModelExplanationPanelProps {
    explanations?: { [driverId: string]: string[] };
}

const ModelExplanationPanel: React.FC<ModelExplanationPanelProps> = ({ explanations }) => {
    return (
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-[#1f1f26] pb-2">Model Attribution</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-6 font-mono">
                Simulation engine utilizes a deterministic physics layer [V2.5] for thermal degradation and mass depletion, overlaid with a stochastic Monte Carlo sampler (N=10k) to model systemic variance.
            </p>

            {explanations && Object.keys(explanations).length > 0 && (
                <div className="space-y-6 mb-8">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Driver-Level Parameter Set</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(explanations).slice(0, 4).map(([driverId, notes]) => (
                            <div key={driverId} className="p-3 bg-[#1f1f26] rounded border border-[#2a2a35]">
                                <span className="text-[10px] font-black text-red-600 uppercase mb-2 block tracking-widest">{driverId}_CONSTRAINTS</span>
                                <ul className="space-y-1.5 font-mono">
                                    {notes.map((note, i) => (
                                        <li key={i} className="text-[10px] text-gray-400 flex gap-2">
                                            <span className="text-red-600 opacity-50">/</span>
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-[#1f1f26] pt-6 uppercase font-mono tracking-tighter">
                <div className="p-3 bg-[#1f1f26] rounded border border-[#2a2a35]">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest block mb-1">PHYSICS_ENGINE</span>
                    <p className="text-[10px] text-gray-500 leading-tight">Tyre degradation utilizes exponential thermal decay models matched to track-specific telemetry benchmarks.</p>
                </div>
                <div className="p-3 bg-[#1f1f26] rounded border border-[#2a2a35]">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest block mb-1">STOCHASTIC_LAYER</span>
                    <p className="text-[10px] text-gray-500 leading-tight">Monte Carlo sampling accounts for SC windows, blue flag delta loss, and pit lane traffic variance.</p>
                </div>
            </div>
        </div>
    );
};

export default ModelExplanationPanel;
