import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

// ... (existing types)

export function useSimulateRace() {
    return useMutation({
        mutationFn: ({ raceId, params }: { raceId: string; params: any }) =>
            api.simulateRace(raceId, params),
    });
}

// Types matched to Backend API responses
export interface Constructor {
    id: string;
    name: string;
    color: string;
    accent_color: string;
    logo_url: string;
    car_image_url: string;
    drivers?: {
        id: string;
        name: string;
        number: number;
        country_code: string;
        image_url: string;
    }[];
}

export interface Driver {
    id: string;
    name: string;
    number: number;
    country_code: string;
    constructor_id: string;
    image_url: string;
    // Joined fields
    constructors?: {
        name: string;
        color: string;
    };
}

export interface Race {
    id: string;
    season: number;
    round: number;
    name: string;
    circuit: string;
    race_date: string;
    time: string;
    country: string;
    city: string;
    circuit_image_url: string;
    fp1_time: string;
    fp2_time: string;
    fp3_time: string;
    qualifying_time: string;
    sprint_time: string;
    status: 'upcoming' | 'live' | 'completed';
}

export function useConstructors() {
    return useQuery<Constructor[]>({
        queryKey: ['constructors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('constructors')
                .select('*')
                .order('name');
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

// Fallback Mock Data for Research Mode (2025 Grid)
const MOCK_DRIVERS: Driver[] = [
    { id: 'ver', name: 'Max Verstappen', number: 1, country_code: 'NED', constructor_id: 'rbr', image_url: '', constructors: { name: 'Red Bull Racing', color: '#3671C6' } },
    { id: 'per', name: 'Sergio Perez', number: 11, country_code: 'MEX', constructor_id: 'rbr', image_url: '', constructors: { name: 'Red Bull Racing', color: '#3671C6' } },
    { id: 'lec', name: 'Charles Leclerc', number: 16, country_code: 'MON', constructor_id: 'fer', image_url: '', constructors: { name: 'Ferrari', color: '#F91536' } },
    { id: 'ham', name: 'Lewis Hamilton', number: 44, country_code: 'GBR', constructor_id: 'fer', image_url: '', constructors: { name: 'Ferrari', color: '#F91536' } },
    { id: 'nor', name: 'Lando Norris', number: 4, country_code: 'GBR', constructor_id: 'mcl', image_url: '', constructors: { name: 'McLaren', color: '#FF8700' } },
    { id: 'pia', name: 'Oscar Piastri', number: 81, country_code: 'AUS', constructor_id: 'mcl', image_url: '', constructors: { name: 'McLaren', color: '#FF8700' } },
    { id: 'rus', name: 'George Russell', number: 63, country_code: 'GBR', constructor_id: 'mer', image_url: '', constructors: { name: 'Mercedes', color: '#6CD3BF' } },
    { id: 'ant', name: 'Kimi Antonelli', number: 12, country_code: 'ITA', constructor_id: 'mer', image_url: '', constructors: { name: 'Mercedes', color: '#6CD3BF' } },
    { id: 'alo', name: 'Fernando Alonso', number: 14, country_code: 'ESP', constructor_id: 'ast', image_url: '', constructors: { name: 'Aston Martin', color: '#358C75' } },
    { id: 'str', name: 'Lance Stroll', number: 18, country_code: 'CAN', constructor_id: 'ast', image_url: '', constructors: { name: 'Aston Martin', color: '#358C75' } },
    { id: 'gas', name: 'Pierre Gasly', number: 10, country_code: 'FRA', constructor_id: 'alp', image_url: '', constructors: { name: 'Alpine', color: '#2293D1' } },
    { id: 'doo', name: 'Jack Doohan', number: 7, country_code: 'AUS', constructor_id: 'alp', image_url: '', constructors: { name: 'Alpine', color: '#2293D1' } },
    { id: 'alb', name: 'Alexander Albon', number: 23, country_code: 'THA', constructor_id: 'wil', image_url: '', constructors: { name: 'Williams', color: '#37BEDD' } },
    { id: 'sai', name: 'Carlos Sainz', number: 55, country_code: 'ESP', constructor_id: 'wil', image_url: '', constructors: { name: 'Williams', color: '#37BEDD' } },
    { id: 'tsu', name: 'Yuki Tsunoda', number: 22, country_code: 'JPN', constructor_id: 'rb', image_url: '', constructors: { name: 'Racing Bulls', color: '#5E8FAA' } },
    { id: 'law', name: 'Liam Lawson', number: 30, country_code: 'NZL', constructor_id: 'rb', image_url: '', constructors: { name: 'Racing Bulls', color: '#5E8FAA' } },
    { id: 'hul', name: 'Nico Hulkenberg', number: 27, country_code: 'GER', constructor_id: 'sau', image_url: '', constructors: { name: 'Kick Sauber', color: '#52E252' } },
    { id: 'bor', name: 'Gabriel Bortoleto', number: 5, country_code: 'BRA', constructor_id: 'sau', image_url: '', constructors: { name: 'Kick Sauber', color: '#52E252' } },
    { id: 'oco', name: 'Esteban Ocon', number: 31, country_code: 'FRA', constructor_id: 'haa', image_url: '', constructors: { name: 'Haas', color: '#B6BABD' } },
    { id: 'bea', name: 'Oliver Bearman', number: 87, country_code: 'GBR', constructor_id: 'haa', image_url: '', constructors: { name: 'Haas', color: '#B6BABD' } },
];

export function useDrivers() {
    return useQuery<Driver[]>({
        queryKey: ['drivers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*, constructors(name, color)')
                .order('name');

            // Fallback to MOCK_DRIVERS if DB is empty or fails (Research Validity)
            if (error || !data || data.length === 0) {
                console.warn("Using Fallback Mock Data for Drivers (DB Empty/Error)");
                return MOCK_DRIVERS;
            }
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useRaces(season: number = 2026) {
    return useQuery<Race[]>({
        queryKey: ['races', season],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('races')
                .select('*')
                .eq('season', season)
                .order('round');
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

// New high-performance hooks for Python Backend
export function useRaceProbabilities(raceId: string) {
    return useQuery({
        queryKey: ['probabilities', raceId],
        queryFn: async () => {
            if (!raceId) return null;
            try {
                return await api.getProbabilities(raceId);
            } catch (err) {
                // Return null on 404 or other errors to let UI handle "Pending" state
                console.warn(`Probabilities not found for race ${raceId}`);
                return null;
            }
        },
        enabled: !!raceId,
        staleTime: 1000 * 60 * 15, // 15 mins
    });
}

export function useRaceMarkets(raceId: string) {
    return useQuery({
        queryKey: ['markets', raceId],
        queryFn: async () => {
            if (!raceId) return null;
            try {
                return await api.getMarkets(raceId);
            } catch (err) {
                console.warn(`Markets not found for race ${raceId}`);
                return null;
            }
        },
        enabled: !!raceId,
        staleTime: 1000 * 60 * 15, // 15 mins
    });
}
