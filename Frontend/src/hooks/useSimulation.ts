import { useState, useCallback } from "react";
import { SimulationRequest, SimulationResponse } from "../types/domain";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useSimulation() {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<SimulationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0); // 0-100

    const runSimulation = useCallback(async (raceId: string, request: SimulationRequest) => {
        setRunning(true);
        setError(null);
        setProgress(10); // Simulation started

        try {
            const response = await fetch(`${API_BASE}/api/races/${raceId}/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Simulation failed to execute.");
            }

            const data: SimulationResponse = await response.json();

            setProgress(100);
            setResult(data);
            setRunning(false);
            return data;
        } catch (err: any) {
            console.error("Simulation failed:", err);
            setError(err.message || "Simulation failed to execute.");
            setRunning(false);
            setProgress(0);
            return null;
        }
    }, []);

    return {
        running,
        result,
        error,
        progress,
        runSimulation
    };
}
