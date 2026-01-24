

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ProbabilityResponse {
    race_id: string;
    probabilities: Record<string, {
        win_prob: number;
        podium_prob: number;
        top10_prob: number;
    }>;
}

export interface MarketEntry {
    race_id: string;
    driver_id: string;
    driver_name: string;
    probability: number;
    odds: number;
    market_type: string;
}

export interface MarketResponse {
    race_id: string;
    markets: MarketEntry[];
}

// Utility: Check if Backend is reachable
let isBackendAvailable = true;

// Mock Data Generators (Minimal)
const MOCK_PROBABILITIES: ProbabilityResponse = {
    race_id: "local-fallback",
    probabilities: {
        "VER": { win_prob: 0.45, podium_prob: 0.85, top10_prob: 0.99 },
        "NOR": { win_prob: 0.30, podium_prob: 0.75, top10_prob: 0.95 },
        "LEC": { win_prob: 0.15, podium_prob: 0.60, top10_prob: 0.90 },
        "HAM": { win_prob: 0.05, podium_prob: 0.40, top10_prob: 0.85 },
    }
};

const safeFetch = async (url: string, options?: RequestInit, fallback?: any) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        isBackendAvailable = true;
        return await response.json();
    } catch (error) {
        console.warn(`Backend unreachable (${url}). Using fallback data.`);
        isBackendAvailable = false;
        if (fallback) return fallback;
        throw error; // Re-throw if no fallback provided
    }
};

export const api = {
    getStatus: () => isBackendAvailable,

    getDriverTelemetry: async (driverId: string, raceId?: string) => {
        const url = new URL(`${API_BASE_URL}/api/drivers/${driverId}/telemetry-summary`);
        if (raceId) url.searchParams.append('race_id', raceId);

        return safeFetch(url.toString(), undefined, {
            summary: "Backend Offline - Mock Data",
            laps: []
        });
    },

    getProbabilities: async (raceId: string): Promise<ProbabilityResponse> => {
        return safeFetch(`${API_BASE_URL}/api/races/${raceId}/probabilities`, undefined, MOCK_PROBABILITIES);
    },

    getMarkets: async (raceId: string): Promise<MarketResponse> => {
        return safeFetch(`${API_BASE_URL}/api/races/${raceId}/markets`, undefined, {
            race_id: raceId,
            markets: []
        });
    },

    simulateRace: async (raceId: string, params: any): Promise<any> => {
<<<<<<< HEAD
        // Map camelCase to snake_case for Python Backend
        const backendParams = {
            tyre_deg_multiplier: params.tyreDegMultiplier,
            sc_probability: params.scProbability,
            strategy_aggression: params.strategyAggression,
            weather_scenario: params.weatherScenario,
            grid_source: params.gridSource,
            seed: params.seed,
            iterations: params.iterations // if present
        };

        const response = await fetch(`${API_BASE_URL}/api/races/${raceId}/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendParams),
=======
        return safeFetch(`${API_BASE_URL}/api/races/${raceId}/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        }, {
            // Mock simulation result structure
            meta: { totalLaps: 58, circuit: "albert_park" },
            baseline: { drivers: {}, safetyCarLaps: [] }
>>>>>>> feature/redis-telemetry-replay
        });
    },

    getLiveUpdates: (raceId: string, onMessage: (data: any) => void) => {
        try {
            const eventSource = new EventSource(`${API_BASE_URL}/api/live/${raceId}`);
            eventSource.onmessage = (event) => {
                onMessage(JSON.parse(event.data));
            };
            eventSource.onerror = (error) => {
                console.warn('SSE Disconnected (Backend likely offline)');
                eventSource.close();
            };
            return () => eventSource.close();
        } catch (e) {
            console.warn("SSE Setup Failed");
            return () => { };
        }
    }
};
