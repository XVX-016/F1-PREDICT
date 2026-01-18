import React, { useMemo } from 'react';
import ReplayPanel from '../replay/ReplayPanel';
import ReplayPaceChart from '../charts/ReplayPaceChart';
import StrategyFailurePanel from '../replay/StrategyFailurePanel';

// Assuming the trace follows the schema defined in the plan.
// We might need to adapt if the simulation engine output differs slightly, 
// but for the purpose of this task we assume alignment or fail gracefully.

interface RaceReplayProps {
    trace: any[]; // Typing as any[] for flexibility with incoming JSON
}

const RaceReplay: React.FC<RaceReplayProps> = ({ trace }) => {
    if (!trace || trace.length === 0) return null;

    // Extract basic meta
    const maxLap = trace.length;
    const raceId = "simulated_race"; // Placeholder or derived

    // State is managed by ReplayPanel's useReplay hook (via onLapChange callback ideally, 
    // but ReplayPanel uses useReplay internally. We need to lift state OR let ReplayPanel control it.
    // The ReplayPanel I wrote earlier uses useReplay internally. 
    // It has `onLapChange` prop.

    // So we need local state to track the 'current' lap to show the other charts.
    const [currentLap, setCurrentLap] = React.useState(1);

    // Memoize the current lap data for performance
    const currentLapData = useMemo(() => {
        // trace is 0-indexed presumably, or 1-based logic?
        // Usually trace[0] is lap 1.
        return trace[currentLap - 1];
    }, [trace, currentLap]);

    // Format failures for the panel
    // We assume the trace *might* contain failure annotations in a separate field or we extract them.
    // Or maybe the failure analysis runs on the backend and we get a separate `failures` array.
    // Let's assume for now we extract them from the trace if they exist on the lap, or pass empty.
    const failures = useMemo(() => {
        // Collect all failures from the trace
        const allFailures: any[] = [];
        trace.forEach(lap => {
            if (lap.failures) {
                allFailures.push(...lap.failures);
            }
            // Also check for decisions that are failures if using that schema
            if (lap.decision?.type === 'FAILURE') { // Example
                allFailures.push({
                    lap: lap.lap,
                    type: lap.decision.reason,
                    explanation: lap.decision.explanation
                });
            }
        });
        return allFailures;
    }, [trace]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-1 bg-[#E10600]"></div>
                <h2 className="text-lg font-black uppercase tracking-widest text-white">
                    Race Replay & Analysis
                </h2>
            </div>

            {/* Main Control Panel (Scrubber, Snapshot) */}
            <ReplayPanel
                raceId={raceId}
                maxLap={maxLap}
                onLapChange={setCurrentLap}
                currentLapData={currentLapData}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pace Chart */}
                <div className="lg:col-span-2">
                    <ReplayPaceChart
                        data={trace}
                        currentLap={currentLap}
                    />
                </div>

                {/* Failure Analysis */}
                <div className="lg:col-span-1">
                    <StrategyFailurePanel failures={failures} />
                </div>
            </div>
        </div>
    );
};

export default RaceReplay;
