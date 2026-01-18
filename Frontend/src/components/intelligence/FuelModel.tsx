type FuelModelProps = {
    fuelRemainingKg?: number
    liftCoastDeltaMs?: number
    targetLapTimeSec?: number
}

export function FuelModel({
    fuelRemainingKg,
    liftCoastDeltaMs,
    targetLapTimeSec
}: FuelModelProps) {
    const hasData =
        fuelRemainingKg !== undefined &&
        liftCoastDeltaMs !== undefined &&
        targetLapTimeSec !== undefined

    return (
        <div className="bg-[#121217] border border-[#1f1f26] p-4 space-y-3 h-full">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono font-black">
                Fuel Model
            </h3>

            {hasData ? (
                <div className="space-y-2 text-[10px] font-mono">
                    <Line label="Fuel Remaining" value={`${fuelRemainingKg.toFixed(2)} kg`} />
                    <Line label="Lift & Coast Delta" value={`${liftCoastDeltaMs.toFixed(1)} ms`} />
                    <Line label="Target Lap Time" value={`${targetLapTimeSec.toFixed(2)} s`} />
                </div>
            ) : (
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Fuel data unavailable</p>
            )}
        </div>
    )
}

function Line({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-slate-500 uppercase tracking-tighter">{label}</span>
            <span className="text-white font-bold">{value}</span>
        </div>
    )
}
