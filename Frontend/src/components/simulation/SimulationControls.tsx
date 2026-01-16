import React from 'react';
import AnimatedSlider from '../AnimatedSlider';

interface SimulationControlsProps {
    params: {
        tyreDegMultiplier: number;
        scProbability: number;
        strategyAggression: string;
        weatherScenario: string;
        gridSource: string;
    };
    onChange: (newParams: any) => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({ params, onChange }) => {
    const updateParam = (key: string, value: any) => {
        onChange({ ...params, [key]: value });
    };

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-lg p-6 space-y-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Physics Parameters</h3>

            {/* Tyre Degradation */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tyre Degradation Multiplier</label>
                    <span className="text-lg font-black text-white font-mono">{params.tyreDegMultiplier.toFixed(2)}x</span>
                </div>
                <AnimatedSlider
                    min={0.8}
                    max={1.3}
                    step={0.01}
                    value={params.tyreDegMultiplier}
                    onChange={(v) => updateParam('tyreDegMultiplier', v)}
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                    <span>Low Wear (0.8)</span>
                    <span>High Wear (1.3)</span>
                </div>
            </div>

            {/* Safety Car Probability */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Safety Car Probability</label>
                    <span className="text-lg font-black text-white font-mono">{Math.round(params.scProbability * 100)}%</span>
                </div>
                <AnimatedSlider
                    min={0}
                    max={0.6}
                    step={0.01}
                    value={params.scProbability}
                    onChange={(v) => updateParam('scProbability', v)}
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                    <span>Rare (0%)</span>
                    <span>Frequent (60%)</span>
                </div>
            </div>

            {/* Strategy Aggression */}
            <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strategy Aggression</label>
                <div className="grid grid-cols-3 gap-2">
                    {['Conservative', 'Balanced', 'Aggressive'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => updateParam('strategyAggression', mode)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-widest border transition-all rounded ${params.strategyAggression === mode
                                    ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                    : 'bg-black/20 border-white/10 text-slate-500 hover:border-white/20'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weather Scenario */}
            <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weather Scenario</label>
                <div className="grid grid-cols-3 gap-2">
                    {['Dry', 'Mixed', 'Wet'].map((w) => (
                        <button
                            key={w}
                            onClick={() => updateParam('weatherScenario', w)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-widest border transition-all rounded ${params.weatherScenario === w
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                    : 'bg-black/20 border-white/10 text-slate-500 hover:border-white/20'
                                }`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Source */}
            <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Grid State</label>
                <div className="grid grid-cols-2 gap-2">
                    {['Qualifying', 'Adjusted'].map((g) => (
                        <button
                            key={g}
                            onClick={() => updateParam('gridSource', g)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-widest border transition-all rounded ${params.gridSource === g
                                    ? 'bg-white/10 border-white/40 text-white'
                                    : 'bg-black/20 border-white/10 text-slate-500 hover:border-white/20'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SimulationControls;
