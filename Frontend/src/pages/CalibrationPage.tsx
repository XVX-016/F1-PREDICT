import React, { useState, useMemo } from 'react';
import { BAHRAIN_MAIN_TRACK, positionFromProgress } from '../utils/trackSpline';

const CalibrationPage = () => {
    const [progress, setProgress] = useState(0);
    const [sectorSplits, setSectorSplits] = useState<number[]>([]);
    const [pitEntry, setPitEntry] = useState<number | null>(null);
    const [pitExit, setPitExit] = useState<number | null>(null);

    const SCALE = 1000;
    const track = BAHRAIN_MAIN_TRACK;

    const mainPath = useMemo(() => {
        return track.points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p[0] * SCALE} ${p[1] * SCALE}`
        ).join(' ') + ' Z';
    }, [track]);

    const activePoint = useMemo(() => positionFromProgress(track, progress), [track, progress]);

    const handleTrackClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());

        // Snap to nearest point
        let minDist = Infinity;
        let bestIdx = 0;
        track.points.forEach((p, i) => {
            const d = Math.hypot(p[0] * SCALE - cursor.x, p[1] * SCALE - cursor.y);
            if (d < minDist) {
                minDist = d;
                bestIdx = i;
            }
        });

        setProgress(bestIdx / (track.points.length - 1));
    };

    const copyToClipboard = () => {
        const data = {
            sectors: sectorSplits.sort((a, b) => a - b),
            pit: { entry: pitEntry, exit: pitExit }
        };
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        alert('Calibration data copied to clipboard!');
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <div className="max-w-6xl mx-auto flex gap-8">
                {/* Visualizer */}
                <div className="flex-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10">
                        <h1 className="text-sm font-black text-[#E10600] tracking-widest uppercase">
                            Spline Calibration Tool V1
                        </h1>
                        <p className="text-[10px] text-white/40 mt-1 uppercase">
                            Circuit: {track.trackId} • Length: {track.totalLength.toFixed(2)}m
                        </p>
                    </div>

                    <svg
                        viewBox={`-50 -50 ${SCALE + 100} ${SCALE + 100}`}
                        className="w-full h-[600px] cursor-crosshair"
                        onClick={handleTrackClick}
                    >
                        {/* Track Outline */}
                        <path d={mainPath} fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.05" />
                        <path d={mainPath} fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />

                        {/* Active Marker */}
                        <g transform={`translate(${activePoint.x * SCALE}, ${activePoint.y * SCALE})`}>
                            <circle r={10} fill="none" stroke="#E10600" strokeWidth="2" className="animate-pulse" />
                            <circle r={3} fill="#E10600" />
                        </g>

                        {/* Saved Markers */}
                        {sectorSplits.map((p, i) => {
                            const pt = positionFromProgress(track, p);
                            return <circle key={`s-${i}`} cx={pt.x * SCALE} cy={pt.y * SCALE} r={5} fill="#22c55e" />;
                        })}
                        {pitEntry !== null && (
                            <circle cx={positionFromProgress(track, pitEntry).x * SCALE}
                                cy={positionFromProgress(track, pitEntry).y * SCALE} r={5} fill="#f59e0b" />
                        )}
                        {pitExit !== null && (
                            <circle cx={positionFromProgress(track, pitExit).x * SCALE}
                                cy={positionFromProgress(track, pitExit).y * SCALE} r={5} fill="#3b82f6" />
                        )}
                    </svg>

                    <div className="p-4 bg-black/60 border-t border-white/5 space-y-4">
                        <div className="flex justify-between text-[10px] text-white/60 mb-1">
                            <span>PROGRESS: {progress.toFixed(6)}</span>
                            <span>DISTANCE: {(progress * track.totalLength).toFixed(2)}m</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.0001}
                            value={progress}
                            onChange={(e) => setProgress(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E10600]"
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="w-80 space-y-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-2">
                        <h2 className="text-[10px] font-black uppercase text-white/40 mb-4 tracking-tighter">Actions</h2>
                        <button onClick={() => setSectorSplits([...sectorSplits, progress])}
                            className="w-full py-2 bg-white/5 hover:bg-green-500/20 border border-white/10 rounded text-[10px] uppercase font-bold transition-colors">
                            Mark Sector Split
                        </button>
                        <button onClick={() => setPitEntry(progress)}
                            className="w-full py-2 bg-white/5 hover:bg-amber-500/20 border border-white/10 rounded text-[10px] uppercase font-bold transition-colors">
                            Mark Pit Entry
                        </button>
                        <button onClick={() => setPitExit(progress)}
                            className="w-full py-2 bg-white/5 hover:bg-blue-500/20 border border-white/10 rounded text-[10px] uppercase font-bold transition-colors">
                            Mark Pit Exit
                        </button>
                        <div className="h-4" />
                        <button onClick={copyToClipboard}
                            className="w-full py-2 bg-[#E10600]/20 hover:bg-[#E10600] border border-[#E10600]/40 rounded text-[10px] uppercase font-bold transition-all">
                            Export JSON
                        </button>
                        <button onClick={() => {
                            setSectorSplits([]);
                            setPitEntry(null);
                            setPitExit(null);
                        }}
                            className="w-full py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 rounded text-[10px] uppercase text-red-500 font-bold transition-colors">
                            Clear Data
                        </button>
                    </div>

                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-[9px] font-mono whitespace-pre text-white/40 overflow-auto max-h-[300px]">
                        {JSON.stringify({
                            sectors: sectorSplits,
                            pit: { entry: pitEntry, exit: pitExit }
                        }, null, 2)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalibrationPage;
