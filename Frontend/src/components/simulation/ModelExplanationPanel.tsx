import React from 'react';

interface ModelExplanationPanelProps {
    explanations?: { [driverId: string]: string[] };
}

const ModelExplanationPanel: React.FC<ModelExplanationPanelProps> = ({ explanations }) => {
    return (
        <div className="bg-slate-900/30 border border-white/5 rounded-lg p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Model Attribution</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                This simulation uses a deterministic physics layer for tyre wear and fuel burn, overlaid with a stochastic Monte Carlo sampler to model driver variance and external race events.
            </p>

            {explanations && Object.keys(explanations).length > 0 && (
                <div className="space-y-6 mb-8">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Driver-Level Constraints</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(explanations).slice(0, 4).map(([driverId, notes]) => (
                            <div key={driverId} className="p-3 bg-black/20 rounded border border-white/5">
                                <span className="text-[10px] font-black text-[#E10600] uppercase mb-2 block">{driverId} Logic</span>
                                <ul className="space-y-1.5">
                                    {notes.map((note, i) => (
                                        <li key={i} className="text-[10px] text-slate-400 flex gap-2">
                                            <span className="text-[#E10600]">•</span>
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] font-bold text-[#E10600] uppercase tracking-widest block mb-1">Physics Engine</span>
                    <p className="text-[10px] text-slate-500">Tyre degradation uses exponential decay models matched to track surface abrasive data.</p>
                </div>
                <div className="p-3 bg-black/20 rounded border border-white/5">
                    <span className="text-[9px] font-bold text-[#E10600] uppercase tracking-widest block mb-1">Stochastic Layer</span>
                    <p className="text-[10px] text-slate-500">Monte Carlo sampling (N=10,000) accounts for safety car windows, blue flag delta loss, and weather transition uncertainty.</p>
                </div>
            </div>
        </div>
    );
};

export default ModelExplanationPanel;
