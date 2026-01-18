type TyreDegradationProps = {
    healthPercent?: number
    currentLap?: number
    compound?: string
}

export function TyreDegradation({
    healthPercent,
    currentLap,
    compound
}: TyreDegradationProps) {
    const hasData = healthPercent !== undefined

    return (
        <div className="bg-[#121217] border border-[#1f1f26] p-4 space-y-3 h-full">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono font-black">
                Tyre Wear Analysis
            </h3>

            {hasData ? (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                            <span>Health</span>
                            <span className="text-white font-bold">{healthPercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${healthPercent > 60 ? 'bg-green-600' : healthPercent > 30 ? 'bg-amber-500' : 'bg-red-600'}`}
                                style={{ width: `${healthPercent}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                        <div>
                            <span className="text-slate-500 block uppercase tracking-tighter">Compound</span>
                            <span className="text-white font-bold">{compound || 'UNKNOWN'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block uppercase tracking-tighter">Stint Lap</span>
                            <span className="text-white font-bold">{currentLap || 0}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Analysis offline</p>
            )}
        </div>
    )
}
