import { useQuery } from '@tanstack/react-query';
<<<<<<< HEAD
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';
=======

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
>>>>>>> feature/redis-telemetry-replay

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
<<<<<<< HEAD
            const { data } = await axios.get(`${API_BASE_URL}/race-status`);
            return data;
        },
        refetchInterval: 30000, // Poll every 30s
        staleTime: 10000
=======
            try {
                const response = await fetch(`${API_BASE_URL}/api/race-status`);
                if (!response.ok) throw new Error('Network response was not ok');
                return await response.json();
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
>>>>>>> feature/redis-telemetry-replay
    });
};
