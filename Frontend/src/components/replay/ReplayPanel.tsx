import React, { useEffect, useState } from "react";
// Lucide icons would require installation, using simple text buttons if not available or assume installed
// Assuming typical project setup. If fails, I will revert to text.
// Given "production-grade", I'll use standard elements if I can't confirm library.
// But the user prompt had <Play />. I'll use text for safety unless I check package.json.
// Actually, I'll use simple styled buttons.

interface LapState {
    lap: number;
    gap_to_leader_ms: number;
    car_state: {
        tyre_compound: string;
        tyre_age_laps: number;
        fuel_kg: number;
    };
    pace_model: {
        predicted_lap_ms: number;
        uncertainty: {
            p05_ms: number;
            p95_ms: number;
        };
    };
    decision?: {
        action: string;
        explanation: string;
        confidence: number;
    }
}

interface ReplayPanelProps {
    raceId: string;
    maxLap: number;
    onLapChange: (lap: number) => void;
    currentLapData: any; // Ideally typed but dependent on API response
}

import { useReplay } from "../../hooks/useReplay";

export default function ReplayPanel({
    raceId,
    maxLap,
    onLapChange,
    currentLapData
}: ReplayPanelProps) {

    const { lap, setLap, playing, setPlaying, speed, setSpeed } = useReplay(raceId, maxLap);

    // Sync parent
    useEffect(() => {
        onLapChange(lap);
    }, [lap, onLapChange]);

    const decision = currentLapData?.decisions?.[0] || currentLapData?.state?.decision;
    const state = currentLapData?.state?.drivers?.["VER"] || currentLapData?.state; // Adaptation for single driver view or multi

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">

            {/* Header / Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setPlaying(!playing)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-white font-medium transition-colors"
                >
                    {playing ? "PAUSE" : "PLAY"}
                </button>

                <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-mono">1</span>
                    <input
                        type="range"
                        min={1}
                        max={maxLap}
                        value={lap}
                        onChange={(e) => {
                            setLap(Number(e.target.value));
                            setPlaying(false); // Pause on scrub
                        }}
                        className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <span className="text-xs text-zinc-500 font-mono">{maxLap}</span>
                </div>

                <div className="text-right">
                    <div className="text-xl font-mono text-white">Lap {lap}</div>
                    <div className="text-xs text-zinc-500">SPEED {speed}x</div>
                </div>
            </div>

            {/* Snapshot */}
            {state && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                    <Stat label="TYRE" value={`${state.car_state?.tyre_compound || 'N/A'} (${state.car_state?.tyre_age_laps || 0})`} />
                    <Stat label="GAP" value={`${state.gap_to_leader_ms || 0} ms`} />
                    <Stat label="PACE" value={`${(state.pace_model?.predicted_lap_ms / 1000).toFixed(3)} s`} />
                    <Stat label="FUEL" value={`${state.car_state?.fuel_kg || 0} kg`} />
                </div>
            )}

            {/* Decision Annotation */}
            {decision && decision.action !== "NONE" && (
                <div className="bg-red-950/20 border-l-4 border-red-600 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1">
                                Strategy Decision: {decision.action}
                            </h4>
                            <p className="text-sm text-zinc-300">
                                {decision.explanation || "No explanation provided."}
                            </p>
                        </div>
                        {decision.confidence && (
                            <div className="text-xs text-zinc-500 font-mono border border-zinc-800 px-2 py-1 rounded">
                                CONF: {(decision.confidence * 100).toFixed(0)}%
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">{label}</div>
            <div className="text-lg font-mono text-white">{value}</div>
        </div>
    );
}
