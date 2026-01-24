import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BaselineOrderItem, DataEnvelope } from '../../types/intelligence';

interface BaselineRaceOrderChartProps {
    envelope: DataEnvelope<BaselineOrderItem[]>;
}

/**
 * Baseline Race Order Chart
 * Shows expected green-flag race order with uncertainty bands and full grid support.
 */
export const BaselineRaceOrderChart: React.FC<BaselineRaceOrderChartProps> = ({ envelope }) => {
    const { data, validity, source, reason } = envelope;

    if (validity === 'UNAVAILABLE') {
        return (
            <div className="h-[500px] bg-black/30 rounded-xl flex flex-col items-center justify-center border border-white/5 border-dashed p-8 text-center">
                <span className="text-sm text-white/60 font-mono mb-2 font-bold uppercase tracking-widest">
                    Baseline Order Unavailable
                </span>
                <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] max-w-[250px]">
                    {reason || "Insufficient historical data to form a defensible pace baseline for this circuit."}
                </span>
            </div>
        );
    }

    // Sort by delta ascending (leader has 0.0), but handle nulls by placing them at the bottom
    const sortedData = [...data].sort((a, b) => {
        if (a.delta === null) return 1;
        if (b.delta === null) return -1;
        return a.delta - b.delta;
    });

    const maxDeltaForDomain = Math.max(
        ...data.map(d => d.delta || 0),
        0.8 // hollow bar baseline
    );

    const getBarColor = (delta: number | null) => {
        if (delta === null) return 'none';

        // Linear scale for color: Cool Gray (#4A5568) to Warm Red (#E53E3E)
        // Adjust normalization target based on actual max delta or a reasonable upper bound
        const normMax = Math.max(maxDeltaForDomain, 1.2);
        const t = Math.min(delta / normMax, 1);

        const r = Math.round(74 + (229 - 74) * t);
        const g = Math.round(85 + (62 - 85) * t);
        const b = Math.round(104 + (62 - 104) * t);

        return `rgb(${r}, ${g}, ${b})`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload as BaselineOrderItem;
            return (
                <div className="bg-[#1e1e24] border border-white/10 rounded p-3 shadow-2xl">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <p className="text-sm font-bold text-white uppercase">{d.driverId}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${d.status === 'ESTIMATED' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-white/5 text-white/30'}`}>
                            {d.status}
                        </span>
                    </div>

                    <div className="flex justify-between gap-4 items-center">
                        <span className="text-[10px] text-white/40 uppercase">Confidence</span>
                        <span className={`text-[10px] font-bold ${d.confidence === 'HIGH' ? 'text-[#4ade80]' : d.confidence === 'MEDIUM' ? 'text-[#ffb347]' : 'text-[#ff4e4e]'}`}>
                            {d.confidence}
                        </span>
                    </div>

                    {d.delta !== null ? (
                        <>
                            <div className="flex justify-between gap-4 items-center mt-1">
                                <span className="text-[10px] text-white/40 uppercase">Δ vs Leader</span>
                                <span className="text-[10px] font-mono text-white">+{d.delta.toFixed(3)}s</span>
                            </div>
                            <div className="flex justify-between gap-4 items-center mb-1">
                                <span className="text-[10px] text-white/40 uppercase">Uncertainty (σ)</span>
                                <span className="text-[10px] font-mono text-white/60">±{d.uncertainty?.toFixed(3)}s</span>
                            </div>
                        </>
                    ) : (
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-white/40 italic">Baseline unavailable for this circuit</p>
                        </div>
                    )}
                    {d.sampleSize && (
                        <p className="text-[8px] text-white/10 mt-2 text-right uppercase tracking-widest font-mono">Samples: {d.sampleSize}</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#15151e] rounded-xl border border-white/10 p-6 flex flex-col h-[600px]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1 border-l-2 border-[#E10600] pl-3">
                        Baseline Race Order
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest ml-4">
                        Expected green-flag pace (Δ lap time vs leader).
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[8px] text-white/20 font-mono uppercase block">Source: {source}</span>
                    <span className="text-[8px] text-white/10 font-mono block uppercase">Status: {validity}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <ResponsiveContainer width="100%" height={sortedData.length * 28}>
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, maxDeltaForDomain + 0.1]}
                            stroke="rgba(255,255,255,0.1)"
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                            label={{ value: 'Δ LAP TIME (S)', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="driverId"
                            stroke="rgba(255,255,255,0.1)"
                            tick={{ fontSize: 10, fill: 'white', fontWeight: 'bold' }}
                            width={35}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

                        <Bar
                            dataKey={(row) => row.delta ?? 0.8}
                            barSize={12}
                            radius={[0, 1, 1, 0]}
                            isAnimationActive={true}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={getBarColor(entry.delta)}
                                    stroke={entry.delta === null ? 'rgba(255,255,255,0.2)' : 'none'}
                                    strokeWidth={entry.delta === null ? 1 : 0}
                                    strokeDasharray={entry.delta === null ? '2 2' : '0'}
                                    fillOpacity={entry.confidence === 'LOW' ? 0.45 : entry.confidence === 'MEDIUM' ? 0.75 : 1}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[#4A5568]"></div>
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Base Pace (L0)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[#E53E3E]"></div>
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Max Delta (+1.2s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm border border-white/30 border-dashed"></div>
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Hollow: No Estimate</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.1em] italic">
                        * Hollow bars indicate drivers without reliable baseline estimates for this circuit.
                    </p>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.1em] italic">
                        * Color indicates relative pace delta, not performance rating.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BaselineRaceOrderChart;
