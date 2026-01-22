import { useState, useCallback } from "react";
import axios from "axios";
import { SimulationRequest, SimulationResponse } from "../types/domain";

const API_BASE = "http://localhost:8000/api";

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
            const response = await axios.post<SimulationResponse>(
                `${API_BASE}/races/${raceId}/simulate`,
                request
            );

            setProgress(100);
            setResult(response.data);
            setRunning(false);
            return response.data;
        } catch (err: any) {
            console.error("Simulation failed:", err);
            setError(err.response?.data?.detail || "Simulation failed to execute.");
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
