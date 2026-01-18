import React from "react";

interface Failure {
    lap: number;
    type: string;
    explanation: string;
    severity?: string;
}

interface StrategyFailurePanelProps {
    failures: Failure[];
}

export default function StrategyFailurePanel({ failures }: StrategyFailurePanelProps) {
    if (!failures || failures.length === 0) {
        return (
            <div className="p-4 rounded-lg bg-green-950/20 border border-green-900/50 text-green-400 text-sm flex items-center gap-2">
                <span className="text-lg">✓</span> No structural strategy failures detected.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Analysis Findings</h3>
            {failures.map((f, i) => (
                <div key={i} className="bg-red-950/20 border border-red-900/50 p-3 rounded-lg flex gap-3">
                    <div className="text-red-500 font-mono text-xs pt-1">
                        L{f.lap}
                    </div>
                    <div>
                        <div className="text-red-400 font-semibold text-sm">
                            {f.type.replace(/_/g, " ")}
                        </div>
                        <div className="text-zinc-400 text-xs mt-1">
                            {f.explanation}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
