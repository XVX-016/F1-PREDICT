import React from 'react';

interface RaceContextHeaderProps {
    raceName: string;
    session: 'Pre-Race' | 'Live' | 'Post-Race';
    modelConfidence: number; // 0-5
    lastCalibrated: string;
}

/**
 * Race Context Header - Trust-building component
 * Shows race info and model reliability at a glance.
 */
export const RaceContextHeader: React.FC<RaceContextHeaderProps> = ({
    raceName,
    session,
    modelConfidence,
    lastCalibrated
}) => {
    const renderConfidenceBullets = () => {
        const filled = Math.min(5, Math.max(0, modelConfidence));
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full mr-1 ${i < filled ? 'bg-[var(--state-green)]' : 'bg-[var(--border-subtle)]'
                    }`}
            />
        ));
    };

    const getConfidenceLabel = () => {
        if (modelConfidence >= 4) return 'High';
        if (modelConfidence >= 2) return 'Medium';
        return 'Low';
    };

    return (
        <header className="bg-[var(--bg-card)] border-b border-[var(--border-subtle)] px-6 py-4 sticky top-0 z-10 shadow-[var(--shadow-card)]">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Race Info */}
                <div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                        {raceName}
                    </h1>
                    <div className="flex items-center gap-4 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${session === 'Live'
                                ? 'bg-[var(--accent-red)] text-white'
                                : 'bg-[var(--bg-panel)] text-[var(--text-secondary)]'
                            }`}>
                            {session}
                        </span>
                    </div>
                </div>

                {/* Model Confidence */}
                <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                            Model Confidence
                        </span>
                        <div className="flex items-center" title={`Confidence: ${getConfidenceLabel()}`}>
                            {renderConfidenceBullets()}
                        </div>
                        <span className={`text-xs font-medium ${modelConfidence >= 4 ? 'text-[var(--state-green)]' :
                                modelConfidence >= 2 ? 'text-[var(--state-amber)]' :
                                    'text-[var(--state-red)]'
                            }`}>
                            ({getConfidenceLabel()})
                        </span>
                    </div>
                    <p className="text-xs text-[var(--text-caption)] mt-1">
                        Last Calibration: {lastCalibrated}
                    </p>
                </div>
            </div>
        </header>
    );
};

export default RaceContextHeader;
