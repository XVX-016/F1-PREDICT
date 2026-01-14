import { create } from 'zustand';

export interface DriverTelemetry {
    gap: number;
    tyre_age: number;
    compound: string;
    last_lap: string;
    delta?: number;
    position?: number;
}

export interface RaceState {
    lap: number;
    track_status: string;
    weather: string;
    sc_probability: number;
}

export interface TelemetrySnapshot {
    state: RaceState;
    drivers: Record<string, DriverTelemetry>;
    timestamp: string | number;
}

interface TelemetryStore {
    // Data State
    raceId: string | null;
    snapshot: TelemetrySnapshot | null;
    lastUpdate: number;

    // Connection State
    isConnected: boolean;
    error: string | null;

    // Actions
    setRaceId: (id: string) => void;
    updateSnapshot: (data: TelemetrySnapshot) => void;
    setConnectionStatus: (connected: boolean, error?: string | null) => void;
}

export const useTelemetryStore = create<TelemetryStore>((set) => ({
    raceId: null,
    snapshot: null,
    lastUpdate: 0,
    isConnected: false,
    error: null,

    setRaceId: (id) => set({ raceId: id }),
    updateSnapshot: (data) => set({
        snapshot: data,
        lastUpdate: Date.now()
    }),
    setConnectionStatus: (connected, error = null) => set({
        isConnected: connected,
        error
    }),
}));
