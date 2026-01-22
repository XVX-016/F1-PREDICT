import { create } from 'zustand';
import { DriverId, DriverState, RaceContext, ReplayFrame, SimulationConfig, StrategyVariant } from '../types/race';

interface RaceStoreState {
    // 1. Context & Config (Inputs)
    mode: "LIVE" | "REPLAY" | "SIMULATION";
    context: RaceContext | null;
    config: SimulationConfig;

    // 2. Playback State (Cursor)
    currentLap: number;
    currentTime: number; // Seconds
    isPlaying: boolean;
    playbackSpeed: number; // 1x, 2x, etc.

    // 3. Selection State (UI)
    selectedDriverId: DriverId | null;
    selectedStrategyId: string | null;

    // 4. Data (The Truth)
    // Frames are indexed by [lap] for O(1) access during replay
    replayFrames: Record<number, ReplayFrame>;

    // Derived state for the CURRENT cursor
    currentFrame: ReplayFrame | null;

    // Simulation Results (if in SIMULATION mode)
    simulationResults: {
        strategies: StrategyVariant[];
        winProbabilities: Record<DriverId, number>;
    } | null;

    // Actions
    setMode: (mode: "LIVE" | "REPLAY" | "SIMULATION") => void;
    loadRaceContext: (ctx: RaceContext) => void;
    updateConfig: (patch: Partial<SimulationConfig>) => void;

    // Playback Actions
    setCursor: (lap: number) => void;
    togglePlay: () => void;
    setPlaybackSpeed: (speed: number) => void;

    // Selection Actions
    selectDriver: (id: DriverId | null) => void;
    selectStrategy: (id: string | null) => void;

    // Data Ingestion
    ingestFrame: (frame: ReplayFrame) => void;

    // Computed Actions
    runSimulation: () => Promise<void>; // Triggers backend calc
    computeCounterfactual: (strategy: StrategyVariant) => Promise<void>;
}

export const useRaceStore = create<RaceStoreState>((set, get) => ({
    // Defaults
    mode: "REPLAY",
    context: null,
    config: {
        tyreDegMultiplier: 1.0,
        fuelBurnMultiplier: 1.0,
        scProbability: 0.15,
        weatherVariance: 0.2,
        enableSafetyCar: true,
        useMLResiduals: false,
    },

    currentLap: 1,
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,

    selectedDriverId: null,
    selectedStrategyId: null,

    replayFrames: {},
    currentFrame: null,
    simulationResults: null,

    // Actions implementation
    setMode: (mode) => set({ mode }),
    loadRaceContext: (ctx) => set({ context: ctx }),
    updateConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),

    setCursor: (lap) => {
        const state = get();
        // Clamp lap
        const safeLap = Math.max(1, Math.min(lap, state.context?.totalLaps || 70));

        set({
            currentLap: safeLap,
            currentFrame: state.replayFrames[safeLap] || null
        });
    },

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    selectDriver: (id) => set({ selectedDriverId: id }),
    selectStrategy: (id) => set({ selectedStrategyId: id }),

    ingestFrame: (frame) => set((state) => {
        const newFrames = { ...state.replayFrames, [frame.lap]: frame };
        // If we are currently ON this lap, update currentFrame too
        const currentFrame = state.currentLap === frame.lap ? frame : state.currentFrame;
        return { replayFrames: newFrames, currentFrame };
    }),

    runSimulation: async () => {
        const { config } = get();
        console.log("Running simulation with config:", config);

        // TEMPORARY: Ingest some dummy frames to verify charts if no backend connected yet
        // This is strictly for verifying the D3 chart integration as requested (Step C)
        // In real implementation, this would fetch from /api/simulation

        const drivers = ["VER", "NOR", "LEC", "HAM", "SAI"];
        const frames: Record<number, ReplayFrame> = {};

        // Generate 50 laps of data
        for (let i = 1; i <= 50; i++) {
            const frameDrivers: Record<DriverId, DriverState> = {};

            drivers.forEach((did, idx) => {
                // Use consistent but varying data
                const basePace = 90000 + (idx * 200); // 90s base
                const variance = Math.sin(i / 5) * 500;
                const pace = basePace + variance + (Math.random() * 200);

                frameDrivers[did] = {
                    driverId: did,
                    name: did,
                    teamId: "Red Bull Racing", // simplified
                    lap: i,
                    position: idx + 1,
                    gapToLeader: idx * 2.5 + (i * 0.1),
                    tyre: { compound: "MEDIUM", ageLaps: i, wearPct: i * 1.5, degRateMsPerLap: 0.1 },
                    fuel: { remainingKg: 100 - i, burnRateKgPerLap: 1.5 },
                    pace: {
                        p50Ms: pace,
                        p05Ms: pace - 400,
                        p95Ms: pace + 400
                    },
                    status: "ON_TRACK"
                };
            });

            frames[i] = {
                lap: i,
                timeOffset: i * 90,
                drivers: frameDrivers,
                weather: { trackTemp: 30, airTemp: 25, rainIntensity: 0 },
                safetyCarStatus: "NONE"
            };
        }

        set({
            replayFrames: frames,
            currentLap: 1,
            currentFrame: frames[1],
            context: {
                season: 2024,
                round: 4,
                raceName: "Japanese Grand Prix",
                circuitId: "suzuka",
                totalLaps: 50
            },
            isPlaying: true // Auto-start replay to see charts move
        });
    },

    computeCounterfactual: async (strategy) => {
        console.log("Computing counterfactual for:", strategy);
    }
}));
