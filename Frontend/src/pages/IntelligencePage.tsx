import React from 'react';
import RaceContextHeader from '../components/intelligence/RaceContextHeader';
import DriverConfidenceTable from '../components/intelligence/DriverConfidenceTable';
import ModelAssumptionsAccordion from '../components/intelligence/ModelAssumptionsAccordion';
import SCHazardChart from '../components/charts/SCHazardChart';
import PageContainer from '../components/layout/PageContainer';

/**
 * Intelligence Page (Research-Grade)
 * Read-only, trust-building page for understanding the race landscape.
 * Stateless and publicly accessible.
 */
const IntelligencePage = () => {
    // Mock data - aligned with 2026 Grid
    const driverConfidences = [
        { id: 'VER', name: 'M. Verstappen', chaosIndex: 'High' as const, restartSkill: 'Elite' as const, wetBias: 'Neutral' as const, errorVolatility: 'Low' as const },
        { id: 'HAD', name: 'I. Hadjar', chaosIndex: 'High' as const, restartSkill: 'Weak' as const, wetBias: 'Negative' as const, errorVolatility: 'High' as const },
        { id: 'LEC', name: 'C. Leclerc', chaosIndex: 'High' as const, restartSkill: 'Strong' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'HAM', name: 'L. Hamilton', chaosIndex: 'Medium' as const, restartSkill: 'Strong' as const, wetBias: 'Positive' as const, errorVolatility: 'Low' as const },
        { id: 'NOR', name: 'L. Norris', chaosIndex: 'Medium' as const, restartSkill: 'Strong' as const, wetBias: 'Positive' as const, errorVolatility: 'Medium' as const },
        { id: 'PIA', name: 'O. Piastri', chaosIndex: 'Low' as const, restartSkill: 'Strong' as const, wetBias: 'Neutral' as const, errorVolatility: 'Low' as const },
        { id: 'RUS', name: 'G. Russell', chaosIndex: 'Medium' as const, restartSkill: 'Average' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'ANT', name: 'K. Antonelli', chaosIndex: 'High' as const, restartSkill: 'Weak' as const, wetBias: 'Positive' as const, errorVolatility: 'Medium' as const },
        { id: 'ALO', name: 'F. Alonso', chaosIndex: 'High' as const, restartSkill: 'Elite' as const, wetBias: 'Positive' as const, errorVolatility: 'Low' as const },
        { id: 'STR', name: 'L. Stroll', chaosIndex: 'Medium' as const, restartSkill: 'Average' as const, wetBias: 'Neutral' as const, errorVolatility: 'High' as const },
        { id: 'HUL', name: 'N. Hulkenberg', chaosIndex: 'Low' as const, restartSkill: 'Average' as const, wetBias: 'Neutral' as const, errorVolatility: 'Low' as const },
        { id: 'BOR', name: 'G. Bortoleto', chaosIndex: 'Medium' as const, restartSkill: 'Weak' as const, wetBias: 'Negative' as const, errorVolatility: 'High' as const },
        { id: 'PER', name: 'S. Perez', chaosIndex: 'Low' as const, restartSkill: 'Weak' as const, wetBias: 'Negative' as const, errorVolatility: 'High' as const },
        { id: 'BOT', name: 'V. Bottas', chaosIndex: 'Low' as const, restartSkill: 'Strong' as const, wetBias: 'Positive' as const, errorVolatility: 'Low' as const },
        { id: 'ALB', name: 'A. Albon', chaosIndex: 'Low' as const, restartSkill: 'Strong' as const, wetBias: 'Neutral' as const, errorVolatility: 'Low' as const },
        { id: 'SAI', name: 'C. Sainz', chaosIndex: 'Medium' as const, restartSkill: 'Average' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'GAS', name: 'P. Gasly', chaosIndex: 'Medium' as const, restartSkill: 'Average' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'COL', name: 'F. Colapinto', chaosIndex: 'High' as const, restartSkill: 'Weak' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'OCO', name: 'E. Ocon', chaosIndex: 'Medium' as const, restartSkill: 'Strong' as const, wetBias: 'Neutral' as const, errorVolatility: 'Medium' as const },
        { id: 'BEA', name: 'O. Bearman', chaosIndex: 'Low' as const, restartSkill: 'Average' as const, wetBias: 'Positive' as const, errorVolatility: 'Medium' as const },
        { id: 'LAW', name: 'L. Lawson', chaosIndex: 'Medium' as const, restartSkill: 'Average' as const, wetBias: 'Positive' as const, errorVolatility: 'Medium' as const },
        { id: 'LIN', name: 'A. Lindblad', chaosIndex: 'High' as const, restartSkill: 'Weak' as const, wetBias: 'Neutral' as const, errorVolatility: 'High' as const },
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
        <PageContainer>
            <div className="space-y-8">
                <RaceContextHeader
                    raceName="Japanese Grand Prix 2025"
                    session="Pre-Race"
                    modelConfidence={3}
                    lastCalibrated="3 races ago"
                />

                <main className="grid grid-cols-1 gap-8">
                    {/* Section 1: Pace Context */}
                    <section>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-[#E10600] pl-3">
                            Baseline Race Order
                        </h2>
                        <div className="bg-[#141821] rounded-lg border border-white/5 p-6">
                            <p className="text-sm text-gray-400 mb-4 font-mono">
                                Expected lap time delta relative to race leader. Shaded range reflects uncertainty from tyre wear, fuel, and traffic.
                            </p>
                            {/* Placeholder for PaceDistributionChart */}
                            <div className="h-64 bg-black/30 rounded flex items-center justify-center border border-white/5 border-dashed">
                                <span className="text-sm text-gray-500 font-mono">
                                    [Pace Distribution Chart - Coming Soon]
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest">
                                Derived from qualifying, long-run pace, tyre degradation models. Weather-adjusted.
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Driver Profiles */}
                    <section>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-[#E10600] pl-3">
                            Driver Confidence Profiles
                        </h2>
                        <DriverConfidenceTable drivers={driverConfidences} />
                    </section>

                    {/* Section 3: Safety Car Intelligence */}
                    <section>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-[#E10600] pl-3">
                            Safety Car Intelligence
                        </h2>
                        <div className="bg-transparent rounded border border-white/10 p-4">
                            <SCHazardChart data={scHazardData} totalLaps={53} />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 ml-1">
                            Street circuits show front-loaded SC risk. Suzuka historically mid-race weighted.
                        </p>
                    </section>

                    {/* Section 4: Model Assumptions */}
                    <section>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-[#E10600] pl-3">
                            Model Assumptions
                        </h2>
                        <ModelAssumptionsAccordion assumptions={assumptions} />
                    </section>
                </main>
            </div>
        </PageContainer>
    );
};

export default IntelligencePage;
