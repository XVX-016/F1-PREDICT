import { useState } from 'react';
import { useSimulateRace } from '../../hooks/useApi';

interface SimulationResult {
    expected_time?: number;
    variance?: number;
    win_prob?: number;
    podium_prob?: number;
    win_probability?: Record<string, number>;
    metadata?: {
        iterations: number;
        seed: number;
        model_version: string;
        use_ml: boolean;
        mode: string;
    };
}

interface Props {
    raceId: string;
    strategyId?: string;
    params: Record<string, any>;
}

/**
 * SimulationComparisonPanel
 * 
 * Side-by-side comparison showing:
 * - Physics Only (Deterministic)
 * - Physics + ML (Residual Pace Model)
 * 
 * This proves ML adds signal without hiding behind magic.
 */
export function SimulationComparisonPanel({ raceId, params }: Props) {
    const simulateMutation = useSimulateRace();
    const [physicsResult, setPhysicsResult] = useState<SimulationResult | null>(null);
    const [mlResult, setMlResult] = useState<SimulationResult | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [hasCompared, setHasCompared] = useState(false);

    const runComparison = async () => {
        setIsComparing(true);

        try {
            // Run Physics Only simulation
            const physicsParams = { ...params, use_ml: false, iterations: 5000 };
            const physicsRes = await simulateMutation.mutateAsync({
                raceId,
                params: physicsParams
            });
            setPhysicsResult(physicsRes);

            // Run Physics + ML simulation (same seed for fair comparison)
            const mlParams = { ...params, use_ml: true, iterations: 5000 };
            const mlRes = await simulateMutation.mutateAsync({
                raceId,
                params: mlParams
            });
            setMlResult(mlRes);

            setHasCompared(true);
        } catch (err) {
            console.error('Comparison failed:', err);
        } finally {
            setIsComparing(false);
        }
    };

    // Calculate top driver win probability
    const getTopDriverWinProb = (result: SimulationResult | null): number => {
        if (!result?.win_probability) return 0;
        return Math.max(...Object.values(result.win_probability));
    };

    // Calculate variance proxy from win probability distribution
    const getVarianceMetric = (result: SimulationResult | null): number => {
        if (!result?.win_probability) return 0;
        const probs = Object.values(result.win_probability);
        const mean = probs.reduce((a, b) => a + b, 0) / probs.length;
        const variance = probs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probs.length;
        return Math.sqrt(variance) * 100; // Return as percentage points
    };

    if (!hasCompared) {
        return (
            <div className="bg-slate-900/50 border border-white/5 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            ML vs Physics Comparison
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Compare simulation outputs with and without Machine Learning adjustments
                        </p>
                    </div>
                    <button
                        onClick={runComparison}
                        disabled={isComparing}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded 
              ${isComparing
                                ? 'bg-slate-700 text-slate-400 cursor-wait'
                                : 'bg-[#E10600] text-white hover:bg-[#B80500]'
                            } transition-colors`}
                    >
                        {isComparing ? 'Running Comparison...' : 'Run Comparison'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 opacity-50">
                    <ComparisonCard
                        title="Physics Only"
                        subtitle="[DETERMINISTIC]"
                        data={null}
                    />
                    <ComparisonCard
                        title="Physics + ML"
                        subtitle="[ML ENABLED]"
                        data={null}
                    />
                </div>
            </div>
        );
    }

    // Calculate delta between ML and Physics
    const winProbDelta = getTopDriverWinProb(mlResult) - getTopDriverWinProb(physicsResult);
    const varianceDelta = getVarianceMetric(mlResult) - getVarianceMetric(physicsResult);

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        ML vs Physics Comparison
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Side-by-side analysis with identical seeds
                    </p>
                </div>
                <button
                    onClick={runComparison}
                    disabled={isComparing}
                    className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest 
            border border-slate-700 text-slate-400 hover:border-slate-600 
            rounded transition-colors"
                >
                    {isComparing ? 'Running...' : 'Re-run'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <ComparisonCard
                    title="Physics Only"
                    subtitle={physicsResult?.metadata?.mode || "[DETERMINISTIC]"}
                    data={physicsResult}
                    topWinProb={getTopDriverWinProb(physicsResult)}
                    variance={getVarianceMetric(physicsResult)}
                />
                <ComparisonCard
                    title="Physics + ML"
                    subtitle={mlResult?.metadata?.mode || "[ML ENABLED]"}
                    data={mlResult}
                    topWinProb={getTopDriverWinProb(mlResult)}
                    variance={getVarianceMetric(mlResult)}
                    modelVersion={mlResult?.metadata?.model_version}
                />
            </div>

            {/* Delta Analysis */}
            <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    ML Impact Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <DeltaMetric
                        label="Top Driver Win Prob Δ"
                        value={winProbDelta * 100}
                        unit="pp"
                        good={Math.abs(winProbDelta) < 0.15}
                    />
                    <DeltaMetric
                        label="Outcome Variance Δ"
                        value={varianceDelta}
                        unit="pp"
                        good={Math.abs(varianceDelta) < 5}
                    />
                </div>

                {Math.abs(winProbDelta) > 0.15 && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                        ⚠️ Large ML delta detected ({(winProbDelta * 100).toFixed(1)}pp).
                        Review model calibration.
                    </div>
                )}

                {Math.abs(winProbDelta) < 0.02 && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                        ℹ️ ML impact is minimal ({(winProbDelta * 100).toFixed(1)}pp).
                        This is expected with limited training data.
                    </div>
                )}
            </div>
        </div>
    );
}

interface ComparisonCardProps {
    title: string;
    subtitle: string;
    data: SimulationResult | null;
    topWinProb?: number;
    variance?: number;
    modelVersion?: string;
}

function ComparisonCard({ title, subtitle, data, topWinProb, variance, modelVersion }: ComparisonCardProps) {
    return (
        <div className="bg-[#0B0E11] border border-slate-800 rounded p-4">
            <h3 className="text-slate-200 font-semibold text-sm">{title}</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-mono uppercase">{subtitle}</p>

            {data ? (
                <div className="space-y-2">
                    <Metric label="Top Win Probability" value={`${((topWinProb || 0) * 100).toFixed(1)}%`} />
                    <Metric label="Outcome Spread" value={`${(variance || 0).toFixed(2)} pp`} />
                    <Metric label="Iterations" value={`${data.metadata?.iterations?.toLocaleString() || 'N/A'}`} />
                    <Metric label="Seed" value={`${data.metadata?.seed !== -1 ? data.metadata?.seed : 'Random'}`} />
                    {modelVersion && (
                        <Metric label="Model Version" value={modelVersion} />
                    )}
                </div>
            ) : (
                <div className="h-24 flex items-center justify-center text-slate-600 text-xs">
                    Awaiting simulation...
                </div>
            )}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between py-1 text-xs">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-200 font-mono">{value}</span>
        </div>
    );
}

interface DeltaMetricProps {
    label: string;
    value: number;
    unit: string;
    good: boolean;
}

function DeltaMetric({ label, value, unit, good }: DeltaMetricProps) {
    const isPositive = value > 0;
    const colorClass = good
        ? 'text-green-400'
        : 'text-yellow-400';

    return (
        <div className="bg-slate-800/50 rounded p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-lg font-mono ${colorClass}`}>
                {isPositive ? '+' : ''}{value.toFixed(2)} {unit}
            </div>
            <div className="text-[9px] text-slate-600 mt-1">
                {good ? '✓ Bounded impact' : '⚠ Review recommended'}
            </div>
        </div>
    );
}

export default SimulationComparisonPanel;
