import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabase';
import { BettingMarket as Market, MarketOption, UserBet as Bet, Transaction } from '../types/betting';

const API_BASE_URL = API_CONFIG.BACKEND.BASE_URL;

const getHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    // Default headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const bettingApi = {
    getMarkets: async (): Promise<Market[]> => {
        // Markets are public, no auth needed usually, but good to have
        const response = await fetch(`${API_BASE_URL}/api/markets`);
        if (!response.ok) throw new Error('Failed to fetch markets');
        return response.json();
    },

    getMarket: async (marketId: string): Promise<Market> => {
        const response = await fetch(`${API_BASE_URL}/api/markets/${marketId}`);
        if (!response.ok) throw new Error('Failed to fetch market');
        return response.json();
    },

    placeBet: async (marketId: string, optionId: string, stake: number): Promise<any> => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/bets`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ market_id: marketId, option_id: optionId, stake })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to place bet');
        }
        return response.json();
    },

    getMyBets: async (): Promise<Bet[]> => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/bets/my-bets`, { headers });
        if (!response.ok) throw new Error('Failed to fetch bets');
        return response.json();
    },

    getMyTransactions: async (): Promise<Transaction[]> => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/user/transactions`, { headers });
        if (!response.ok) return [];
        return response.json();
    },

    getMyPoints: async (): Promise<{ balance: number }> => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/user/points`, { headers });
        if (!response.ok) throw new Error('Failed to fetch points');
        return response.json();
    },

    getMe: async (): Promise<any> => {
        const headers = await getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/user/me`, { headers });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    }
};
