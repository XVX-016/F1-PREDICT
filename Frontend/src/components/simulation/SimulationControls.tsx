import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Wind, Layers, CircuitBoard, MapPin } from 'lucide-react';

import { SimulationRequest } from '../../types/domain';

interface SimulationControlsProps {
    params: SimulationRequest;
    onChange: (newParams: SimulationRequest) => void;
    availableTracks?: Record<string, { name: string }>;
}

const ControlSection = ({
    title,
    icon: Icon,
    children,
    defaultOpen = false
}: {
    title: string;
    icon: any;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[#1f1f26] rounded bg-black/20 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-[#121217] hover:bg-[#1a1a20] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon size={12} className="text-red-600" />
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">{title}</span>
                </div>
                {isOpen ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
            </button>
            {isOpen && <div className="p-4 space-y-4 border-t border-[#1f1f26]">{children}</div>}
        </div>
    );
};

const SimulationControls: React.FC<SimulationControlsProps> = ({ params, onChange, availableTracks }) => {
    const updateTopParam = (key: keyof SimulationRequest, value: any) => {
        onChange({ ...params, [key]: value });
    };

    const updateNestedParam = (key: string, value: any) => {
        onChange({
            ...params,
            params: {
                ...params.params,
                [key]: value
            }
        });
    };

    // Helper for current params
    const cParams = params.params || {};

    return (
        <div className="space-y-3">
            {/* Track Selection */}
            {availableTracks && (
                <ControlSection title="Venue" icon={MapPin} defaultOpen={true}>
                    <div className="space-y-2">
                        <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Select Circuit</label>
                        <select
                            value={params.track_id}
                            onChange={(e) => updateTopParam('track_id', e.target.value)}
                            className="w-full bg-black border border-[#1f1f26] text-[10px] font-mono text-white p-2 rounded-xs focus:outline-none focus:border-red-600 uppercase"
                        >
                            {Object.entries(availableTracks).map(([id, track]) => (
                                <option key={id} value={id}>{track.name}</option>
                            ))}
                        </select>
                    </div>
                </ControlSection>
            )}

            {/* Race Conditions */}
            <ControlSection title="Conditions" icon={Wind}>
                <div className="space-y-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Weather Profile</label>
                    <div className="flex gap-1">
                        {(['dry', 'damp', 'wet'] as const).map((w) => (
                            <button
                                key={w}
                                onClick={() => updateNestedParam('weather_scenario', w)}
                                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border font-mono transition-all ${cParams.weather_scenario === w
                                    ? 'bg-blue-900/40 border-blue-500 text-blue-400'
                                    : 'bg-black border-[#1f1f26] text-slate-600 hover:border-slate-700 font-normal'
                                    }`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                        <label className="text-slate-500 uppercase tracking-widest">Safety Car Risk</label>
                        <span className="text-white font-black">{Math.round((cParams.sc_probability || 0) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={cParams.sc_probability || 0}
                        onChange={(e) => updateNestedParam('sc_probability', parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#1f1f26] appearance-none cursor-pointer accent-red-600 rounded-full"
                    />
                </div>
            </ControlSection>

            {/* Strategy Variables */}
            <ControlSection title="Variables" icon={Layers} defaultOpen={true}>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                        <label className="text-slate-500 uppercase tracking-widest">Tyre Deg Factor</label>
                        <span className="text-white font-black">{(cParams.tyre_deg_multiplier || 1.0).toFixed(2)}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.01"
                        value={cParams.tyre_deg_multiplier || 1.0}
                        onChange={(e) => updateNestedParam('tyre_deg_multiplier', parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#1f1f26] appearance-none cursor-pointer accent-red-600 rounded-full"
                    />
                </div>

                <div className="space-y-2 pt-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Strategy Mode</label>
                    <div className="grid grid-cols-3 gap-1">
                        {(['defensive', 'balanced', 'aggressive'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => updateNestedParam('strategy_aggression', mode)}
                                className={`py-1.5 text-[8px] font-black uppercase tracking-widest border font-mono transition-all ${cParams.strategy_aggression === mode
                                    ? 'bg-red-900/40 border-red-500 text-red-500'
                                    : 'bg-black border-[#1f1f26] text-slate-600 hover:border-slate-700 font-normal'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </ControlSection>

            {/* Model Config */}
            <ControlSection title="Compute Model" icon={CircuitBoard}>
                <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">ML Residuals</label>
                    <button
                        onClick={() => updateTopParam('use_ml', !params.use_ml)}
                        className={`px-2 py-0.5 text-[8px] font-mono border uppercase tracking-wider ${params.use_ml ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-slate-600 border-[#1f1f26] bg-black'}`}
                    >
                        {params.use_ml ? 'Active' : 'Disabled'}
                    </button>
                </div>

                <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        <span>Deterministic Seed</span>
                    </div>
                    <div className="flex gap-1">
                        <input
                            type="number"
                            value={params.seed || ''}
                            onChange={(e) => updateTopParam('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="RANDOM"
                            className="flex-1 bg-black border border-[#1f1f26] text-[10px] font-mono text-white p-2 rounded-xs focus:outline-none focus:border-red-600 uppercase"
                        />
                        <button
                            onClick={() => updateTopParam('seed', Math.floor(Math.random() * 1000000))}
                            className="bg-[#1f1f26] text-slate-400 px-3 hover:text-white transition-colors"
                        >
                            🎲
                        </button>
                    </div>
                </div>
            </ControlSection>
        </div>
    );
};

export default SimulationControls;

