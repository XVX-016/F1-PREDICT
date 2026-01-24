import { LapFrame } from '../../types/domain';

type LiveGapTickerProps = {
    frames: LapFrame[]
}

export function LiveGapTicker({ frames }: LiveGapTickerProps) {
    // Sort by position if available, else by lap time
    const sortedFrames = [...frames].sort((a, b) => {
        if (a.position !== null && b.position !== null) return a.position - b.position;
        return (a.lap_time_ms || 0) - (b.lap_time_ms || 0);
    });

    const leaderTime = sortedFrames[0]?.lap_time_ms || 0;

    return (
        <div className="bg-[#121217] border border-[#1f1f26] p-4 h-[220px] flex flex-col">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-4 font-mono font-black border-b border-[#1f1f26] pb-2">
                Live Gap Analysis
            </h3>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 no-scrollbar">
                {sortedFrames.length > 0 ? (
                    sortedFrames.map((f, i) => {
                        const gap = i === 0 ? 0 : (f.lap_time_ms || 0) - leaderTime;
                        return (
                            <div key={f.driver_id + i} className="flex justify-between items-center bg-black/20 p-2 rounded-sm border-l-2 border-red-600/30">
                                <span className="text-white font-black">{f.driver_id}</span>
                                <div className="text-right">
                                    <span className={`font-bold ${i === 0 ? 'text-green-500' : 'text-slate-400'}`}>
                                        {i === 0 ? 'INTERVAL' : `+${(gap / 1000).toFixed(3)}s`}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-slate-700 uppercase tracking-widest text-center animate-pulse">Syncing Telemetry...</p>
                    </div>
                )}
            </div>
        </div>
    )
}
