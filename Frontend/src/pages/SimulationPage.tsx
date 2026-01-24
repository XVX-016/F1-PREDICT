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
    Tab,
    RacePositionChart,
    LapTimeChart,
    GapToLeaderChart,
    PitStopTimeline
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
                        <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                            {/* TOP ROW: POSITIONS + PACE */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-[400px] shrink-0">
                                <Tab id="positions" label="Race Positions">
                                    <RacePositionChart />
                                </Tab>
                                <Tab id="pace" label="Lap Pace">
                                    <LapTimeChart />
                                </Tab>
                            </div>

                            {/* BOTTOM ROW: GAPS + STRATEGY */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] shrink-0">
                                <Tab id="gaps" label="Gaps">
                                    <GapToLeaderChart />
                                </Tab>
                                <Tab id="strategy" label="Strategy">
                                    <PitStopTimeline />
                                </Tab>
                            </div>
                        </div>
                    </SimulationViewport>
                </SimulationMain>

            </SimulationLayout>
        </SimulationProvider>
    );
}
