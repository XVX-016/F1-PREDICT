import { create } from 'zustand';
import { DriverId, RaceContext, ReplayFrame, StrategyVariant } from '../types/race';
import {
    SimulationResult,
    SimulationConfig as SimConfig,
    runWithCounterfactual,
    TyreCompound
} from '../sim';

export type SimulationState = "empty" | "sample" | "running" | "complete" | "error";
export type DataSource = "sample" | "simulation";

// UI-facing config (maps to SimConfig internally)
export interface UISimulationConfig {
    tyreDegMultiplier: number;
    fuelBurnMultiplier: number;
    scProbability: number;
    weatherVariance: number;
    enableSafetyCar: boolean;
    useMLResiduals: boolean;
}

export interface RaceStoreState {
    // Mode & Context
    mode: "REPLAY" | "SIMULATION";
    context: RaceContext | null;
    config: UISimulationConfig;

    // Simulation State Machine
    simulationState: SimulationState;
    dataSource: DataSource;

    // NEW: Frozen simulation result from deterministic simulator
    simulationResult: SimulationResult | null;

    // Playback State
    currentLap: number;
    currentTime: number;
    isPlaying: boolean;
    playbackSpeed: number;

    // Selection State
    selectedDriverId: DriverId | null;
    selectedStrategyId: string | null;

    // Legacy: Data Store (kept for backward compatibility)
    replayFrames: Record<number, ReplayFrame>;
    currentFrame: ReplayFrame | null;

    // Actions
    setMode: (mode: "REPLAY" | "SIMULATION") => void;
    loadRaceContext: (ctx: RaceContext) => void;
    updateConfig: (patch: Partial<UISimulationConfig>) => void;

    setCursor: (lap: number) => void;
    togglePlay: () => void;
    setPlaybackSpeed: (speed: number) => void;

    selectDriver: (id: DriverId | null) => void;
    selectStrategy: (id: string | null) => void;

    ingestFrame: (frame: ReplayFrame) => void;
    runSimulation: () => void;
    computeCounterfactual: (strategy: StrategyVariant) => Promise<void>;
}

export const useRaceStore = create<RaceStoreState>((set, get) => ({
    // Defaults
    mode: "SIMULATION",
    context: {
        season: 2026,
        round: 1,
        raceName: "Australian Grand Prix",
        circuitId: "albert_park",
        totalLaps: 58
    },
    config: {
        tyreDegMultiplier: 1.0,
        fuelBurnMultiplier: 1.0,
        scProbability: 0.02,
        weatherVariance: 0.2,
        enableSafetyCar: true,
        useMLResiduals: false,
    },

    // Initial State: Empty (no fake data)
    simulationState: "empty",
    dataSource: "simulation",
    simulationResult: null,

    currentLap: 1,
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,

    selectedDriverId: "VER",
    selectedStrategyId: null,

    // Legacy
    replayFrames: {},
    currentFrame: null,

    // Actions
    setMode: (mode) => set({ mode }),
    loadRaceContext: (ctx) => set({ context: ctx }),
    updateConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),

    setCursor: (lap) => {
        const state = get();
        const totalLaps = state.simulationResult?.meta.totalLaps ?? state.context?.totalLaps ?? 58;
        const safeLap = Math.max(1, Math.min(lap, totalLaps));
        set({
            currentLap: safeLap,
            // Pause when manually scrubbing
            isPlaying: false
        });
    },

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    selectDriver: (id) => set({ selectedDriverId: id }),
    selectStrategy: (id) => set({ selectedStrategyId: id }),

    ingestFrame: (frame) => set((state) => {
        const newFrames = { ...state.replayFrames, [frame.lap]: frame };
        return { replayFrames: newFrames };
    }),

    /**
     * Run simulation with counterfactual comparison
     * 
     * Phase 2A: Baseline vs Counterfactual (same seed, one parameter change)
     * Results are FROZEN and immutable.
     */
    runSimulation: () => {
        const { config, context } = get();

        set({ simulationState: "running", isPlaying: false });

        try {
            // Build baseline simulation config from UI config
            const drivers = ['VER', 'NOR', 'LEC', 'HAM', 'SAI', 'PIA', 'RUS', 'PER'];
            const totalLaps = context?.totalLaps ?? 58;
            const baseSCProb = config.enableSafetyCar ? config.scProbability : 0;

            const baseConfig: SimConfig = {
                circuit: context?.circuitId ?? 'albert_park',
                totalLaps,
                drivers,
                strategies: drivers.map((driverId, idx) => ({
                    driverId,
                    pitLaps: idx % 2 === 0 ? [Math.floor(totalLaps * 0.35), Math.floor(totalLaps * 0.7)]
                        : [Math.floor(totalLaps * 0.4), Math.floor(totalLaps * 0.75)],
                    tyreSequence: ['MEDIUM', 'HARD', 'SOFT'] as TyreCompound[]
                })),
                baseLapTime: Object.fromEntries(
                    drivers.map((id, idx) => [id, 81000 + idx * 120]) // VER fastest
                ),
                pitLossSeconds: 2.5,
                hazardConfig: {
                    safetyCarProb: baseSCProb,
                    dnfProb: 0.001
                },
                tyreDegMultiplier: config.tyreDegMultiplier,
                fuelBurnMultiplier: config.fuelBurnMultiplier,
                seed: Date.now(),
                runs: 1
            };

            // Run with counterfactual: +50% SC probability
            const result = runWithCounterfactual(
                baseConfig,
                {
                    hazardConfig: {
                        ...baseConfig.hazardConfig,
                        safetyCarProb: baseSCProb * 1.5
                    }
                },
                "SC Prob +50%"
            );

            set({
                simulationResult: result,
                simulationState: "complete",
                dataSource: "simulation",
                currentLap: 1,
                isPlaying: true,
                selectedDriverId: "VER"
            });
        } catch (error) {
            console.error("Simulation failed:", error);
            set({ simulationState: "error" });
        }
    },

    computeCounterfactual: async (strategy) => {
        console.log("Computing counterfactual for:", strategy);
        // Phase 2 implementation
    }
}));
