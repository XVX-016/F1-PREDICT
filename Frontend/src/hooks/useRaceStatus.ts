import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // No /api suffix here, appended later or logic adjusted

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
                const { data } = await axios.get(`${API_BASE_URL}/api/race-status`);
                return data;
            } catch (error) {
                // Return fallback status if backend offline
                return {
                    raceId: "offline-demo",
                    name: "Backend Initializing...",
                    round: 0,
                    session: "CHECKING",
                    status: "UPCOMING",
                    trackTemp: "--",
                    airTemp: "--",
                    humidity: "--",
                    windSpeed: "--",
                    nextSessionTime: new Date().toISOString()
                } as RaceStatus;
            }
        },
        refetchInterval: 10000,
        staleTime: 5000,
        retry: false // Don't spam retries, just show fallback
    });
};
