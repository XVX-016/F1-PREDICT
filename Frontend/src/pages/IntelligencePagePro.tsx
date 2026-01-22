import RaceContextHeader from '../components/intelligence/RaceContextHeader';
import DriverConfidenceTable from '../components/intelligence/DriverConfidenceTable';
import ModelAssumptionsAccordion from '../components/intelligence/ModelAssumptionsAccordion';
import SCHazardChart from '../components/charts/SCHazardChart';

/**
 * Intelligence Page (Professional Version - Phase 5)
 * Read-only, trust-building page for understanding the race landscape.
 */
const IntelligencePagePro = () => {
    // Mock data - in production, fetch from backend
    const driverConfidences = [
        { id: 'VER', name: 'M. Verstappen', chaosIndex: 'High' as const, restartSkill: 'Elite' as const, wetBias: 'Neutral' as const, errorVolatility: 'Low' as const },
        { id: 'NOR', name: 'L. Norris', chaosIndex: 'Medium' as const, restartSkill: 'Strong' as const, wetBias: 'Positive' as const, errorVolatility: 'Medium' as const },
        { id: 'LEC', name: 'C. Leclerc', chaosIndex: 'High' as const, restartSkill: 'Strong' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'HAM', name: 'L. Hamilton', chaosIndex: 'Medium' as const, restartSkill: 'Strong' as const, wetBias: 'Positive' as const, errorVolatility: 'Low' as const },
        { id: 'SAI', name: 'C. Sainz', chaosIndex: 'Medium' as const, restartSkill: 'Average' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'RUS', name: 'G. Russell', chaosIndex: 'Medium' as const, restartSkill: 'Average' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'PER', name: 'S. Perez', chaosIndex: 'Low' as const, restartSkill: 'Weak' as const, wetBias: 'Negative' as const, errorVolatility: 'High' as const },
        { id: 'ALO', name: 'F. Alonso', chaosIndex: 'High' as const, restartSkill: 'Elite' as const, wetBias: 'Positive' as const, errorVolatility: 'Low' as const },
    ];

    const assumptions = [
        {
            title: 'Tyre Degradation Model',
            description: 'Based on 2024 compound data with track-specific wear factors. Assumes ambient temps between 28-35°C.',
            source: 'Pirelli Official Compound Data + FastF1 Telemetry'
        },
        {
            title: 'Safety Car Probability',
            description: 'Inferred from 2014-2024 historical SC deployments at this circuit, weighted by field compression and weather.',
            source: 'FIA Race Director Archive'
        },
        {
            title: 'Restart Skill Estimates',
            description: 'Fitted from position deltas in the 3 laps following SC restarts. Sample size varies by driver (8-30 events).',
            source: 'FastF1 Position Data'
        },
        {
            title: 'Weather Sensitivity',
            description: 'Rain probability from forecast APIs. Lap time impact derived from historical wet-dry delta analysis.',
            source: 'OpenWeather + Historical Telemetry'
        },
    ];

    // Mock SC Hazard data (Suzuka pattern: mid-race weighted)
    const scHazardData = Array.from({ length: 53 }, (_, i) => {
        const lap = i + 1;
        // Historical: gradually increasing then decreasing (mid-race peak)
        const historical = 0.02 + 0.06 * Math.sin((lap / 53) * Math.PI);
        // Inferred: slightly higher in first third (aggressive start)
        const inferred = lap < 18
            ? 0.04 + 0.08 * (lap / 18)
            : 0.12 - 0.08 * ((lap - 18) / 35);
        return { lap, historical: Math.max(0.01, historical), inferred: Math.max(0.01, inferred) };
    });

    return (
        <div className="min-h-screen bg-[var(--bg-page)]">
            <RaceContextHeader
                raceName="Japanese Grand Prix 2025"
                session="Pre-Race"
                modelConfidence={3}
                lastCalibrated="3 races ago"
            />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Section 1: Pace Context */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        Baseline Race Order
                    </h2>
                    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-6">
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Expected lap time delta relative to race leader. Shaded range reflects uncertainty from tyre wear, fuel, and traffic.
                        </p>
                        {/* Placeholder for PaceDistributionChart */}
                        <div className="h-64 bg-[var(--bg-panel)] rounded flex items-center justify-center">
                            <span className="text-sm text-[var(--text-muted)]">
                                Pace Distribution Chart (Recharts BoxPlot - Coming Soon)
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-caption)] mt-4">
                            Derived from qualifying, long-run pace, tyre degradation models. Weather-adjusted.
                        </p>
                    </div>
                </section>

                {/* Section 2: Driver Profiles */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        Driver Confidence Profiles
                    </h2>
                    <DriverConfidenceTable drivers={driverConfidences} />
                </section>

                {/* Section 3: Safety Car Intelligence */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        Safety Car Intelligence
                    </h2>
                    <SCHazardChart data={scHazardData} totalLaps={53} />
                    <p className="text-xs text-[var(--text-caption)] mt-2">
                        Street circuits show front-loaded SC risk. Suzuka historically mid-race weighted.
                    </p>
                </section>

                {/* Section 4: Model Assumptions */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        Model Assumptions
                    </h2>
                    <ModelAssumptionsAccordion assumptions={assumptions} />
                </section>
            </main>
        </div>
    );
};

export default IntelligencePagePro;
