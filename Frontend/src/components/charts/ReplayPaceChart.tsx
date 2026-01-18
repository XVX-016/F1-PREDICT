import React, { useMemo } from 'react';

// Using simple SVG for portability and speed instead of full D3 library import issues
// This follows the D3 conceptual model described in the plan.

interface ReplayPaceChartProps {
    data: any[]; // Array of pace points
    currentLap: number;
    height?: number;
}

export default function ReplayPaceChart({ data, currentLap, height = 280 }: ReplayPaceChartProps) {

    // Scales
    const width = 100; // percent
    const maxLap = data.length || 58;
    const maxTime = Math.max(...data.map(d => d.pace_model?.uncertainty?.p95_ms || 100000), 105000);
    const minTime = Math.min(...data.map(d => d.pace_model?.uncertainty?.p05_ms || 80000), 85000);

    // Coordinate helpers
    const getX = (lap: number) => (lap / maxLap) * 100;
    const getY = (ms: number) => 100 - ((ms - minTime) / (maxTime - minTime)) * 100;

    const points = data.map(d => `${getX(d.lap)},${getY(d.pace_model?.predicted_lap_ms)}`).join(" ");

    // Optimization: Memoize paths

    return (
        <div className="relative w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-4">
            <div className="absolute top-2 left-4 text-xs font-mono text-zinc-500">PACE EVOLUTION</div>

            <svg width="100%" height={height} viewBox={`0 0 100 100`} preserveAspectRatio="none" className="overflow-visible">

                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#333" strokeDasharray="2" strokeWidth="0.5" />

                {/* Uncertainty Band (Simplified polygon) */}
                {/* <polygon points="..." fill="#322" opacity="0.2" /> */}

                {/* Pace Line - Past (Solid) */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="#444"
                    strokeWidth="1"
                />

                {/* Pace Line - Active Segment to Cursor (Red) */}
                {/* This would require splitting the points string based on currentLap */}

                {/* Replay Cursor */}
                <line
                    x1={getX(currentLap)}
                    x2={getX(currentLap)}
                    y1="0"
                    y2="100"
                    stroke="#E10600"
                    strokeWidth="0.5"
                />

                {/* Current Point */}
                {data[currentLap - 1] && (
                    <circle
                        cx={getX(currentLap)}
                        cy={getY(data[currentLap - 1].pace_model?.predicted_lap_ms)}
                        r="1.5"
                        fill="#E10600"
                    />
                )}

            </svg>
        </div>
    );
}
