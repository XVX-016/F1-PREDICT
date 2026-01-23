import React from 'react';

interface AssumptionItem {
    title: string;
    description: string;
    source?: string;
}

interface ModelAssumptionsAccordionProps {
    assumptions: AssumptionItem[];
}

/**
 * Model Assumptions Accordion - Critical for trust-building
 * Shows what the model assumes, making blind spots visible.
 */
export const ModelAssumptionsAccordion: React.FC<ModelAssumptionsAccordionProps> = ({ assumptions }) => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Model Assumptions</h3>
                <p className="text-xs text-[var(--text-caption)] mt-0.5">
                    Expand to understand what the model believes. This is how we earn trust.
                </p>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
                {assumptions.map((item, index) => (
                    <div key={index}>
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--bg-panel)] transition-colors"
                        >
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                {item.title}
                            </span>
                            <svg
                                className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openIndex === index && (
                            <div className="px-4 pb-4">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {item.description}
                                </p>
                                {item.source && (
                                    <p className="text-xs text-[var(--text-caption)] mt-2">
                                        Source: {item.source}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModelAssumptionsAccordion;
