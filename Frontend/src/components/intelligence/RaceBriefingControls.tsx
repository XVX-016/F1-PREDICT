import React from 'react';
import { SEASON_2026_SCHEDULE } from '../../data/season2026';

interface RaceBriefingControlsProps {
    selectedCircuit: string;
    onCircuitChange: (raceId: string) => void;
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
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-wrap gap-6 items-center">
            {/* Circuit Selector */}
            <div className="flex flex-col gap-1.5 min-w-[220px]">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Target Race</label>
                <select
                    value={selectedCircuit}
                    onChange={(e) => onCircuitChange(e.target.value)}
                    className="bg-black text-white text-sm border border-[#1f1f26] rounded px-3 py-2 outline-none focus:border-[#E10600] transition-colors appearance-none cursor-pointer w-full font-mono"
                >
                    {SEASON_2026_SCHEDULE.map(race => (
                        <option key={race.round} value={`${race.round}_2026`}>
                            {race.raceName.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {/* Session Type */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Session Type</label>
                <div className="flex gap-1 bg-black p-1 rounded border border-[#1f1f26]">
                    {(['RACE', 'SPRINT'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => onSessionChange(type)}
                            className={`px-4 py-1 text-[10px] font-bold rounded transition-all uppercase tracking-wider border ${selectedSession === type ? 'bg-[#E10600] border-[#E10600] text-white shadow-lg shadow-[#E10600]/20' : 'bg-black border-[#1f1f26] text-white hover:border-white/20'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Track Condition */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Track Condition</label>
                <div className="flex gap-1 bg-black p-1 rounded border border-[#1f1f26]">
                    {(['DRY', 'INTERMEDIATE', 'WET'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => onConditionChange(type)}
                            className={`px-3 py-1 text-[10px] font-bold rounded transition-all uppercase tracking-wider border ${selectedCondition === type ? 'bg-white text-black border-white' : 'bg-black border-[#1f1f26] text-white hover:border-white/20'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default RaceBriefingControls;
