import { LapFrame, DataSource, SimulationResponse } from '../../types/domain';

type LapTrendProps = {
    frames: LapFrame[];
    mode: DataSource;
    counterfactual?: SimulationResponse | null;
}

export function LapTrend({
    frames,
    mode,
    counterfactual,
}: LapTrendProps) {
    const sortedFrames = [...frames].sort((a, b) => (a.lap_time_ms || 0) - (b.lap_time_ms || 0));
    const hasData = frames.length > 0;

    // Extract What-If data for VER if active
    const verWhatIf = counterfactual?.pace_distributions?.["VER"];

    return (
        <div className="bg-[#121217] border border-[#1f1f26] p-6 space-y-6 h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono font-black">
                        Lap Pace Distribution
                    </h3>
                    {counterfactual && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-mono border border-amber-500/20 rounded-full animate-pulse uppercase font-black">
                            What-If Active
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-red-600/10 border border-red-600/20">
                        <span className="text-[8px] font-mono font-bold text-red-600 uppercase">{mode} Mode</span>
                    </div>
                </div>
            </div>

            {/* Simple Inline Distribution Chart */}
            <div className="flex-1 flex items-end gap-1 px-2 border-b border-[#1f1f26] pb-2 min-h-[140px] relative">
                {hasData ? (
                    sortedFrames.map((f, i) => {
                        const time = f.lap_time_ms || 0;
                        const minTime = sortedFrames[0].lap_time_ms || 1;
                        const maxTime = sortedFrames[sortedFrames.length - 1].lap_time_ms || 1.1;
                        const height = 100 - ((time - minTime) / (maxTime - minTime || 1) * 60);
                        const isVer = f.driver_id === "VER";

                        return (
                            <div key={f.driver_id + i} className="flex-1 group relative">
                                <div
                                    className={`w-full transition-all rounded-t-sm ${isVer ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-red-600/40 hover:bg-red-600/60'}`}
                                    style={{ height: `${height}%` }}
                                ></div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#121217] border border-[#1f1f26] p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                                    <p className="text-[8px] font-mono font-black text-white">{f.driver_id}</p>
                                    <p className="text-[9px] font-mono text-slate-400">{(time / 1000).toFixed(3)}s</p>
                                </div>
                                <div className={`mt-2 text-[8px] font-mono text-center uppercase rotate-45 ${isVer ? 'text-white font-black' : 'text-slate-600'}`}>{f.driver_id}</div>
                            </div>
                        );
                    })
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest animate-pulse">Waiting for telemetry frames...</p>
                    </div>
                )}

                {/* Counterfactual Overlay for VER */}
                {verWhatIf && hasData && (
                    <div className="absolute inset-0 pointer-events-none border-l-2 border-amber-500/30 border-dashed ml-[10%] opacity-60">
                        {/* This is a simplified visual representation of the predicted band */}
                        <div className="absolute bottom-[20%] right-0 left-0 h-12 bg-amber-500/10 border-y border-amber-500/30">
                            <span className="absolute left-2 top-0 text-[7px] font-mono text-amber-500 uppercase tracking-widest font-black">
                                Predicted Outcome Band (What-If)
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#1f1f26]">
                <Stat label="Median" value={hasData ? `${((sortedFrames[Math.floor(sortedFrames.length / 2)].lap_time_ms || 0) / 1000).toFixed(3)}s` : '--'} />
                <Stat label="Spread" value={hasData ? `${(((sortedFrames[sortedFrames.length - 1].lap_time_ms || 0) - (sortedFrames[0].lap_time_ms || 0))).toFixed(1)}ms` : '--'} />
                <Stat label="Sim Robust" value={counterfactual ? `${(counterfactual.robustness_score["VER"] * 100).toFixed(2)}%` : '--'} />
                <Stat label="Confidence" value={mode === "SIMULATION" ? "88.4%" : "100.0%"} />
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black leading-none">{label}</div>
            <div className="font-mono text-white font-bold text-xs">{value}</div>
        </div>
    );
}
