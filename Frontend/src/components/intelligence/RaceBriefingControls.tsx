import React from 'react';
import { SEASON_2026_SCHEDULE } from '../../data/season2026';

interface RaceBriefingControlsProps {
    selectedCircuit: string;
    onCircuitChange: (id: string) => void;
    selectedSession: 'RACE' | 'SPRINT';
    onSessionChange: (session: 'RACE' | 'SPRINT') => void;
    selectedCondition: 'DRY' | 'INTERMEDIATE' | 'WET';
    onConditionChange: (condition: 'DRY' | 'INTERMEDIATE' | 'WET') => void;
}

/**
 * Race Briefing Controls
 * Global selectors for the Intelligence Page to set the context of priors and models.
 */
export const RaceBriefingControls: React.FC<RaceBriefingControlsProps> = ({
    selectedCircuit,
    onCircuitChange,
    selectedSession,
    onSessionChange,
    selectedCondition,
    onConditionChange
}) => {
    return (
        <div className="bg-[#15151e] border border-white/10 rounded-xl p-4 flex flex-wrap gap-6 items-center">
            {/* Circuit Selector */}
            <div className="flex flex-col gap-1.5 min-w-[220px]">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Target Circuit</label>
                <select
                    value={selectedCircuit}
                    onChange={(e) => onCircuitChange(e.target.value)}
                    className="bg-[#1e1e24] text-white text-sm border border-white/10 rounded px-3 py-2 outline-none focus:border-[#E10600] transition-colors appearance-none cursor-pointer w-full font-mono"
                >
                    {SEASON_2026_SCHEDULE.map(race => (
                        <option key={race.round} value={race.raceName}>
                            {race.raceName.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {/* Session Type */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Session Type</label>
                <div className="flex gap-1 bg-[#1e1e24] p-1 rounded border border-white/10">
                    {(['RACE', 'SPRINT'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => onSessionChange(type)}
                            className={`px-4 py-1 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${selectedSession === type ? 'bg-[#E10600] text-white shadow-lg shadow-[#E10600]/20' : 'text-white/40 hover:text-white'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Track Condition */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Track Condition</label>
                <div className="flex gap-1 bg-[#1e1e24] p-1 rounded border border-white/10">
                    {(['DRY', 'INTERMEDIATE', 'WET'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => onConditionChange(type)}
                            className={`px-3 py-1 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${selectedCondition === type ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:text-white'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="ml-auto text-right md:block hidden">
                <div className="flex items-center gap-2 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse"></span>
                    <div className="text-[10px] text-[#4ade80] font-mono uppercase tracking-[0.1em]">Simulation Ready</div>
                </div>
                <div className="text-[9px] text-white/20 font-mono mt-0.5">PRIORS SYNCED TO 2026 REGS</div>
            </div>
        </div>
    );
};

export default RaceBriefingControls;
