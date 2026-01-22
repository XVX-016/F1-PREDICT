import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar, Cell } from 'recharts';

interface WinProbData {
    driver: string;
    probability: number;
    error: number; // Standard error for confidence interval
}

interface WinProbabilityChartProps {
    data: WinProbData[];
    highlightDriver?: string;
}

/**
 * Win Probability Chart - Bar chart with error bars
 * Sorted descending by probability, with uncertainty visualization.
 */
export const WinProbabilityChart: React.FC<WinProbabilityChartProps> = ({ data, highlightDriver }) => {
    // Sort descending by probability
    const sortedData = [...data].sort((a, b) => b.probability - a.probability);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded p-3 shadow-[var(--shadow-elevated)]">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{d.driver}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Win: {(d.probability * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-[var(--text-caption)]">
                        ±{(d.error * 100).toFixed(1)}% uncertainty
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Win Probability</h3>
                <p className="text-xs text-[var(--text-caption)]">
                    Probability of finishing P1 across all simulated outcomes. Error bars show stochastic uncertainty.
                </p>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(200, sortedData.length * 32)}>
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        axisLine={{ stroke: 'var(--border-subtle)' }}
                        tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                        domain={[0, 'dataMax']}
                    />
                    <YAxis
                        type="category"
                        dataKey="driver"
                        tick={{ fontSize: 11, fill: 'var(--text-primary)', fontWeight: 500 }}
                        axisLine={{ stroke: 'var(--border-subtle)' }}
                        width={45}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="probability"
                        radius={[0, 4, 4, 0]}
                    >
                        {sortedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.driver === highlightDriver ? 'var(--accent-red)' : 'var(--state-green)'}
                                fillOpacity={entry.driver === highlightDriver ? 1 : 0.7}
                            />
                        ))}
                        <ErrorBar
                            dataKey="error"
                            stroke="var(--text-muted)"
                            strokeWidth={1.5}
                            direction="x"
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WinProbabilityChart;
