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

    if (simulationState === 'empty' || timeline.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                Run simulation to view safety car risk
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-1 grid grid-cols-1 gap-4">
                <div>
                    <div className="text-[10px] text-white/40 uppercase font-mono mb-2">Baseline SC Laps</div>
                    <div className="grid grid-cols-12 sm:grid-cols-16 md:grid-cols-20 gap-1">
                        {timeline.map((p) => (
                            <div
                                key={`b-${p.lap}`}
                                className={`h-4 rounded-sm border ${p.baselineSC ? 'bg-[#E10600] border-[#E10600]' : 'bg-white/5 border-white/10'} ${p.lap === currentLap ? 'ring-1 ring-white' : ''}`}
                                title={`Lap ${p.lap}: ${p.baselineSC ? 'SC' : 'GREEN'}`}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-[10px] text-white/40 uppercase font-mono mb-2">Counterfactual SC Laps</div>
                    <div className="grid grid-cols-12 sm:grid-cols-16 md:grid-cols-20 gap-1">
                        {timeline.map((p) => (
                            <div
                                key={`c-${p.lap}`}
                                className={`h-4 rounded-sm border ${p.counterfactualSC ? 'bg-[#00CED1] border-[#00CED1]' : 'bg-white/5 border-white/10'} ${p.lap === currentLap ? 'ring-1 ring-white' : ''}`}
                                title={`Lap ${p.lap}: ${p.counterfactualSC ? 'SC' : 'GREEN'}`}
                            />
                        ))}
                    </div>
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
