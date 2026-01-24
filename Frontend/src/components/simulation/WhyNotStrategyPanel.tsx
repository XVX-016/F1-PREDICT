import React from 'react';

interface WhyNotReason {
    type: 'risk' | 'assumption' | 'data';
    message: string;
}

interface WhyNotStrategyPanelProps {
    strategyName: string;
    reasons: WhyNotReason[];
    isOpen: boolean;
    onToggle: () => void;
}

/**
 * Why NOT Strategy Panel - Critical for preventing false confidence
 * Explains key conditions under which a strategy underperforms.
 */
export const WhyNotStrategyPanel: React.FC<WhyNotStrategyPanelProps> = ({
    strategyName,
    reasons,
    isOpen,
    onToggle
}) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'risk': return '⚠️';
            case 'assumption': return '📋';
            case 'data': return '📊';
            default: return '❌';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'risk': return 'text-[var(--state-red)]';
            case 'assumption': return 'text-[var(--state-amber)]';
            case 'data': return 'text-[var(--text-muted)]';
            default: return 'text-[var(--text-secondary)]';
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--bg-panel)] transition-colors"
            >
                <div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                        Why NOT: {strategyName}
                    </span>
                    <p className="text-xs text-[var(--text-caption)] mt-0.5">
                        Key conditions under which this strategy underperforms
                    </p>
                </div>
                <svg
                    className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="px-4 pb-4 border-t border-[var(--border-subtle)]">
                    <ul className="mt-3 space-y-2">
                        {reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-sm">{getIcon(reason.type)}</span>
                                <div>
                                    <span className={`text-xs font-medium uppercase ${getTypeColor(reason.type)}`}>
                                        {reason.type}
                                    </span>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {reason.message}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default WhyNotStrategyPanel;
