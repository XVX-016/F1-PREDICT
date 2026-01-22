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
            case 'Elite': return 'text-[var(--state-green)] bg-[var(--state-green-bg)]';
            case 'Strong': return 'text-[var(--state-green)]';
            case 'High': return 'text-[var(--state-amber)] bg-[var(--state-amber-bg)]';
            case 'Positive': return 'text-[var(--state-green)]';
            case 'Negative': return 'text-[var(--state-red)]';
            case 'Weak': return 'text-[var(--state-red)] bg-[var(--state-red-bg)]';
            default: return 'text-[var(--text-secondary)]';
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Driver Confidence Profiles</h3>
                <p className="text-xs text-[var(--text-caption)] mt-0.5">
                    Derived from historical restarts, incidents, and per-condition performance
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[var(--bg-panel)] text-left">
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">Driver</th>
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]" title="Performance variance under SC/VSC/mixed strategies">
                                Chaos Index
                            </th>
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]" title="Fitted from historical SC restart performance">
                                Restart Skill
                            </th>
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]" title="Performance delta in wet conditions vs dry">
                                Wet Bias
                            </th>
                            <th className="px-4 py-2 font-medium text-[var(--text-secondary)]" title="Frequency of unforced errors">
                                Error Volatility
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map((driver, i) => (
                            <tr
                                key={driver.id}
                                className={`border-t border-[var(--border-subtle)] ${i % 2 === 0 ? '' : 'bg-[var(--bg-panel)]/50'}`}
                            >
                                <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                                    {driver.name}
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getSkillColor(driver.chaosIndex)}`}>
                                        {driver.chaosIndex}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getSkillColor(driver.restartSkill)}`}>
                                        {driver.restartSkill}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className={`text-xs font-medium ${getSkillColor(driver.wetBias)}`}>
                                        {driver.wetBias}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
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
    );
};

export default DriverConfidenceTable;
