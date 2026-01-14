

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

export const api = {
    getDriverTelemetry: async (driverId: string, raceId?: string) => {
        const url = new URL(`${API_BASE_URL}/api/drivers/${driverId}/telemetry-summary`);
        if (raceId) url.searchParams.append('race_id', raceId);
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch driver telemetry');
        return response.json();
    },

    getProbabilities: async (raceId: string): Promise<ProbabilityResponse> => {
        const response = await fetch(`${API_BASE_URL}/api/race/${raceId}/probabilities`);
        if (!response.ok) throw new Error('Failed to fetch race probabilities');
        return response.json();
    },

    getMarkets: async (raceId: string): Promise<MarketResponse> => {
        const response = await fetch(`${API_BASE_URL}/api/race/${raceId}/markets`);
        if (!response.ok) throw new Error('Failed to fetch race markets');
        return response.json();
    },

    getLiveUpdates: (raceId: string, onMessage: (data: any) => void) => {
        const eventSource = new EventSource(`${API_BASE_URL}/api/live/${raceId}`);
        eventSource.onmessage = (event) => {
            onMessage(JSON.parse(event.data));
        };
        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            eventSource.close();
        };
        return () => eventSource.close();
    }
};
