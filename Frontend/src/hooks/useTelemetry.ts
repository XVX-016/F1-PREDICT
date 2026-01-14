import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';

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
            delta?: number;
        };
    };
    timestamp: string | number;
}

export function useTelemetry(raceId: string, active: boolean = false) {
    const {
        snapshot,
        isConnected,
        error,
        setRaceId,
        updateSnapshot,
        setConnectionStatus
    } = useTelemetryStore();

    const ws = useRef<WebSocket | null>(null);

    // Effect to handle connection lifecycle
    useEffect(() => {
        if (!active || !raceId) {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            return;
        }

        // Avoid reconnecting if already connected to the same race
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            return;
        }

        setRaceId(raceId);

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const WS_URL = API_BASE_URL.replace('http', 'ws') + `/ws/race/${raceId}`;

        console.log(`📡 Connecting to Telemetry WS: ${WS_URL}`);

        const socket = new WebSocket(WS_URL);
        ws.current = socket;

        socket.onopen = () => {
            console.log('✅ Telemetry WS Connected');
            setConnectionStatus(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data) {
                    // Normalize data structure if needed
                    updateSnapshot(data as any);
                }
            } catch (err) {
                console.error('❌ Failed to parse telemetry message:', err);
            }
        };

        socket.onerror = () => {
            console.error('❌ Telemetry WS Error');
            setConnectionStatus(false, 'Connection failed');
        };

        socket.onclose = () => {
            console.log('🔌 Telemetry WS Closed');
            setConnectionStatus(false);
            ws.current = null;
        };

        return () => {
            if (active) {
                socket.close();
            }
        };
    }, [raceId, active, setRaceId, setConnectionStatus, updateSnapshot]);

    return { snapshot, isConnected, error };
}
