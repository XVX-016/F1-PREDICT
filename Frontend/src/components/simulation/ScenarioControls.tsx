import React from 'react';

interface ScenarioControlsProps {
    weather: 'Dry' | 'Damp' | 'Wet';
    scRiskBias: number; // 0-100
    chaosLevel: number; // 0-100
    onWeatherChange: (w: 'Dry' | 'Damp' | 'Wet') => void;
    onSCRiskChange: (v: number) => void;
    onChaosChange: (v: number) => void;
}

/**
 * Scenario Controls - Left panel of Simulation page
 * Controls race conditions with clear explanations.
 */
export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
    weather,
    scRiskBias,
    chaosLevel,
    onWeatherChange,
    onSCRiskChange,
    onChaosChange
}) => {
    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Scenario Controls</h3>

            {/* Weather */}
            <div className="mb-5">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                    Weather Condition
                </label>
                <div className="flex gap-2">
                    {(['Dry', 'Damp', 'Wet'] as const).map((w) => (
                        <button
                            key={w}
                            onClick={() => onWeatherChange(w)}
                            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${weather === w
                                    ? 'bg-[var(--accent-red)] text-white border-[var(--accent-red)]'
                                    : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                                }`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
            </div>

            {/* SC Risk Bias */}
            <div className="mb-5">
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                        SC Risk Bias
                    </label>
                    <span className="text-xs text-[var(--text-muted)]">{scRiskBias}%</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={scRiskBias}
                    onChange={(e) => onSCRiskChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-red)]"
                />
                <p className="text-xs text-[var(--text-caption)] mt-1">
                    Scales baseline Safety Car probability. Higher = more disruptions.
                </p>
            </div>

            {/* Chaos Level */}
            <div className="mb-5">
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                        Race Chaos Level
                    </label>
                    <span className="text-xs text-[var(--text-muted)]">{chaosLevel}%</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={chaosLevel}
                    onChange={(e) => onChaosChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-red)]"
                />
                <p className="text-xs text-[var(--text-caption)] mt-1">
                    Controls stochastic variance. Does not change baseline pace.
                </p>
            </div>
        </div>
    );
};

export default ScenarioControls;
