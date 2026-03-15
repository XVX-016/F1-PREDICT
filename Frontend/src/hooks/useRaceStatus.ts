import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASES = (() => {
    const primary = API_BASE_URL.replace(/\/$/, '');
    const out = [primary];
    if (primary.includes('localhost')) out.push(primary.replace('localhost', '127.0.0.1'));
    if (primary.includes('127.0.0.1')) out.push(primary.replace('127.0.0.1', 'localhost'));
    return Array.from(new Set(out));
})();

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
            for (const base of API_BASES) {
                try {
                    const statusUrl = `${base}/api/race-status`;
                    const response = await fetch(statusUrl);
                    if (response.ok) {
                        return await response.json();
                    }
                } catch {
                    // Try next base host
                }
            }
            throw new Error('Race status unavailable (all backend hosts failed)');
        },
        refetchInterval: 30000, // Increase interval in demo mode to reduce noise
        staleTime: 10000,
        retry: false
    });
};
