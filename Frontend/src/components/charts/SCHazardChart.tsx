import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SCHazardData {
    lap: number;
    historical: number;
    inferred: number;
}

interface SCHazardChartProps {
    data: SCHazardData[];
    totalLaps?: number;
}

/**
 * SC Hazard Chart - Safety Car probability density by lap
 * Shows historical vs inferred hazard curves.
 */
export const SCHazardChart: React.FC<SCHazardChartProps> = ({ data }) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded p-3 shadow-[var(--shadow-elevated)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Lap {label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} className="text-xs text-[var(--text-secondary)]">
                            {p.name}: {(p.value * 100).toFixed(1)}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">SC Hazard Curve</h3>
                <p className="text-xs text-[var(--text-caption)]">
                    Probability density of Safety Car deployment by lap
                </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis
                        dataKey="lap"
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        axisLine={{ stroke: 'var(--border-subtle)' }}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        axisLine={{ stroke: 'var(--border-subtle)' }}
                        tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        iconType="line"
                    />
                    <Area
                        type="monotone"
                        dataKey="historical"
                        name="Historical Avg"
                        stroke="var(--text-muted)"
                        strokeDasharray="4 4"
                        fill="var(--bg-panel)"
                        fillOpacity={0.4}
                    />
                    <Area
                        type="monotone"
                        dataKey="inferred"
                        name="Today's Inferred"
                        stroke="var(--accent-red)"
                        fill="var(--accent-red-light)"
                        fillOpacity={0.5}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SCHazardChart;
