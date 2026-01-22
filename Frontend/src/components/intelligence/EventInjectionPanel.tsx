import React, { useState } from 'react';
import { AlertCircle, CloudRain, ShieldAlert, ZapOff } from 'lucide-react';
import { SimulationEvent } from '../../types/domain';

interface EventInjectionPanelProps {
    onEventTriggered: (event: SimulationEvent) => void;
    currentLap: number;
}

const EventInjectionPanel: React.FC<EventInjectionPanelProps> = ({ onEventTriggered, currentLap }) => {
    const [events, setEvents] = useState<SimulationEvent[]>([]);

    const addEvent = (type: SimulationEvent['type'], intensity: number = 1.0) => {
        const newEvent: SimulationEvent = {
            type,
            lap: currentLap + 1, // Trigger on next lap by default
            intensity
        };
        setEvents([...events, newEvent]);
        onEventTriggered(newEvent);
    };

    return (
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-3">
                <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-red-600" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Counterfactual Trigger</h3>
                </div>
                <span className="px-2 py-0.5 bg-red-600/10 text-red-600 text-[8px] font-mono border border-red-600/20 rounded uppercase">Phase 3 Active</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => addEvent("SC")}
                    className="flex flex-col items-center gap-2 p-3 bg-black/40 border border-[#1f1f26] hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group rounded"
                >
                    <AlertCircle size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Safety Car</span>
                </button>

                <button
                    onClick={() => addEvent("VSC")}
                    className="flex flex-col items-center gap-2 p-3 bg-black/40 border border-[#1f1f26] hover:border-amber-400/50 hover:bg-amber-400/5 transition-all group rounded"
                >
                    <ShieldAlert size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">VSC</span>
                </button>

                <button
                    onClick={() => addEvent("WEATHER", 0.6)}
                    className="flex flex-col items-center gap-2 p-3 bg-black/40 border border-[#1f1f26] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group rounded"
                >
                    <CloudRain size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Rain (0.6)</span>
                </button>

                <button
                    onClick={() => addEvent("FAILURE")}
                    className="flex flex-col items-center gap-2 p-3 bg-black/40 border border-[#1f1f26] hover:border-red-600/50 hover:bg-red-600/5 transition-all group rounded"
                >
                    <ZapOff size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Power Unit</span>
                </button>
            </div>

            {events.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#1f1f26] space-y-2">
                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-black mb-2">Active Injectors</p>
                    {events.map((e, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[9px] font-mono bg-black/60 p-2 border border-[#1f1f26] rounded">
                            <span className="text-red-600 font-black tracking-tighter">[{e.type}]</span>
                            <span className="text-white">LAP {e.lap}</span>
                            <button
                                onClick={() => setEvents(events.filter((_, i) => i !== idx))}
                                className="text-slate-600 hover:text-white"
                            >
                                [X]
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventInjectionPanel;
