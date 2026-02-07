import { useMemo } from 'react';
import { DriverState } from '../../utils/ReplayEngine';
import { BAHRAIN_MAIN_TRACK, BAHRAIN_PIT_TRACK } from '../../utils/trackSpline';

interface TrackMapProps {
    drivers: DriverState[];
    loading?: boolean;
}

export const TrackMap = ({ drivers, loading }: TrackMapProps) => {
    // Compute bounds from actual track data
    const bounds = useMemo(() => {
        const allPoints = [
            ...BAHRAIN_MAIN_TRACK.points,
            ...BAHRAIN_PIT_TRACK.points
        ];

        const xs = allPoints.map(p => p[0]);
        const ys = allPoints.map(p => p[1]);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = Math.max(width, height) * 0.1;

        return {
            minX: minX - padding,
            minY: minY - padding,
            width: width + padding * 2,
            height: height + padding * 2
        };
    }, []);

    const mainPath = useMemo(() => {
        return BAHRAIN_MAIN_TRACK.points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`
        ).join(' ') + ' Z';
    }, []);

    const pitPath = useMemo(() => {
        return BAHRAIN_PIT_TRACK.points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`
        ).join(' ');
    }, []);

    if (drivers.length === 0 && !loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 rounded-xl border border-white/5 relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="text-center z-10">
                    <div className="text-[10px] font-mono font-black text-[#E10600] uppercase tracking-[0.4em] mb-2 animate-pulse">
                        Awaiting Telemetry Stream
                    </div>
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                        Circuit: Bahrain International • Fixed 120Hz Base
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black/40 rounded-xl overflow-hidden border border-white/5 group">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

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
                {/* Circuit Outlines */}
                <path d={mainPath} fill="none" stroke="white" strokeWidth="6" strokeOpacity="0.05" />
                <path d={mainPath} fill="none" stroke="#E10600" strokeWidth="3" strokeOpacity="0.1" className="animate-pulse" />

                {/* Pit Lane Path */}
                <path d={pitPath} fill="none" stroke="white" strokeWidth="4" strokeDasharray="12 12" strokeOpacity="0.1" />

                {/* Drivers */}
                {drivers.map(d => (
                    <g key={d.id} transform={`translate(${d.x}, ${d.y})`}
                        className={`transition-transform duration-100 ease-linear ${d.inPit ? 'opacity-60 scale-75' : 'opacity-100'}`}>
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
