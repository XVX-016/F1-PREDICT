import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ConfidenceData {
    lap: number;
    confidence: number;
}

interface ConfidenceDecayChartProps {
    data: ConfidenceData[];
    currentLap?: number;
}

/**
 * Confidence Decay Chart - Shows how prediction confidence decreases over race progression
 * Critical for preventing overconfidence in late-race predictions.
 */
export const ConfidenceDecayChart: React.FC<ConfidenceDecayChartProps> = ({ data, currentLap }) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const confidenceLabel = d.confidence > 0.7 ? 'High' : d.confidence > 0.4 ? 'Medium' : 'Low';
            return (
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded p-3 shadow-[var(--shadow-elevated)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Lap {d.lap}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Confidence: {(d.confidence * 100).toFixed(0)}% ({confidenceLabel})
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Confidence Decay</h3>
                <p className="text-xs text-[var(--text-caption)]">
                    Predictive confidence decreases as race progresses due to accumulated uncertainty.
                </p>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                        domain={[0, 1]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {currentLap && (
                        <ReferenceLine
                            x={currentLap}
                            stroke="var(--accent-red)"
                            strokeDasharray="4 4"
                            label={{ value: 'Now', fontSize: 10, fill: 'var(--accent-red)' }}
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="var(--state-green)"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ConfidenceDecayChart;
