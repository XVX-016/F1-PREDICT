import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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
            const { data } = await axios.get(`${API_BASE_URL}/race-status`);
            return data;
        },
        refetchInterval: 30000, // Poll every 30s
        staleTime: 10000
    });
};
