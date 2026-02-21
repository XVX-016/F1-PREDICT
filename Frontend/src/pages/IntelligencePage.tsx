import { useMemo, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import RaceBriefingControls from '../components/intelligence/RaceBriefingControls';
import DriverRiskPriorsTable from '../components/intelligence/DriverRiskPriorsTable';
import BaselineRaceOrderChart from '../components/intelligence/BaselineRaceOrderChart';
import PodiumProbabilityCard from '../components/intelligence/PodiumProbabilityCard';
import ModelAssumptionsAccordion from '../components/intelligence/ModelAssumptionsAccordion';
import { DataEnvelope, BaselineOrderItem, DriverRiskPrior, PodiumProbability } from '../types/intelligence';
import { useIntelligence } from '../hooks/useIntelligence';
import { DRIVER_INFO } from '../utils/ReplayDataHelper';
import { SEASON_2025_SCHEDULE } from '../data/season2025';

const SEASON_2025_DRIVER_IDS = Object.keys(DRIVER_INFO);
type BaselineSummaryRow = {
    driver_id: string;
    delta?: number;
    uncertainty?: number;
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
};

const rankConfidence = (value: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
    if (value > 0.2) return 'HIGH';
    if (value > 0.07) return 'MEDIUM';
    return 'LOW';
};

const normalizeCircuitId = (circuitName: string): string => {
    const cleaned = circuitName
        .toLowerCase()
        .replace(/grand prix/g, '')
        .replace(/circuit/g, '')
        .replace(/autodrome|autodromo|international|street|raceway/g, '')
        .replace(/[^\w\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');

    const aliases: Record<string, string> = {
        albert_park: 'albert_park',
        shanghai: 'shanghai',
        suzuka: 'suzuka',
        bahrain_international: 'bahrain',
        jeddah_corniche: 'jeddah',
        miami: 'miami',
        imola: 'imola',
        circuit_de_monaco: 'monaco',
        de_barcelonacatalunya: 'catalunya',
        barcelonacatalunya: 'catalunya',
        gilles_villeneuve: 'montreal',
        red_bull_ring: 'spielberg',
        de_spafrancorchamps: 'spa',
        hungaroring: 'hungaroring',
        zandvoort: 'zandvoort',
        monza: 'monza',
        baku_city: 'baku',
        marina_bay: 'marina_bay',
        of_the_americas: 'cota',
        the_americas: 'cota',
        autdromo_hermanos_rodrguez: 'mexico_city',
        autodromo_hermanos_rodriguez: 'mexico_city',
        interlagos: 'interlagos',
        las_vegas_strip: 'las_vegas',
        lusail: 'lusail',
        yas_marina: 'abu_dhabi'
    };

    return aliases[cleaned] || cleaned;
};

const IntelligencePage = () => {
    const [selectedCircuit, setSelectedCircuit] = useState(`${SEASON_2025_SCHEDULE[0].round}_2025`);
    const [selectedSession, setSelectedSession] = useState<'RACE' | 'SPRINT'>('RACE');
    const [selectedCondition, setSelectedCondition] = useState<'DRY' | 'INTERMEDIATE' | 'WET'>('DRY');

    const selectedRound = Number(selectedCircuit.split('_')[0]);
    const selectedRace = SEASON_2025_SCHEDULE.find((r) => r.round === selectedRound) || SEASON_2025_SCHEDULE[0];
    const raceId = normalizeCircuitId(selectedRace.circuit);

    const {
        intelligence,
        baselineSummary,
        rigorous,
        isLoading,
        isError,
        rigorousUnavailable
    } = useIntelligence(raceId, SEASON_2025_DRIVER_IDS, selectedSession, selectedCondition);

    const computedAt = intelligence?.generated_at || new Date().toISOString();
    const baseContext = useMemo(() => ({
        circuitId: raceId,
        session: selectedSession,
        trackCondition: selectedCondition
    }), [raceId, selectedSession, selectedCondition]);

    const baselineRows = (baselineSummary || []) as BaselineSummaryRow[];
    const baselineMap = new Map<string, BaselineSummaryRow>(baselineRows.map((item) => [item.driver_id, item]));

    const baselineOrderEnvelope: DataEnvelope<BaselineOrderItem[]> = {
        context: baseContext,
        validity: isError ? 'UNAVAILABLE' : (baselineSummary && baselineSummary.length > 0 ? 'VALID' : 'DEGRADED'),
        reason: isError ? 'Backend baseline service unavailable.' : undefined,
        source: 'HYBRID',
        computedAt,
        data: SEASON_2025_DRIVER_IDS.map((driverId) => {
            const row = baselineMap.get(driverId);
            const info = DRIVER_INFO[driverId];
            return {
                driverId,
                name: info?.name || driverId,
                delta: typeof row?.delta === 'number' ? row.delta : null,
                uncertainty: typeof row?.uncertainty === 'number' ? row.uncertainty : null,
                confidence: row?.confidence || 'LOW',
                status: row ? 'ESTIMATED' as const : 'NO_DATA' as const,
                sampleSize: undefined,
                color: info?.color || '#888888'
            };
        }).sort((a, b) => {
            if (a.delta === null) return 1;
            if (b.delta === null) return -1;
            return a.delta - b.delta;
        })
    };

    const podiumProbabilityEnvelope: DataEnvelope<PodiumProbability[]> = {
        context: baseContext,
        validity: isError ? 'UNAVAILABLE' : (intelligence ? 'VALID' : 'DEGRADED'),
        reason: isError ? 'Backend intelligence service unavailable.' : undefined,
        source: 'SIMULATION',
        computedAt,
        data: SEASON_2025_DRIVER_IDS.map((driverId) => {
            const podium = intelligence?.podium_probability?.[driverId] || [0, 0, 0];
            const p1 = podium[0] || 0;
            const p2 = podium[1] || 0;
            const p3 = podium[2] || 0;
            const total = p1 + p2 + p3;
            return {
                driverId,
                shortCode: driverId,
                p1,
                p2,
                p3,
                podium: total,
                confidence: rankConfidence(total)
            };
        }).sort((a, b) => b.podium - a.podium)
    };

    const driverPriorsEnvelope: DataEnvelope<DriverRiskPrior[]> = {
        context: baseContext,
        validity: isError ? 'UNAVAILABLE' : (intelligence ? 'VALID' : 'DEGRADED'),
        reason: isError ? 'Driver priors cannot be derived without intelligence data.' : undefined,
        source: 'HYBRID',
        computedAt,
        data: SEASON_2025_DRIVER_IDS.map((driverId) => {
            const info = DRIVER_INFO[driverId];
            const pace = intelligence?.pace_distributions?.[driverId];
            const robustness = intelligence?.robustness_score?.[driverId];
            const spread = pace ? Math.max((pace.p95 || 0) - (pace.p05 || 0), 0) : 0;
            const consistency = typeof robustness === 'number' ? robustness : 0.5;
            return {
                driverId,
                name: info?.name || driverId,
                incidentInvolvement: Number((Math.min(0.25, 0.03 + (1 - consistency) * 0.2)).toFixed(3)),
                restartDelta: Number((((consistency - 0.5) * 2) * 0.5).toFixed(2)),
                wetPaceGain: selectedCondition === 'DRY' ? null : Number((((consistency - 0.5) * 0.08)).toFixed(3)),
                lapTimeVariance: Number((spread / 2).toFixed(3)),
                sampleSize: 500
            };
        })
    };

    const rigorousDrivers = Array.isArray(rigorous?.drivers) ? rigorous.drivers : [];
    const pitDecision = rigorous?.pit_decision_profile;
    const volatilityIndex = (rigorous?.metadata as any)?.position_volatility_index || {};

    const topVolatility: Array<{ driverId: string; score: number }> = Object.entries(volatilityIndex as Record<string, unknown>)
        .map(([driverId, score]) => ({ driverId, score: Number(score) || 0 }))
        .sort((a: { driverId: string; score: number }, b: { driverId: string; score: number }) => b.score - a.score)
        .slice(0, 5);

    const dnfSnapshot: Array<{ driverId: string; cumulative: number }> = rigorousDrivers
        .map((d: any) => {
            const timeline = Array.isArray(d.dnf_hazard_timeline) ? d.dnf_hazard_timeline : [];
            const cumulative = timeline.reduce((acc: number, x: number) => acc + (Number(x) || 0), 0);
            return { driverId: d.driver_id, cumulative };
        })
        .sort((a: { driverId: string; cumulative: number }, b: { driverId: string; cumulative: number }) => b.cumulative - a.cumulative)
        .slice(0, 5);


    const isFallbackOrDegraded =
        driverPriorsEnvelope.validity !== 'VALID' ||
        baselineOrderEnvelope.validity !== 'VALID' ||
        podiumProbabilityEnvelope.validity !== 'VALID';

    const assumptions = [
        {
            title: 'Model Calibration Boundary',
            description: 'Baseline and intelligence panels are sourced from backend race services using deterministic priors and bounded inference.',
            source: 'backend/api/baseline.py + backend/api/intelligence.py'
        },
        {
            title: 'Full-Field Constraint',
            description: 'All 20 drivers are always requested for each intelligence run to keep baseline and podium outputs complete.',
            source: 'Frontend Intelligence page data adapter'
        }
    ];

    return (
        <PageContainer>
            <div className="space-y-4 pb-12 lg:pb-20 px-2 lg:px-0">
                <header className="border-l-4 border-[#E10600] pl-4 lg:pl-6 py-2 mb-4 lg:mb-6">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        <span className="text-[#E10600]">Race</span> Intelligence
                    </h1>
                </header>

                {isFallbackOrDegraded && (
                    <div className="mb-6 bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg flex items-start gap-3">
                        <div className="text-yellow-500 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-yellow-500 font-bold uppercase tracking-wider text-xs mb-1">Data Validity Warning</h3>
                            <p className="text-yellow-200/80 text-xs font-mono">
                                One or more intelligence streams are degraded. Backend responses are partial or unavailable for the selected context.
                            </p>
                            {rigorousUnavailable && (
                                <p className="text-yellow-200/70 text-[10px] font-mono mt-2 uppercase tracking-wider">
                                    Rigorous side-panel analytics unavailable for this context.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <RaceBriefingControls
                        selectedCircuit={selectedCircuit}
                        onCircuitChange={setSelectedCircuit}
                        selectedSession={selectedSession}
                        onSessionChange={setSelectedSession}
                        selectedCondition={selectedCondition}
                        onConditionChange={setSelectedCondition}
                    />
                </div>

                <main className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-4 lg:p-5">
                            <div className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em] mb-3">Decision // Pit Window</div>
                            {pitDecision ? (
                                <div className="space-y-2 text-xs font-mono">
                                    <div className="text-white">Optimal Lap: <span className="text-[#E10600] font-black">L{pitDecision.optimal_lap}</span></div>
                                    <div className="text-white/70">Optimal Band: L{pitDecision.confidence_bands?.optimal?.[0]}-{pitDecision.confidence_bands?.optimal?.[1]}</div>
                                    <div className="text-white/70">Viable Band: L{pitDecision.confidence_bands?.viable?.[0]}-{pitDecision.confidence_bands?.viable?.[1]}</div>
                                    <div className="text-white/50">Closed: {pitDecision.confidence_bands?.closed?.[0]}+</div>
                                </div>
                            ) : (
                                <div className="text-xs text-white/40 font-mono">Rigorous pit profile unavailable</div>
                            )}
                        </div>

                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-4 lg:p-5">
                            <div className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em] mb-3">Analytics // Volatility</div>
                            <div className="space-y-1.5 text-[11px] font-mono">
                                {topVolatility.length > 0 ? topVolatility.map((row) => (
                                    <div key={row.driverId} className="flex justify-between text-white/80">
                                        <span>{row.driverId}</span>
                                        <span>{row.score.toFixed(2)}</span>
                                    </div>
                                )) : <div className="text-white/40">No volatility data</div>}
                            </div>
                        </div>

                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-4 lg:p-5">
                            <div className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em] mb-3">Risk // DNF Hazard</div>
                            <div className="space-y-1.5 text-[11px] font-mono">
                                {dnfSnapshot.length > 0 ? dnfSnapshot.map((row: { driverId: string; cumulative: number }) => (
                                    <div key={row.driverId} className="flex justify-between text-white/80">
                                        <span>{row.driverId}</span>
                                        <span>{(row.cumulative * 100).toFixed(1)}%</span>
                                    </div>
                                )) : <div className="text-white/40">No hazard data</div>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset min-h-[360px] lg:h-[400px]">
                            <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">01 // Estimated Podium Finish</span>
                                <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: PROBABILITY %</span>
                            </div>
                            <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col">
                                <PodiumProbabilityCard envelope={podiumProbabilityEnvelope} />
                            </div>
                        </div>

                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset min-h-[360px] lg:h-[400px]">
                            <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">02 // Expected Finishing Order</span>
                                <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: DELTA LAP TIME (S)</span>
                            </div>
                            <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col">
                                <BaselineRaceOrderChart envelope={baselineOrderEnvelope} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset">
                        <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">03 // Driver Risk & Variability Priors</span>
                            <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: STOCHASTIC SIGMA</span>
                        </div>
                        <div className="p-4 lg:p-8">
                            <DriverRiskPriorsTable envelope={driverPriorsEnvelope} />
                        </div>
                    </div>


                    <section className="bg-black/20 p-4 lg:p-10 rounded-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                            <span className="text-8xl font-black text-white italic tracking-tighter uppercase">F1-26</span>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Methodology & Data Governance</h2>
                            <div className="flex-1 h-px bg-white/5"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-12">
                            <div>
                                <ModelAssumptionsAccordion assumptions={assumptions} />
                            </div>
                        </div>

                        <div className="mt-12 flex justify-center pt-8 border-t border-white/5">
                            <p className="max-w-[700px] text-center text-[10px] text-white/20 uppercase tracking-[0.2em] leading-relaxed font-mono">
                                Note: Information on this page is sourced from backend baseline and intelligence services for the selected race context.
                                For live telemetry and dynamic race strategy updates, switch to the <span className="text-white/40 font-bold decoration-[#E10600] underline underline-offset-4 cursor-pointer hover:text-white">Simulation Page</span>.
                                <br /><br />
                                Runtime: {isLoading ? 'LOADING' : 'READY'} | Backend Race ID: {raceId} | Field: {SEASON_2025_DRIVER_IDS.length} Drivers
                            </p>
                        </div>
                    </section>
                </main>
            </div>
        </PageContainer>
    );
};

export default IntelligencePage;
