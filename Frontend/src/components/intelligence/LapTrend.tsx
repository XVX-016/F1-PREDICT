type LapTrendProps = {
    meanDeltaMs?: number
    stdDevMs?: number
    trendSlopeMsPerLap?: number
}

export function LapTrend({
    meanDeltaMs,
    stdDevMs,
    trendSlopeMsPerLap
}: LapTrendProps) {
    const hasData =
        meanDeltaMs !== undefined &&
        stdDevMs !== undefined &&
        trendSlopeMsPerLap !== undefined

    return (
        <div className="bg-[#121217] border border-[#1f1f26] p-4 space-y-4 h-full">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono font-black">
                Lap Pace Trend
            </h3>

            {/* Chart Area */}
            <div className="h-[140px] flex items-center justify-center border border-[#1f1f26] bg-[#0b0b0e] text-slate-700 text-[10px] font-mono uppercase tracking-widest relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 flex items-center justify-around px-4">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                        <div key={i} className="w-4 bg-red-600" style={{ height: `${h}%` }} />
                    ))}
                </div>
                <span className="relative z-10">{hasData ? 'Optimal Pace Delta' : 'No lap data available'}</span>
            </div>

            {/* Stats */}
            {hasData && (
                <div className="grid grid-cols-3 gap-4 text-[10px]">
                    <Stat label="Mean Delta" value={`${meanDeltaMs.toFixed(1)} ms`} />
                    <Stat label="Std Deviation" value={`${stdDevMs.toFixed(1)} ms`} />
                    <Stat
                        label="Trend Slope"
                        value={`${trendSlopeMsPerLap > 0 ? '+' : ''}${trendSlopeMsPerLap.toFixed(2)} ms/lap`}
                    />
                </div>
            )}
        </div>
    )
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black leading-none">{label}</div>
            <div className="font-mono text-white font-bold text-xs">{value}</div>
        </div>
    )
}
