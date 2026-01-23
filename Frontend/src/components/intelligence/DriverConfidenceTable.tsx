import React from 'react';

interface DriverConfidence {
    id: string;
    name: string;
    chaosIndex: 'Low' | 'Medium' | 'High';
    restartSkill: 'Weak' | 'Average' | 'Strong' | 'Elite';
    wetBias: 'Negative' | 'Neutral' | 'Positive';
    errorVolatility: 'Low' | 'Medium' | 'High';
}

interface DriverConfidenceTableProps {
    drivers: DriverConfidence[];
}

/**
 * Driver Confidence Table - Analytical grid showing driver characteristics
 * Tooltips explain each metric for data honesty.
 */
export const DriverConfidenceTable: React.FC<DriverConfidenceTableProps> = ({ drivers }) => {
    const getSkillColor = (skill: string) => {
        switch (skill) {
            case 'Elite': return 'text-[var(--state-green)] font-bold';
            case 'Strong': return 'text-[var(--state-green)]';
            case 'High': return 'text-[var(--state-amber)] font-bold';
            case 'Positive': return 'text-[var(--state-green)]';
            case 'Negative': return 'text-[var(--state-red)]';
            case 'Weak': return 'text-[var(--state-red)] font-bold';
            default: return 'text-[var(--text-secondary)]';
        }
    };

    return (
        <div className="bg-[#15151e] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1E1E24]">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Driver Confidence Profiles</h3>
                <div className="flex gap-2">
                    <span className="text-[10px] uppercase text-white/40 font-mono">Live Telemetry</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-[#1E1E24] shadow-md">
                            <tr>
                                <th className="py-3 px-4 text-xs font-mono text-white/40 uppercase tracking-widest border-b border-white/5">Driver</th>
                                <th className="py-3 px-4 text-xs font-mono text-white/40 uppercase tracking-widest border-b border-white/5">Chaos Index</th>
                                <th className="py-3 px-4 text-xs font-mono text-white/40 uppercase tracking-widest border-b border-white/5">Restart Skill</th>
                                <th className="py-3 px-4 text-xs font-mono text-white/40 uppercase tracking-widest border-b border-white/5">Wet Bias</th>
                                <th className="py-3 px-4 text-xs font-mono text-white/40 uppercase tracking-widest border-b border-white/5">Error Volatility</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => (
                                <tr key={driver.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 text-sm font-bold text-white uppercase">{driver.name}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getSkillColor(driver.chaosIndex)}`}>
                                            {driver.chaosIndex}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getSkillColor(driver.restartSkill)}`}>
                                            {driver.restartSkill}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className={`text-xs font-medium ${getSkillColor(driver.wetBias)}`}>
                                            {driver.wetBias}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className={`text-xs font-medium ${getSkillColor(driver.errorVolatility)}`}>
                                            {driver.errorVolatility}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DriverConfidenceTable;
