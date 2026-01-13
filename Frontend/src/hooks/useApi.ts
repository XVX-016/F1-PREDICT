import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

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

export function useDrivers() {
    return useQuery<Driver[]>({
        queryKey: ['drivers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*, constructors(name, color)')
                .order('name');
            if (error) throw error;
            return data || [];
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
