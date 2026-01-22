import React from 'react';

interface AuditAndStressPanelProps {
    stressLevel: number; // 0-30
    showAssumptions: boolean;
    onStressChange: (v: number) => void;
    onAssumptionsToggle: () => void;
    verdict: 'Robust' | 'Sensitive' | 'Unstable';
    flipCauses: string[];
}

/**
 * Audit and Stress Test Panel - The "anti-bullshit switch"
 * Tests how wrong the model could be and shows assumptions.
 */
export const AuditAndStressPanel: React.FC<AuditAndStressPanelProps> = ({
    stressLevel,
    showAssumptions,
    onStressChange,
    onAssumptionsToggle,
    verdict,
    flipCauses
}) => {
    const getVerdictColor = () => {
        switch (verdict) {
            case 'Robust': return 'bg-[var(--state-green-bg)] text-[var(--state-green)] border-[var(--state-green)]';
            case 'Sensitive': return 'bg-[var(--state-amber-bg)] text-[var(--state-amber)] border-[var(--state-amber)]';
            case 'Unstable': return 'bg-[var(--state-red-bg)] text-[var(--state-red)] border-[var(--state-red)]';
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                Audit & Stress Test
            </h3>

            {/* Stress Test Slider */}
            <div className="mb-5">
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                        Model Error Stress
                    </label>
                    <span className="text-xs text-[var(--text-muted)]">{stressLevel}%</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={30}
                    value={stressLevel}
                    onChange={(e) => onStressChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-red)]"
                />
                <p className="text-xs text-[var(--text-caption)] mt-1">
                    Artificially increases model error to test robustness.
                </p>
            </div>

            {/* Verdict */}
            <div className="mb-4">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Verdict</span>
                <div className={`mt-1 px-3 py-2 rounded border text-sm font-semibold ${getVerdictColor()}`}>
                    {verdict}
                </div>
            </div>

            {/* Flip Causes */}
            {flipCauses.length > 0 && (
                <div className="mb-4">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Strategy Flips Under:</span>
                    <ul className="mt-1 space-y-1">
                        {flipCauses.map((cause, i) => (
                            <li key={i} className="text-xs text-[var(--state-red)] flex items-center gap-1">
                                <span>❌</span> {cause}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Assumptions Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <div>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                        Public Audit Mode
                    </span>
                    <p className="text-xs text-[var(--text-caption)]">
                        Display all assumptions and blind spots
                    </p>
                </div>
                <button
                    onClick={onAssumptionsToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showAssumptions ? 'bg-[var(--accent-red)]' : 'bg-[var(--border-strong)]'
                        }`}
                >
                    <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${showAssumptions ? 'translate-x-4' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );
};

export default AuditAndStressPanel;
