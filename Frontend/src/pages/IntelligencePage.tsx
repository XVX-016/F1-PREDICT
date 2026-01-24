import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import RaceBriefingControls from '../components/intelligence/RaceBriefingControls';
import DriverRiskPriorsTable from '../components/intelligence/DriverRiskPriorsTable';
import SCHazardChart from '../components/charts/SCHazardChart';
import BaselineRaceOrderChart from '../components/intelligence/BaselineRaceOrderChart';
import PodiumProbabilityCard from '../components/intelligence/PodiumProbabilityCard';
import SupportingPriorsSection from '../components/intelligence/SupportingPriorsSection';
import ModelAssumptionsAccordion from '../components/intelligence/ModelAssumptionsAccordion';
import { useRaceBriefingData } from '../hooks/useRaceBriefingData';

/**
 * Intelligence Page (Research-Grade)
 * Professional Race Briefing dashboard with strict data contracts and provenance.
 */
const IntelligencePage = () => {
    // Global State for context
    const [selectedCircuit, setSelectedCircuit] = useState('Japanese Grand Prix');
    const [selectedSession, setSelectedSession] = useState<'RACE' | 'SPRINT'>('RACE');
    const [selectedCondition, setSelectedCondition] = useState<'DRY' | 'INTERMEDIATE' | 'WET'>('DRY');

    const {
        driverPriorsEnvelope,
        scHazardEnvelope,
        baselineOrderEnvelope,
        podiumProbabilityEnvelope,
        supportingPriorsEnvelope
    } = useRaceBriefingData({
        circuitId: selectedCircuit,
        session: selectedSession,
        trackCondition: selectedCondition
    });

    const assumptions = [
        {
            title: 'Model Calibration Boundary',
            description: 'Algorithms assume 2026 standard aerodynamic payloads. Ground-effect sensitivity is calculated at 250mm ride height.',
            source: 'FIA Technical Regs v4.2'
        },
        {
            title: 'Risk & Outcome Modeling',
            description: 'Podium probabilities are derived from 10,000 Monte Carlo runs using pace Δ and lap variance σ, adjusted for Safety Car chaos factors.',
            source: 'Race Operations Research'
        }
    ];

    return (
        <PageContainer>
            <div className="space-y-8 pb-20">
                {/* Header Section */}
                <header className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="relative">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                                <span className="text-[#E10600]">Race</span> Intelligence
                            </h1>
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="h-0.5 w-12 bg-[#E10600]"></span>
                                    <p className="text-[10px] text-white/50 font-mono uppercase tracking-[0.4em]">Priors & Performance Briefing</p>
                                </div>
                                <p className="text-[9px] text-[#E10600]/60 uppercase tracking-widest font-black italic">
                                    "All metrics are conditioned on selected circuit and session."
                                </p>
                            </div>
                        </div>
                    </div>

                    <RaceBriefingControls
                        selectedCircuit={selectedCircuit}
                        onCircuitChange={setSelectedCircuit}
                        selectedSession={selectedSession}
                        onSessionChange={setSelectedSession}
                        selectedCondition={selectedCondition}
                        onConditionChange={setSelectedCondition}
                    />
                </header>

                <main className="space-y-12">
                    {/* Primary Grid: Reference Table vs Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Reference: Driver Risk Priors (Full Grid) */}
                        <div className="space-y-8">
                            <DriverRiskPriorsTable envelope={driverPriorsEnvelope} />
                            <PodiumProbabilityCard envelope={podiumProbabilityEnvelope} />
                        </div>

                        {/* Analysis: Hazard & Pace */}
                        <div className="space-y-8">
                            <SCHazardChart envelope={scHazardEnvelope} />
                            <BaselineRaceOrderChart envelope={baselineOrderEnvelope} />
                        </div>
                    </div>

                    {/* Section: Auxiliary Priors */}
                    <SupportingPriorsSection envelope={supportingPriorsEnvelope} />

                    {/* Section: Methodology & Assumptions */}
                    <section className="bg-black/20 p-10 rounded-2xl border border-white/5 relative overflow-hidden">
                        {/* Subtle Background Mark */}
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
                                Note: Information on this page is derived solely from historical distributions and pre-race simulation passes.
                                For live telemetry and dynamic race strategy updates, switch to the <span className="text-white/40 font-bold decoration-[#E10600] underline underline-offset-4 cursor-pointer hover:text-white">Simulation Page</span>.
                                <br /><br />
                                System Version: 2.0.26-ALPHA | Kernel: Monte-Carlo | Accuracy: ±1.2σ
                            </p>
                        </div>
                    </section>
                </main>
            </div>
        </PageContainer>
    );
};

export default IntelligencePage;
