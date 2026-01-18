type TelemetryFlagsProps = {
    clearAir?: boolean
    undercutRisk?: boolean
    trafficAhead?: boolean
}

export function TelemetryFlags({
    clearAir,
    undercutRisk,
    trafficAhead
}: TelemetryFlagsProps) {
    const flags = [
        { label: 'Clear Air', value: clearAir },
        { label: 'Undercut Risk', value: undercutRisk, danger: true },
        { label: 'Traffic Ahead', value: trafficAhead }
    ]

    return (
        <div className="bg-[#121217] border border-[#1f1f26] p-4 space-y-3 h-full">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono font-black">
                Telemetry Flags
            </h3>

            <div className="space-y-2.5 text-[10px] font-mono font-bold">
                {flags.map((f) => (
                    <div key={f.label} className="flex justify-between items-center border-b border-white/5 pb-1.5 last:border-0">
                        <span className="text-slate-500 uppercase tracking-tighter">{f.label}</span>
                        <span
                            className={`px-2 py-0.5 rounded-sm uppercase tracking-wider ${f.value === undefined
                                    ? 'bg-slate-800/50 text-slate-600'
                                    : f.value
                                        ? f.danger
                                            ? 'bg-red-900/20 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                                            : 'bg-green-900/20 text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.2)]'
                                        : 'bg-slate-800 text-slate-500'
                                }`}
                        >
                            {f.value === undefined ? 'N/A' : f.value ? 'YES' : 'NO'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
