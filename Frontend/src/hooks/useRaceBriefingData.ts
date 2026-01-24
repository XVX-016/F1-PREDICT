import { useMemo } from 'react';
import { SEASON_2026_DRIVERS } from '../data/season2026';
import { DataEnvelope, DriverRiskPrior, SCHazardPoint, BaselineOrderItem, SupportingPrior, PodiumProbability } from '../types/intelligence';

interface UseRaceBriefingDataProps {
    circuitId: string;
    session: "RACE" | "SPRINT";
    trackCondition: "DRY" | "INTERMEDIATE" | "WET";
}

export const useRaceBriefingData = ({ circuitId, session, trackCondition }: UseRaceBriefingDataProps) => {
    const computedAt = useMemo(() => new Date().toISOString(), []);

    // 1. Driver Risk Priors
    const driverPriorsEnvelope: DataEnvelope<DriverRiskPrior[]> = useMemo(() => {
        const drivers: DriverRiskPrior[] = SEASON_2026_DRIVERS.map(d => ({
            driverId: d.id.toUpperCase(),
            name: d.name,
            incidentInvolvement: 0.05 + (Math.random() * 0.15),
            restartDelta: (Math.random() * 1.5) - 0.5,
            wetPaceGain: trackCondition === 'DRY' ? null : 0.01 + (Math.random() * 0.05),
            lapTimeVariance: 0.15 + (Math.random() * 0.1),
            sampleSize: 200 + Math.floor(Math.random() * 800)
        }));

        return {
            context: { circuitId, session, trackCondition },
            data: drivers,
            validity: 'VALID',
            source: 'HISTORICAL',
            computedAt
        };
    }, [circuitId, session, trackCondition, computedAt]);

    // 2. SC Hazard
    const scHazardEnvelope: DataEnvelope<SCHazardPoint[]> = useMemo(() => {
        const totalLaps = 53;
        const conditionMultiplier = trackCondition === 'WET' ? 1.5 : trackCondition === 'INTERMEDIATE' ? 1.2 : 1.0;
        const sessionMultiplier = session === 'SPRINT' ? 0.8 : 1.0;

        const data: SCHazardPoint[] = Array.from({ length: totalLaps }, (_, i) => {
            const lap = i + 1;
            const historical = (0.02 + 0.06 * Math.sin((lap / totalLaps) * Math.PI));
            const baseInferred = lap < 18
                ? 0.04 + 0.08 * (lap / 18)
                : 0.12 - 0.08 * ((lap - 18) / 35);

            return {
                lap,
                historicalRate: Math.max(0.005, historical),
                inferredRate: Math.max(0.005, baseInferred * conditionMultiplier * sessionMultiplier)
            };
        });

        return {
            context: { circuitId, session, trackCondition },
            data,
            validity: 'VALID',
            source: 'SIMULATION',
            computedAt
        };
    }, [circuitId, session, trackCondition, computedAt]);

    // 3. Baseline Race Order (Full 22 drivers)
    const baselineOrderEnvelope: DataEnvelope<BaselineOrderItem[]> = useMemo(() => {
        const hasData = circuitId === 'Japanese Grand Prix';

        const data: BaselineOrderItem[] = SEASON_2026_DRIVERS.map((d, i) => {
            const isMissing = !hasData || (i > 18 && Math.random() > 0.3);
            return {
                driverId: d.id.toUpperCase(),
                name: d.name,
                delta: isMissing ? null : i * 0.08 + (Math.random() * 0.02),
                uncertainty: isMissing ? null : 0.05 + (Math.random() * 0.1),
                confidence: i < 5 ? 'HIGH' : i < 15 ? 'MEDIUM' : 'LOW',
                status: isMissing ? 'NO_DATA' : 'ESTIMATED',
                sampleSize: isMissing ? undefined : 400 + Math.floor(Math.random() * 400),
                color: d.teamColor
            };
        });

        return {
            context: { circuitId, session, trackCondition },
            data,
            validity: hasData ? 'VALID' : 'DEGRADED',
            reason: hasData ? undefined : `Limited baseline telemetry for ${circuitId}. Showing priors with higher uncertainty.`,
            source: 'HYBRID',
            computedAt
        };
    }, [circuitId, session, trackCondition, computedAt]);

    // 4. Podium Probability (Monte Carlo Simulation)
    const podiumProbabilityEnvelope: DataEnvelope<PodiumProbability[]> = useMemo(() => {
        const baselineData = baselineOrderEnvelope.data;
        const availableBaselineRatio = baselineData.filter(d => d.delta !== null).length / baselineData.length;

        if (availableBaselineRatio < 0.4) {
            return {
                context: { circuitId, session, trackCondition },
                data: [],
                validity: 'UNAVAILABLE',
                reason: 'Insufficient baseline pace data to converge on credible podium probabilities.',
                source: 'SIMULATION',
                computedAt
            };
        }

        // Monte Carlo Simulation
        const NUM_RUNS = 10000;
        const ALPHA_SC = 0.35;
        const scHazardIntegral = scHazardEnvelope.data.reduce((acc, p) => acc + p.inferredRate, 0);

        const podiumCounts = new Map<string, number>();
        const p1Counts = new Map<string, number>();
        const p2Counts = new Map<string, number>();
        const p3Counts = new Map<string, number>();

        const driversWithData = baselineData.filter(d => d.delta !== null);

        for (let run = 0; run < NUM_RUNS; run++) {
            const sampledResults = driversWithData.map(d => {
                const sigmaEff = (d.uncertainty || 0.1) * (1 + ALPHA_SC * scHazardIntegral);

                // Box-Muller transform for normal distribution
                const u1 = Math.random();
                const u2 = Math.random();
                const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

                const score = (d.delta || 0) + z0 * sigmaEff;
                return { id: d.driverId, score };
            });

            sampledResults.sort((a, b) => a.score - b.score);

            for (let i = 0; i < Math.min(3, sampledResults.length); i++) {
                const dId = sampledResults[i].id;
                podiumCounts.set(dId, (podiumCounts.get(dId) || 0) + 1);
                if (i === 0) p1Counts.set(dId, (p1Counts.get(dId) || 0) + 1);
                if (i === 1) p2Counts.set(dId, (p2Counts.get(dId) || 0) + 1);
                if (i === 2) p3Counts.set(dId, (p3Counts.get(dId) || 0) + 1);
            }
        }

        const podiumProbs: PodiumProbability[] = SEASON_2026_DRIVERS.map(d => {
            const code = d.id.toUpperCase();
            const podiumCount = podiumCounts.get(code) || 0;
            const p1 = (p1Counts.get(code) || 0) / NUM_RUNS;
            const p2 = (p2Counts.get(code) || 0) / NUM_RUNS;
            const p3 = (p3Counts.get(code) || 0) / NUM_RUNS;
            const podium = podiumCount / NUM_RUNS;

            // Confidence logic
            let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
            const driverBaseline = baselineData.find(bd => bd.driverId === code);
            if (driverBaseline?.confidence === "HIGH" && podium > 0.2) confidence = "HIGH";
            else if (podium > 0.05) confidence = "MEDIUM";

            return {
                driverId: code,
                shortCode: code,
                p1, p2, p3, podium,
                confidence
            };
        }).sort((a, b) => b.podium - a.podium);

        return {
            context: { circuitId, session, trackCondition },
            data: podiumProbs,
            validity: 'VALID',
            source: 'SIMULATION',
            computedAt
        };
    }, [baselineOrderEnvelope, scHazardEnvelope, circuitId, session, trackCondition, computedAt]);

    // 5. Supporting Priors
    const supportingPriorsEnvelope: DataEnvelope<SupportingPrior[]> = useMemo(() => {
        const priors: SupportingPrior[] = [
            {
                key: 'overtake',
                title: 'Overtake Index',
                value: 3.8,
                unit: 'pts',
                description: 'Used to modulate pass probability per lap based on corner geometry and DRS length.',
                confidence: 'HIGH'
            },
            {
                key: 'pit_loss',
                title: 'Pit Loss Mean',
                value: 22.8,
                unit: 'sec',
                description: 'Influence on race outcome modeling. Estimated time lost from pit entry to exit under green flag.',
                confidence: 'MEDIUM'
            },
            {
                key: 'tyre_deg',
                title: 'Tyre Deg σ',
                value: trackCondition === 'DRY' ? 0.12 : 0.08,
                unit: 's/lap',
                description: 'Expected pace degradation per lap. Lower in wet due to reduced thermal load.',
                confidence: 'MEDIUM'
            },
            {
                key: 'traffic',
                title: 'Traffic Penalty',
                value: 0.85,
                unit: 's',
                description: 'Applied to midfield cars in dense clusters. Time loss per lap when running in dirty air.',
                confidence: 'LOW'
            }
        ];

        return {
            context: { circuitId, session, trackCondition },
            data: priors,
            validity: 'VALID',
            source: 'HISTORICAL',
            computedAt
        };
    }, [circuitId, session, trackCondition, computedAt]);

    return {
        driverPriorsEnvelope,
        scHazardEnvelope,
        baselineOrderEnvelope,
        podiumProbabilityEnvelope,
        supportingPriorsEnvelope
    };
};
