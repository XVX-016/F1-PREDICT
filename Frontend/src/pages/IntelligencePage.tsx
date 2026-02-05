import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import RaceBriefingControls from '../components/intelligence/RaceBriefingControls';
import DriverRiskPriorsTable from '../components/intelligence/DriverRiskPriorsTable';
// Removed SCHazardChart for shipping phase stability
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
                <header className="border-l-4 border-[#E10600] pl-6 py-2 mb-12">
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        <span className="text-[#E10600]">Race</span> Intelligence
                    </h1>
                </header>
                <div className="mb-12">
                    <RaceBriefingControls
                        selectedCircuit={selectedCircuit}
                        onCircuitChange={setSelectedCircuit}
                        selectedSession={selectedSession}
                        onSessionChange={setSelectedSession}
                        selectedCondition={selectedCondition}
                        onConditionChange={setSelectedCondition}
                    />
                </div>

                <main className="space-y-12">
                    {/* Primary Grid: Podium & Baseline first */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                            <PodiumProbabilityCard envelope={podiumProbabilityEnvelope} />
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                            <BaselineRaceOrderChart envelope={baselineOrderEnvelope} />
                        </div>
                    </div>

                    {/* Detailed Risk Stats - Moved Down */}
                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden px-8 py-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Driver Risk Priors</h2>
                            <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] mt-1">Stochastic Outcome Distribution</p>
                        </div>
                        <DriverRiskPriorsTable envelope={driverPriorsEnvelope} />
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
