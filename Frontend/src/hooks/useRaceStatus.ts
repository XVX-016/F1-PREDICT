import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface RaceStatus {
    raceId: string;
    name: string;
    round: number;
    session: string;
    status: 'LIVE' | 'UPCOMING' | 'COMPLETED';
    trackTemp: string;
    airTemp: string;
    humidity: string;
    windSpeed: string;
    nextSessionTime: string;
}

export const useRaceStatus = () => {
    return useQuery<RaceStatus>({
        queryKey: ['raceStatus'],
        queryFn: async () => {
            const statusUrl = `${API_BASE_URL}/api/race-status`;
            const response = await fetch(statusUrl);
            if (response.ok) {
                return await response.json();
            }

            // Backend might still be healthy even if race-status endpoint is missing/misconfigured.
            const healthUrl = `${API_BASE_URL}/health`;
            const healthRes = await fetch(healthUrl);
            if (healthRes.ok) {
                return {
                    raceId: "backend-online",
                    name: "Backend Online",
                    round: 0,
                    session: "N/A",
                    status: "UPCOMING",
                    trackTemp: "N/A",
                    airTemp: "N/A",
                    humidity: "N/A",
                    windSpeed: "N/A",
                    nextSessionTime: new Date().toISOString()
                } as RaceStatus;
            }

            throw new Error(`Race status unavailable (${response.status})`);
        },
        refetchInterval: 30000, // Increase interval in demo mode to reduce noise
        staleTime: 10000,
        retry: false
    });
};
