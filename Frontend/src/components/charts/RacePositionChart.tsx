import { Flag } from 'lucide-react';

export default function RacePositionChart() {
    // ... (rest of component code) ...

    // Gate: Empty State UI
    if (simulationState === "empty") {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                <div className="text-center flex flex-col items-center gap-2">
                    <Flag className="w-8 h-8 opacity-20" />
                    <div>Run simulation to view positions</div>
                </div>
            </div>
        );
    }
    // ...
}
