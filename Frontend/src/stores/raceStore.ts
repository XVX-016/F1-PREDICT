import { create } from 'zustand';
import { DriverId, RaceContext, ReplayFrame, StrategyVariant } from '../types/race';
import { SEASON_2026_DRIVERS, SEASON_2026_SCHEDULE } from '../data/season2026';
import { SEASON_2025_SCHEDULE } from '../data/season2025';
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

const SEASON_2025_DRIVER_IDS: DriverId[] = [
    'VER', 'NOR', 'LEC', 'HAM', 'SAI', 'PIA', 'RUS', 'PER', 'ALO', 'STR',
    'GAS', 'OCO', 'ALB', 'TSU', 'HUL', 'MAG', 'BOT', 'ZHO', 'RIC', 'SAR'
];

const TRACK_LAPS: Record<string, number> = {
    albert_park: 58,
    shanghai: 56,
    suzuka: 53,
    bahrain: 57,
    jeddah: 50,
    miami: 57,
    imola: 63,
    monaco: 78,
    catalunya: 66,
    montreal: 70,
    spielberg: 71,
    silverstone: 52,
    spa: 44,
    hungaroring: 70,
    zandvoort: 72,
    monza: 53,
    baku: 51,
    marina_bay: 62,
    cota: 56,
    mexico_city: 71,
    interlagos: 71,
    las_vegas: 50,
    lusail: 57,
    yas_marina: 58,
};

function normalizeCircuitId(circuitName: string): string {
    const cleaned = circuitName
        .toLowerCase()
        .replace(/grand prix/g, '')
        .replace(/circuit/g, '')
        .replace(/autodrome|autodromo|international|street|raceway/g, '')
        .replace(/[^\w\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');

    const aliases: Record<string, string> = {
        bahrain_international: 'bahrain',
        jeddah_corniche: 'jeddah',
        suzuka: 'suzuka',
        shanghai: 'shanghai',
        albert_park: 'albert_park',
        circuit_de_monaco: 'monaco',
        red_bull_ring: 'spielberg',
        circuit_de_spafrancorchamps: 'spa',
        marina_bay: 'marina_bay',
        circuit_of_the_americas: 'cota',
        autdromo_hermanos_rodrguez: 'mexico_city',
        autodromo_hermanos_rodriguez: 'mexico_city',
        interlagos: 'interlagos',
        las_vegas_strip: 'las_vegas',
        lusail: 'lusail',
        yas_marina: 'yas_marina'
    };
    return aliases[cleaned] || cleaned;
}

function getDriversForSeason(season: number): DriverId[] {
    if (season === 2026) {
        return SEASON_2026_DRIVERS.map(d => d.id.toUpperCase());
    }
    return SEASON_2025_DRIVER_IDS;
}

function getBaseRaceContext(season: number, round: number): RaceContext {
    const schedule = season === 2026 ? SEASON_2026_SCHEDULE : SEASON_2025_SCHEDULE;
    const race = schedule.find(r => r.round === round) || schedule[0];
    const circuitId = normalizeCircuitId(race?.circuit || 'albert_park');
    return {
        season,
        round: race?.round || 1,
        raceName: race?.raceName || 'Australian Grand Prix',
        circuitId,
        totalLaps: TRACK_LAPS[circuitId] || 58
    };
}

export const useRaceStore = create<RaceStoreState>((set, get) => ({
    // Defaults
    mode: "SIMULATION",
    context: getBaseRaceContext(2026, 1),
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

    selectedDriverId: null,
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

    togglePlay: () => set((state) => {
        const totalLaps = state.simulationResult?.meta.totalLaps ?? state.context?.totalLaps ?? 58;
        const shouldRestart = !state.isPlaying && state.currentLap >= totalLaps;
        return {
            isPlaying: !state.isPlaying,
            currentLap: shouldRestart ? 1 : state.currentLap
        };
    }),
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
            const season = context?.season ?? 2026;
            const drivers = getDriversForSeason(season);
            const totalLaps = context?.totalLaps ?? 58;
            const baseSCProb = config.enableSafetyCar ? config.scProbability : 0;

            const baseConfig: SimConfig = {
                circuit: context?.circuitId ?? 'albert_park',
                totalLaps,
                drivers,
                strategies: drivers.map((driverId, idx) => ({
                    driverId,
                    pitLaps: idx % 2 === 0
                        ? [Math.floor(totalLaps * 0.35), Math.floor(totalLaps * 0.7)]
                        : [Math.floor(totalLaps * 0.4), Math.floor(totalLaps * 0.75)],
                    tyreSequence: ['MEDIUM', 'HARD', 'SOFT'] as TyreCompound[]
                })),
                baseLapTime: Object.fromEntries(
                    drivers.map((id, idx) => [id, 81000 + idx * 85]) // compact full-field spread
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
                selectedDriverId: drivers[0] || null
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
