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
            try {
                // Determine if we should hit local or production
                const url = `${API_BASE_URL}/api/race-status`;
                const response = await fetch(url);
                if (!response.ok) {
                    if (response.status === 404) {
                        console.warn(`Race status endpoint 404 at ${url}. Running in Demo Mode.`);
                    }
                    throw new Error('Network response was not ok');
                }
                return await response.json();
            } catch (error) {
                // Return fallback status if backend offline
                return {
                    raceId: "offline-demo",
                    name: "F1 PREDICT DEMO",
                    round: 1,
                    session: "PRE-SEASON",
                    status: "UPCOMING",
                    trackTemp: "28.5",
                    airTemp: "22.3",
                    humidity: "45",
                    windSpeed: "12.4",
                    nextSessionTime: new Date(Date.now() + 86400000).toISOString()
                } as RaceStatus;
            }
        },
        refetchInterval: 30000, // Increase interval in demo mode to reduce noise
        staleTime: 10000,
        retry: false
    });
};
