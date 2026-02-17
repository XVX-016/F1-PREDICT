import { useMemo } from 'react';
import { DriverState } from '../../utils/ReplayEngine';

interface TrackMapProps {
    drivers: DriverState[];
    loading?: boolean;
    circuitImage?: string;
    circuitLabel?: string;
}

export const TrackMap = ({ drivers, loading, circuitImage, circuitLabel }: TrackMapProps) => {
    const bounds = useMemo(() => {
        if (!drivers.length) {
            return { minX: -100, minY: -100, width: 200, height: 200 };
        }

        const xs = drivers.map((d) => d.x);
        const ys = drivers.map((d) => d.y);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = maxX - minX || 1;
        const height = maxY - minY || 1;
        const maxDim = Math.max(width, height);
        const padding = maxDim * 0.2;

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const finalWidth = maxDim + padding * 2;
        const finalHeight = maxDim + padding * 2;

        return {
            minX: centerX - finalWidth / 2,
            minY: centerY - finalHeight / 2,
            width: finalWidth,
            height: finalHeight
        };
    }, [drivers]);

    if (drivers.length === 0 && !loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 rounded-xl border border-white/5 relative">
                {circuitImage && (
                    <img
                        src={circuitImage}
                        alt={circuitLabel || 'Circuit outline'}
                        className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none"
                    />
                )}

                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="text-center z-10">
                    <div className="text-[10px] font-mono font-black text-[#E10600] uppercase tracking-[0.4em] mb-2 animate-pulse">
                        Awaiting Telemetry Stream
                    </div>
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                        Circuit: {circuitLabel || 'Unknown'} | Live Replay Feed
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black/40 rounded-xl overflow-hidden border border-white/5 group">
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {circuitImage && (
                <img
                    src={circuitImage}
                    alt={circuitLabel || 'Circuit outline'}
                    className="absolute inset-0 w-full h-full object-contain opacity-20 pointer-events-none"
                />
            )}

            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse" />
                    Live Telemetry Trace
                </h3>
            </div>

            <svg
                viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
                className="w-full h-full opacity-90 transition-opacity"
                preserveAspectRatio="xMidYMid meet"
            >
                {drivers.map((d) => (
                    <g
                        key={d.id}
                        transform={`translate(${d.x}, ${d.y})`}
                        className={`transition-transform duration-100 ease-linear ${d.inPit ? 'opacity-60 scale-75' : 'opacity-100'}`}
                    >
                        <circle
                            r={d.inPit ? 18 : 24}
                            fill={d.teamColor || '#FFFFFF'}
                            className={`${!d.inPit ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`}
                        />
                        <text
                            y={-40}
                            textAnchor="middle"
                            fill="white"
                            fontSize={36}
                            fontFamily="monospace"
                            fontWeight="bold"
                            className={`uppercase tracking-tighter ${d.inPit ? 'fill-white/40' : ''}`}
                        >
                            {d.id}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};
