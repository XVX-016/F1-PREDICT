import React from 'react';
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
    FastF1Status,
    RedisReplayStatus,
    SimulationMain,
    SimulationControlBar,
    RunSimulationButton,
    ReplayToggle,
    ResetSimulationButton,
    SimulationStatusIndicator,
    ReplayTimeline,
    LapScrubber,
    TimeScrubber,
    SimulationViewport,
    ViewportTabs,
    Tab,
    RacePositionChart,
    LapTimeChart,
    GapToLeaderChart,
    PitStopTimeline,
    SimulationInspector,
    InspectorTabs,
    RaceOutcomeTable,
    PodiumPrediction,
    CounterfactualDeltaTable,
    WhatChangedExplanation,
    PhysicsVsMLChart,
    ResidualErrorStats,
    SimulationStateJSON
} from './SimulationPage.components';

export default function SimulationPage() {
    return (
        <SimulationProvider>
            <SimulationLayout>

                {/* ─────────────────────────────
           LEFT PANEL — INPUTS
        ───────────────────────────── */}
                <SimulationSidebar>

                    <SidebarSection title="Race Context">
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
                        <WeatherVariance />
                    </SidebarSection>

                    <SidebarSection title="Counterfactuals">
                        <PitStrategyEditor />
                        <DisableSafetyCarToggle />
                        <OverrideGridPositions />
                    </SidebarSection>

                    <SidebarSection title="Data Sources">
                        <FastF1Status />
                        <RedisReplayStatus />
                    </SidebarSection>

                </SimulationSidebar>

                {/* ─────────────────────────────
           MAIN PANEL — RUN + OUTPUT
        ───────────────────────────── */}
                <SimulationMain>

                    {/* CONTROL BAR */}
                    <SimulationControlBar>
                        <RunSimulationButton />
                        <ReplayToggle />
                        <ResetSimulationButton />
                        <SimulationStatusIndicator />
                    </SimulationControlBar>

                    {/* TIMELINE / SCRUBBER */}
                    <ReplayTimeline>
                        <LapScrubber />
                        <TimeScrubber />
                    </ReplayTimeline>

                    {/* CORE VISUAL OUTPUT */}
                    <SimulationViewport>

                        <ViewportTabs>

                            <Tab id="positions" label="Race Positions">
                                <RacePositionChart />
                            </Tab>

                            <Tab id="pace" label="Lap Pace">
                                <LapTimeChart />
                            </Tab>

                            <Tab id="gaps" label="Gaps">
                                <GapToLeaderChart />
                            </Tab>

                            <Tab id="strategy" label="Strategy">
                                <PitStopTimeline />
                            </Tab>

                        </ViewportTabs>

                    </SimulationViewport>

                </SimulationMain>

                {/* ─────────────────────────────
           RIGHT PANEL — ANALYSIS
        ───────────────────────────── */}
                <SimulationInspector>

                    <InspectorTabs>

                        <Tab id="summary" label="Summary">
                            <RaceOutcomeTable />
                            <PodiumPrediction />
                        </Tab>

                        <Tab id="delta" label="Counterfactual Δ">
                            <CounterfactualDeltaTable />
                            <WhatChangedExplanation />
                        </Tab>

                        <Tab id="residuals" label="ML Residuals">
                            <PhysicsVsMLChart />
                            <ResidualErrorStats />
                        </Tab>

                        <Tab id="raw" label="Raw State">
                            <SimulationStateJSON />
                        </Tab>

                    </InspectorTabs>

                </SimulationInspector>

            </SimulationLayout>
        </SimulationProvider>
    );
}
