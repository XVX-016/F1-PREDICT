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
    const { data, validity, source, computedAt, reason } = envelope;

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

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload as BaselineOrderItem;
            return (
                <div className="bg-[#1e1e24] border border-white/10 rounded p-3 shadow-2xl">
                    <p className="text-sm font-bold text-white uppercase mb-1">{d.driverId}</p>
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
                        <p className="text-[10px] text-[#ff4e4e] font-mono mt-2 italic">No baseline for this circuit</p>
                    )}
                    {d.sampleSize && (
                        <p className="text-[8px] text-white/10 mt-2 text-right">N={d.sampleSize} laps</p>
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

            <div className="flex-1 overflow-y-auto">
                <ResponsiveContainer width="100%" height={sortedData.length * 25}>
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, 'dataMax + 0.5']}
                            stroke="rgba(255,255,255,0.1)"
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                            label={{ value: 'Δ LAP TIME (S)', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 9, tracking: '0.1em' }}
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
                            dataKey="delta"
                            barSize={10}
                            radius={[0, 1, 1, 0]}
                            isAnimationActive={true}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.delta === null ? 'none' : entry.color}
                                    stroke={entry.delta === null ? 'rgba(255,255,255,0.1)' : 'none'}
                                    strokeDasharray={entry.delta === null ? '2 2' : '0'}
                                    fillOpacity={entry.confidence === 'LOW' ? 0.3 : entry.confidence === 'MEDIUM' ? 0.7 : 1}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-mono">
                    Hollow bars = 0.0s baseline (estimate unavailable)
                </p>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full border border-white/20 border-dashed"></span>
                        <span className="text-[8px] text-white/30 uppercase font-mono">No Baseline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white/20"></span>
                        <span className="text-[8px] text-white/30 uppercase font-mono">Low Conf</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaselineRaceOrderChart;
