import {
    SimulationProvider,
    SimulationLayout,
    SimulationSidebar,
    SidebarSection,
    SeasonSelect,
    RaceSelect,
    TrackInfoBadge,
    DriverSelector,
    TyreDegMultiplier,
    FuelBurnRate,
    SafetyCarProbability,
    WeatherVariance,
    PitStrategyEditor,
    DisableSafetyCarToggle,
    OverrideGridPositions,
    SimulationMain,
    SimulationControlBar,
    RunSimulationButton,
    ReplayToggle,
    ResetSimulationButton,
    PlaybackSpeedSlider,
    AdvancedSettings,
    SimulationStatusIndicator,
    ReplayTimeline,
    LapScrubber,
    TimeScrubber,
    SimulationViewport,
    LapTimeChart,
    GapToLeaderChart
} from './SimulationPage.components';
import SafetyCarTimelineChart from '../components/charts/SafetyCarTimelineChart';

import { useState } from 'react';

export default function SimulationPage() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <SimulationProvider>
            <div className="px-4 lg:px-6 pt-20 lg:pt-24 pb-4 lg:pb-6 border-b border-white/5 bg-black/40 relative z-10">
                <header className="border-l-4 border-[#E10600] pl-4 lg:pl-6 py-1">
                    <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase italic">
                        <span className="text-[#E10600]">Race</span> Simulation
                    </h1>
                </header>
            </div>
            <SimulationLayout>

                {/* ─────────────────────────────
           LEFT PANEL — INPUTS
        ───────────────────────────── */}
                <SimulationSidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(v => !v)}
                >
                    <SidebarSection title="Race Context" isFirst>
                        <SeasonSelect />
                        <RaceSelect />
                        <TrackInfoBadge />
                        <div className="mt-4">
                            <DriverSelector />
                        </div>
                    </SidebarSection>

                    <SidebarSection title="Simulation Parameters">
                        <TyreDegMultiplier />
                        <FuelBurnRate />
                        <SafetyCarProbability />
                        <AdvancedSettings>
                            <WeatherVariance />
                            <PitStrategyEditor />
                            <DisableSafetyCarToggle />
                            <OverrideGridPositions />
                        </AdvancedSettings>
                    </SidebarSection>
                </SimulationSidebar>

                {/* ─────────────────────────────
           MAIN PANEL — RUN + OUTPUT
        ───────────────────────────── */}
                <SimulationMain>

                    <SimulationControlBar>
                        <RunSimulationButton />
                        <ReplayToggle />
                        <PlaybackSpeedSlider />
                        <ResetSimulationButton />
                        <SimulationStatusIndicator />
                    </SimulationControlBar>

                    <ReplayTimeline>
                        <LapScrubber />
                        <TimeScrubber />
                    </ReplayTimeline>

                    <SimulationViewport>
                        <div className="p-4 lg:p-6 pt-24 lg:pt-40">
                            {/* CORE ANALYSIS: PACE & GAPS */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                <div className="h-[380px] lg:h-[500px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset">
                                    <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">01 // Lap Pace (Baseline vs Counterfactual)</span>
                                        <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: MS / LAP</span>
                                    </div>
                                    <div className="flex-1 p-6">
                                        <LapTimeChart />
                                    </div>
                                </div>

                                <div className="h-[380px] lg:h-[500px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset">
                                    <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">02 // Field Compression (Gap to Leader)</span>
                                        <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: SEC / GAP</span>
                                    </div>
                                    <div className="flex-1 p-6">
                                        <GapToLeaderChart />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 h-[260px] lg:h-[320px] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5 ring-inset">
                                <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em]">03 // Safety Car Timeline</span>
                                    <span className="text-[9px] text-white/40 font-mono italic uppercase tracking-wider">UNIT: LAP STATE</span>
                                </div>
                                <div className="flex-1 p-4 lg:p-6">
                                    <SafetyCarTimelineChart />
                                </div>
                            </div>

                        </div>
                    </SimulationViewport>
                </SimulationMain>

            </SimulationLayout>

            {/* Footer Disclaimer - True Page Centered */}
            <div className="mt-16 lg:mt-48 pb-16 lg:pb-32 flex flex-col items-center justify-center">
                <div className="h-px w-full max-w-7xl bg-white/10 mb-16" />
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] leading-relaxed font-mono text-center max-w-2xl px-8">
                    Physics Sandbox: These charts reflect deterministic trajectories under selected parameters.
                    Probabilistic aggregates (Win %, Podium Likelihood) are restricted to the <span className="text-white/40 font-bold decoration-[#E10600] underline underline-offset-4 cursor-pointer hover:text-white" onClick={() => (window.location.hash = '/intelligence')}>Intelligence Page</span>.
                </p>
            </div>
        </SimulationProvider>
    );
}
