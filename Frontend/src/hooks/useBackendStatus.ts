import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASES = (() => {
    const primary = API_BASE_URL.replace(/\/$/, '');
    const out = [primary];
    if (primary.includes('localhost')) out.push(primary.replace('localhost', '127.0.0.1'));
    if (primary.includes('127.0.0.1')) out.push(primary.replace('127.0.0.1', 'localhost'));
    return Array.from(new Set(out));
})();

export type BackendConnectivity = 'online' | 'degraded' | 'offline';

export interface BackendStatus {
    connectivity: BackendConnectivity;
    version?: string;
    architecture?: string;
    baseUrl?: string;
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timer);
    }
};

export const useBackendStatus = () => {
    return useQuery<BackendStatus>({
        queryKey: ['backendStatus'],
        queryFn: async () => {
            for (const base of API_BASES) {
                try {
                    const healthRes = await fetchWithTimeout(`${base}/health`, 3000);
                    if (!healthRes.ok) {
                        continue;
                    }

                    const health = await healthRes.json();
                    let connectivity: BackendConnectivity = 'online';

                    try {
                        const raceStatusRes = await fetchWithTimeout(`${base}/api/race-status`, 3000);
                        connectivity = raceStatusRes.ok ? 'online' : 'degraded';
                    } catch {
                        connectivity = 'degraded';
                    }

                    return {
                        connectivity,
                        version: health?.version,
                        architecture: health?.architecture,
                        baseUrl: base,
                    };
                } catch {
                    // Try next candidate
                }
            }

            return {
                connectivity: 'offline',
            };
        },
        staleTime: 10000,
        refetchInterval: 30000,
        retry: false,
    });
};
