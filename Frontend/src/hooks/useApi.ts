import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
    country: string;
    city: string;
    circuit_image_url: string;
    fp1_time: string;
    fp2_time: string;
    fp3_time: string;
    qualifying_time: string;
    sprint_time: string;
}

export function useConstructors() {
    const [data, setData] = useState<Constructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchConstructors() {
            try {
                const { data, error } = await supabase
                    .from('constructors')
                    .select('*')
                    .order('name');

                if (error) throw error;
                setData(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchConstructors();
    }, []);

    return { data, loading, error };
}

export function useDrivers() {
    const [data, setData] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDrivers() {
            try {
                const { data, error } = await supabase
                    .from('drivers')
                    .select('*, constructors(name, color)')
                    .order('name');

                if (error) throw error;
                setData(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDrivers();
    }, []);

    return { data, loading, error };
}

export function useRaces(season: number = 2025) {
    const [data, setData] = useState<Race[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRaces() {
            try {
                const { data, error } = await supabase
                    .from('races')
                    .select('*')
                    .eq('season', season)
                    .order('round');

                if (error) throw error;
                setData(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchRaces();
    }, [season]);

    return { data, loading, error };
}
