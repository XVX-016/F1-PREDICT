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
    PitStopTimeline,
    StrategyTimeline
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
                    <div className="bg-[#141821] border-b border-white/10 p-6">
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                            <span className="text-[#E10600]">Race</span> Simulation
                        </h1>
                        <p className="text-[10px] text-white/50 font-mono uppercase tracking-[0.2em] mt-1">
                            Deterministic Physics & Monte Carlo Engine
                        </p>
                    </div>

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
                                    <StrategyTimeline />
                                </Tab>
                            </div>
                        </div>
                    </SimulationViewport>
                </SimulationMain>

            </SimulationLayout>
        </SimulationProvider>
    );
}
