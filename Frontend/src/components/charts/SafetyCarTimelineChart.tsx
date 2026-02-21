import { useMemo } from 'react';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

export default function SafetyCarTimelineChart() {
    const simulationResult = useRaceStore(useShallow((s) => s.simulationResult));
    const currentLap = useRaceStore(useShallow((s) => s.currentLap));
    const simulationState = useRaceStore(useShallow((s) => s.simulationState));

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

    const totalLaps = timeline.length || 1;
    const chartW = 1000;
    const chartH = 140;
    const pxPerLap = chartW / Math.max(totalLaps - 1, 1);
    const baseY = 36;
    const cfY = 104;

    const toPath = (isBaseline: boolean) => timeline.map((p, i) => {
        const x = i * pxPerLap;
        const y = isBaseline
            ? (p.baselineSC ? baseY - 20 : baseY)
            : (p.counterfactualSC ? cfY - 20 : cfY);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');

    if (simulationState === 'empty' || timeline.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                Run simulation to view safety car risk
            </div>
        );
    }

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

            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden rounded border border-white/10 bg-black/20">
                <div className="min-w-[720px] h-full px-3 py-2">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full">
                        <line x1="0" y1={baseY} x2={chartW} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <line x1="0" y1={cfY} x2={chartW} y2={cfY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                        <path d={toPath(true)} fill="none" stroke="#E10600" strokeWidth="2.5" />
                        <path d={toPath(false)} fill="none" stroke="#00CED1" strokeWidth="2.5" />

                        {timeline.map((p, i) => {
                            const x = i * pxPerLap;
                            const by = p.baselineSC ? baseY - 20 : baseY;
                            const cy = p.counterfactualSC ? cfY - 20 : cfY;
                            const isCurrent = p.lap === currentLap;
                            return (
                                <g key={`pt-${p.lap}`}>
                                    <circle cx={x} cy={by} r={isCurrent ? 4 : 2.5} fill={isCurrent ? '#fff' : '#E10600'} />
                                    <circle cx={x} cy={cy} r={isCurrent ? 4 : 2.5} fill={isCurrent ? '#fff' : '#00CED1'} />
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 text-[10px] text-white/40 font-mono uppercase flex items-center gap-4">
                <span>Current Lap: {currentLap}</span>
                <span>Baseline SC Count: {timeline.filter((t) => t.baselineSC).length}</span>
                <span>Counterfactual SC Count: {timeline.filter((t) => t.counterfactualSC).length}</span>
            </div>
        </div>
    );
}
