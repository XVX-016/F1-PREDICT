type Gap = {
    driver: string
    gapMs: number
}

type LiveGapTickerProps = {
    gaps?: Gap[]
}

export function LiveGapTicker({ gaps }: LiveGapTickerProps) {
    return (
        <div className="bg-[#121217] border border-[#1f1f26] p-4 h-[180px] flex flex-col">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-mono font-black">
                Live Gap Ticker
            </h3>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 no-scrollbar">
                {gaps && gaps.length > 0 ? (
                    gaps.map((g, i) => (
                        <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-slate-400 font-bold">{g.driver}</span>
                            <span className="text-white font-black">
                                {g.gapMs > 0 ? '+' : ''}
                                {g.gapMs.toFixed(1)} ms
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-600 uppercase tracking-widest">No live gap data</p>
                )}
            </div>
        </div>
    )
}
