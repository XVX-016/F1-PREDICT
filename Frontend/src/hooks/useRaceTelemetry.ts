import { useEffect, useState } from "react";

export interface RaceStatus {
    lap: number;
    total_laps: number;
    safety_car: boolean;
    weather: string;
    source: "LIVE" | "SIMULATION" | "OFFLINE";
    drivers?: Record<string, any>;
}

export function useRaceTelemetry(raceId: string) {
    const [status, setStatus] = useState<RaceStatus | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Initial hydration via polling or just wait for WS
        // Let's connect WS immediately
        const wsUrl = `ws://localhost:8000/ws/race/${raceId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            setConnectionError(null);
            console.log(`[Telemetry] Connected to ${raceId}`);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "RACE_STATUS") {
                    setStatus(msg.payload);
                }
            } catch (e) {
                console.error("Failed to parse telemetry message", e);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log(`[Telemetry] Disconnected from ${raceId}`);
        };

        ws.onerror = (err) => {
            console.error("[Telemetry] WebSocket error", err);
            setConnectionError("Connection Failed");
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [raceId]);

    return { status, isConnected, connectionError };
}
