import { useMemo } from 'react';
import { DriverReplayState } from '../../adapters/ReplayAdapter';

interface TrackMapProps {
    drivers: DriverReplayState[];
    rotation?: number; // Circuit rotation if needed
}

export const TrackMap = ({ drivers }: TrackMapProps) => {
    // Determine bounds for scaling
    // In a real app, these would come from static circuit metadata.
    // For now, we auto-scale based on the drivers' current positions or fixed defaults for Suzuka
    // Suzuka approx bounds (based on FastF1 unit space)

    // We can also just iterate all drivers to find bounds dynamicallly (though this jitters)
    // Better: use fixed bounds known for Suzuka or normalize.
    // FastF1 usually returns X/Y in weird units (roughly 1 unit ~ 100m or so, depending on projection)
    // Let's implement a responsive SVG scaler.

    const bounds = useMemo(() => {
        if (drivers.length === 0) return { minX: -15000, maxX: 15000, minY: -15000, maxY: 15000 };
        const xs = drivers.map(d => d.x);
        const ys = drivers.map(d => d.y);
        return {
            minX: Math.min(...xs) - 1000,
            maxX: Math.max(...xs) + 1000,
            minY: Math.min(...ys) - 1000,
            maxY: Math.max(...ys) + 1000
        };
    }, [drivers]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    return (
        <div className="w-full h-full relative bg-black/40 rounded-xl overflow-hidden border border-white/5">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    Telemetry Trace
                </h3>
            </div>

            <svg
                viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
                className="w-full h-full rotate-90 opacity-80" // FastF1 usually needs rotation for screen
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Drivers */}
                {drivers.map(d => (
                    <g key={d.driverId} transform={`translate(${d.x}, ${d.y})`}>
                        <circle
                            r={300}
                            fill={d.driverId === 'VER' ? '#E10600' : '#FFFFFF'}
                            fillOpacity={0.8}
                        />
                        <text
                            y={-500}
                            textAnchor="middle"
                            fill="white"
                            fontSize={600}
                            fontFamily="monospace"
                            fontWeight="bold"
                        >
                            {d.driverId}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};
