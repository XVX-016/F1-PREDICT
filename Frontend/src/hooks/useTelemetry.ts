import { useState, useEffect, useRef } from 'react';

export interface TelemetrySnapshot {
    state: {
        lap: number;
        track_status: string;
        weather: string;
        sc_probability: number;
    };
    drivers?: {
        [key: string]: {
            gap: number;
            tyre_age: number;
            compound: string;
            last_lap: string;
        };
    };
    timestamp: string | number;
}

export function useTelemetry(raceId: string, active: boolean = false) {
    const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!active || !raceId) {
            if (ws.current) {
                ws.current.close();
            }
            return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const WS_URL = API_BASE_URL.replace('http', 'ws') + `/ws/race/${raceId}`;

        console.log(`📡 Connecting to Telemetry WS: ${WS_URL}`);

        const socket = new WebSocket(WS_URL);
        ws.current = socket;

        socket.onopen = () => {
            console.log('✅ Telemetry WS Connected');
            setIsConnected(true);
            setError(null);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setSnapshot(data);
            } catch (err) {
                console.error('❌ Failed to parse telemetry message:', err);
            }
        };

        socket.onerror = (err) => {
            console.error('❌ Telemetry WS Error:', err);
            setError('Connection failed');
            setIsConnected(false);
        };

        socket.onclose = () => {
            console.log('🔌 Telemetry WS Closed');
            setIsConnected(false);
        };

        return () => {
            socket.close();
        };
    }, [raceId, active]);

    return { snapshot, isConnected, error };
}
