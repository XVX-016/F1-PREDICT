import { useMemo } from 'react';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

export default function SafetyCarTimelineChart() {
    const simulationResult = useRaceStore(useShallow((s) => s.simulationResult));
    const currentLap = useRaceStore(useShallow((s) => s.currentLap));
    const simulationState = useRaceStore(useShallow((s) => s.simulationState));
    const setCursor = useRaceStore(useShallow((s) => s.setCursor));

    const timeline = useMemo(() => {
        if (!simulationResult) return [];
        const totalLaps = simulationResult.meta.totalLaps;
        const baseSet = new Set(simulationResult.baseline.safetyCarLaps || []);
        const cfSet = new Set(simulationResult.counterfactual?.safetyCarLaps || []);
        return Array.from({ length: totalLaps }, (_, i) => {
            const lap = i + 1;
            return {
                lap,
                baselineSC: baseSet.has(lap),
                counterfactualSC: cfSet.has(lap)
            };
        });
    }, [simulationResult]);

    if (simulationState === 'empty' || timeline.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                Run simulation to view safety car risk
            </div>
        );
    }

    const baselineCount = timeline.filter((t) => t.baselineSC).length;
    const counterfactualCount = timeline.filter((t) => t.counterfactualSC).length;
    const impactSummary =
        baselineCount === counterfactualCount
            ? 'Both strategies carry identical SC exposure.'
            : baselineCount > counterfactualCount
                ? 'Baseline is more exposed to safety-car disruptions.'
                : 'Counterfactual is more exposed to safety-car disruptions.';

    const renderRow = (label: string, accessor: (lap: typeof timeline[number]) => boolean, accent: string) => (
        <div className="grid grid-cols-[110px_1fr] gap-3 items-center">
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/50">{label}</div>
            <div className="grid auto-cols-fr grid-flow-col gap-1 min-w-[720px]">
                {timeline.map((lap) => {
                    const active = accessor(lap);
                    const isCurrent = lap.lap === currentLap;
                    return (
                        <button
                            key={`${label}-${lap.lap}`}
                            type="button"
                            onClick={() => setCursor(lap.lap)}
                            title={`Lap ${lap.lap} · ${active ? 'Safety Car' : 'Green Flag'}`}
                            className={`h-8 rounded-md border text-[9px] font-mono transition-all ${
                                active
                                    ? 'text-white shadow-[0_0_12px_rgba(225,6,0,0.25)]'
                                    : 'bg-[#0c0c0f] border-white/10 text-white/25 hover:border-white/25'
                            } ${isCurrent ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-black' : ''}`}
                            style={active ? { backgroundColor: accent, borderColor: accent } : undefined}
                        >
                            {lap.lap}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col">
            <div className="text-[10px] text-white/40 uppercase font-mono mb-2 flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#E10600]" /> Baseline
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00CED1]" /> Counterfactual
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white" /> Current Lap
                </span>
            </div>

            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden rounded border border-white/10 bg-black/20 px-3 py-4">
                <div className="space-y-4">
                    {renderRow('Baseline', (lap) => lap.baselineSC, '#E10600')}
                    {renderRow('Counterfactual', (lap) => lap.counterfactualSC, '#00CED1')}
                </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 text-[10px] text-white/40 font-mono uppercase flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <span>Current Lap: {currentLap}</span>
                    <span>Baseline SC Count: {baselineCount}</span>
                    <span>Counterfactual SC Count: {counterfactualCount}</span>
                </div>
                <span className="text-white/25 normal-case tracking-normal">{impactSummary}</span>
            </div>
        </div>
    );
}
