import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BaselineOrderItem, DataEnvelope } from '../../types/intelligence';

interface BaselineRaceOrderChartProps {
    envelope: DataEnvelope<BaselineOrderItem[]>;
}

export const BaselineRaceOrderChart: React.FC<BaselineRaceOrderChartProps> = ({ envelope }) => {
    const { data, validity, reason } = envelope;

    if (validity === 'UNAVAILABLE') {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center border border-white/5 border-dashed p-8 text-center rounded-xl">
                <span className="text-sm text-white/60 font-mono mb-2 font-bold uppercase tracking-widest">
                    Pace Projection Unavailable
                </span>
                <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] max-w-[250px]">
                    {reason || 'Insufficient historical data to project the race pace order for this circuit.'}
                </span>
            </div>
        );
    }

    const sortedData = [...data].sort((a, b) => {
        if (a.delta === null) return 1;
        if (b.delta === null) return -1;
        return a.delta - b.delta;
    });

    const maxDeltaForDomain = Math.max(...data.map((d) => d.delta || 0), 0.8);

    const getBarColor = (delta: number | null) => {
        if (delta === null) return 'none';
        const normMax = Math.max(maxDeltaForDomain, 1.2);
        const t = Math.min(delta / normMax, 1);
        const r = Math.round(74 + (229 - 74) * t);
        const g = Math.round(85 + (62 - 85) * t);
        const b = Math.round(104 + (62 - 104) * t);
        return `rgb(${r}, ${g}, ${b})`;
    };

    const chartRows = sortedData.map((row) => ({
        ...row,
        label: row.name || row.driverId
    }));

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: BaselineOrderItem }[] }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload as BaselineOrderItem;
            return (
                <div className="bg-[#1e1e24] border border-white/10 rounded p-3 shadow-2xl">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <p className="text-sm font-bold text-white uppercase">{d.name || d.driverId}</p>
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
                                <span className="text-[10px] text-white/40 uppercase">Gap to Fastest</span>
                                <span className="text-[10px] font-mono text-white">+{d.delta.toFixed(3)}s</span>
                            </div>
                            <div className="flex justify-between gap-4 items-center mb-1">
                                <span className="text-[10px] text-white/40 uppercase">Uncertainty</span>
                                <span className="text-[10px] font-mono text-white/60">+/-{d.uncertainty?.toFixed(3)}s</span>
                            </div>
                        </>
                    ) : (
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-white/40 italic">Projection unavailable for this driver</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <ResponsiveContainer width="100%" height={chartRows.length * 28}>
                    <BarChart data={chartRows} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, maxDeltaForDomain + 0.1]}
                            stroke="rgba(255,255,255,0.1)"
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                            label={{ value: 'Projected Gap To Fastest (s)', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            stroke="rgba(255,255,255,0.1)"
                            tick={{ fontSize: 10, fill: 'white', fontWeight: 'bold' }}
                            width={130}
                            interval={0}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

                        <Bar dataKey={(row) => row.delta ?? 0.8} barSize={12} radius={[0, 1, 1, 0]} isAnimationActive={true}>
                            {chartRows.map((entry, index) => (
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
        </div>
    );
};

export default BaselineRaceOrderChart;
