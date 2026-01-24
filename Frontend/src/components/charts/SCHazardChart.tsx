import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SCHazardPoint, DataEnvelope } from '../../types/intelligence';

interface SCHazardChartProps {
    envelope: DataEnvelope<SCHazardPoint[]>;
}

/**
 * SC Hazard Chart - Safety Car probability density (PDF) by lap
 * Research-grade visualization with locked semantics and provenance.
 */
export const SCHazardChart: React.FC<SCHazardChartProps> = ({ envelope }) => {
    const { data, validity, source, computedAt } = envelope;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e1e24] border border-white/10 rounded p-3 shadow-2xl">
                    <p className="text-xs font-bold text-white uppercase mb-2">Lap {label}</p>
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between gap-4 items-center mb-1">
                            <span className="text-[10px] text-white/40 uppercase">{p.name}</span>
                            <span className="text-[10px] font-mono text-white">{(p.value * 100).toFixed(2)}%</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-white/5 text-[8px] text-white/20 italic">
                        PDF: Prob. of first SC deployment at this lap
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#15151e] rounded-xl border border-white/10 p-4 transition-all hover:border-white/20">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Safety Car Hazard Curve</h3>
                    <p className="text-[10px] text-white/40 uppercase font-mono mt-1">
                        Per-Lap Probability Density Function (PDF)
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[8px] text-white/20 font-mono uppercase block">Source: {source}</span>
                    <span className="text-[8px] text-white/10 font-mono block">CALC: {new Date(computedAt).toLocaleDateString()}</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="lap"
                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        label={{ value: 'LAP', position: 'insideBottom', offset: -10, fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                    />
                    <YAxis
                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'white', strokeWidth: 0.5, strokeDasharray: '5 5' }} />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: 9, textTransform: 'uppercase', paddingBottom: '20px', letterSpacing: '0.05em' }}
                        iconType="circle"
                    />
                    <Area
                        type="monotone"
                        dataKey="historicalRate"
                        name="Historical Circuit Average"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        fill="rgba(255,255,255,0.02)"
                        fillOpacity={1}
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="inferredRate"
                        name="Context-Adjusted Hazard"
                        stroke="#E10600"
                        strokeWidth={2.5}
                        fill="url(#hazardGradient)"
                        fillOpacity={1}
                        animationDuration={1500}
                    />
                    <defs>
                        <linearGradient id="hazardGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E10600" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#E10600" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                </AreaChart>
            </ResponsiveContainer>

            {validity === 'DEGRADED' && (
                <div className="mt-4 px-3 py-1 bg-[#ffb347]/5 border border-[#ffb347]/10 rounded">
                    <p className="text-[9px] text-[#ffb347] uppercase font-bold text-center tracking-widest">
                        Estimate shown with limited historical support
                    </p>
                </div>
            )}

            <p className="text-[9px] text-white/20 mt-4 uppercase tracking-[0.1em] text-center font-mono italic">
                Context-adjusted hazard incorporates circuit history, grid density, and surface conditions.
            </p>
        </div>
    );
};

export default SCHazardChart;
