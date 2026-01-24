import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';
import { SimulationResult, LapState } from '../../sim/types';

/**
 * Strategy Timeline Frame
 * Per-lap data for strategy visualization
 */
export interface StrategyTimelineFrame {
    lap: number;
    pitWindow: 'OPTIMAL' | 'VIABLE' | 'CLOSED';
    safetyCar: boolean;
    pitExecuted: boolean;
    degradedLapTime?: number; // For counterfactual overlay
    physicsLapTime?: number; // For residual debug
    correctedLapTime?: number; // For residual debug
    residualDelta?: number; // For residual debug
}

/**
 * Residual Point for ML Debug
 */
export interface ResidualPoint {
    lap: number;
    physics: number;
    corrected: number;
    delta: number;
}

/**
 * D3 Strategy Timeline
 * 
 * Engineer-grade lap-indexed strip chart with:
 * - Pit window color bands (OPTIMAL/VIABLE/CLOSED)
 * - Safety Car overlay stripes
 * - Counterfactual overlay (pit ±2 laps)
 * - Residual debug panel (physics vs corrected)
 * 
 * RULES:
 * - No animations
 * - Deterministic rendering
 * - Three aligned tracks
 */
export default function StrategyTimeline() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const simulationResult = useRaceStore(useShallow(s => s.simulationResult));
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));
    const simulationState = useRaceStore(useShallow(s => s.simulationState));
    const currentLap = useRaceStore(useShallow(s => s.currentLap));
    const useMLResiduals = useRaceStore(useShallow(s => s.config.useMLResiduals));

    // Constants from spec
    const TRACK_HEIGHT = 28;
    const TRACK_GAP = 6;
    const TOTAL_HEIGHT = TRACK_HEIGHT * 3 + TRACK_GAP * 2;

    // Generate timeline data from simulation result
    const timelineData = useMemo((): StrategyTimelineFrame[] => {
        if (!simulationResult || !selectedDriverId) return [];

        const driverSim = simulationResult.baseline.drivers[selectedDriverId];
        if (!driverSim) return [];

        const totalLaps = simulationResult.meta.totalLaps;
        const scLaps = new Set(simulationResult.baseline.safetyCarLaps);

        // Determine pit windows (simplified - in production this would come from strategy optimizer)
        const pitLaps = driverSim.laps
            .filter((lap, idx) => idx > 0 && lap.tyre !== driverSim.laps[idx - 1].tyre)
            .map(lap => lap.lap);

        const timeline: StrategyTimelineFrame[] = [];

        for (let lap = 1; lap <= totalLaps; lap++) {
            const lapState = driverSim.laps.find(l => l.lap === lap);
            const isPitLap = pitLaps.includes(lap);

            // Determine pit window (simplified logic)
            let pitWindow: 'OPTIMAL' | 'VIABLE' | 'CLOSED' = 'CLOSED';
            if (lapState) {
                const tyreAge = lapState.tyreLife;
                if (tyreAge >= 15 && tyreAge <= 20) {
                    pitWindow = 'OPTIMAL';
                } else if (tyreAge >= 10 && tyreAge <= 25) {
                    pitWindow = 'VIABLE';
                }
            }

            timeline.push({
                lap,
                pitWindow,
                safetyCar: scLaps.has(lap),
                pitExecuted: isPitLap,
                degradedLapTime: lapState?.lapTime,
                physicsLapTime: lapState?.lapTime, // In production, this would be from physics-only model
                correctedLapTime: useMLResiduals ? lapState?.lapTime : undefined, // In production, ML-corrected
                residualDelta: useMLResiduals && lapState ? 0 : undefined // Placeholder - would compute actual delta
            });
        }

        return timeline;
    }, [simulationResult, selectedDriverId, useMLResiduals]);

    // Generate counterfactual data (pit ±2 laps)
    const counterfactualData = useMemo(() => {
        if (!simulationResult || !selectedDriverId) return null;

        // In production, this would run actual counterfactual simulations
        // For now, we'll generate placeholder data
        const baseline = timelineData;
        const early: StrategyTimelineFrame[] = baseline.map(d => ({
            ...d,
            degradedLapTime: d.degradedLapTime ? d.degradedLapTime - 50 : undefined // Placeholder
        }));
        const late: StrategyTimelineFrame[] = baseline.map(d => ({
            ...d,
            degradedLapTime: d.degradedLapTime ? d.degradedLapTime + 50 : undefined // Placeholder
        }));

        return { baseline, early, late };
    }, [timelineData, simulationResult, selectedDriverId]);

    // Generate residual data
    const residualData = useMemo((): ResidualPoint[] => {
        if (!useMLResiduals || !timelineData.length) return [];

        return timelineData
            .filter(d => d.physicsLapTime !== undefined && d.correctedLapTime !== undefined)
            .map(d => ({
                lap: d.lap,
                physics: d.physicsLapTime!,
                corrected: d.correctedLapTime!,
                delta: (d.correctedLapTime! - d.physicsLapTime!) / 1000 // Convert to seconds
            }));
    }, [timelineData, useMLResiduals]);

    // Render effect
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        // Gate: Empty State
        if (simulationState === "empty" || !timelineData.length) {
            const svg = d3.select(svgRef.current);
            svg.selectAll('*').remove();
            return;
        }

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = TOTAL_HEIGHT + 60; // Add space for axes
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        svg.attr('width', width).attr('height', height);

        const totalLaps = d3.max(timelineData, d => d.lap) || 58;

        // X Scale
        const x = d3.scaleLinear()
            .domain([1, totalLaps])
            .range([margin.left, width - margin.right]);

        // Y Scale for residual track (lap time in ms)
        const yResidual = d3.scaleLinear()
            .domain([
                d3.min(residualData, d => Math.min(d.physics, d.corrected)) || 90000,
                d3.max(residualData, d => Math.max(d.physics, d.corrected)) || 95000
            ])
            .range([TOTAL_HEIGHT - TRACK_HEIGHT, TOTAL_HEIGHT]);

        // Track Y positions
        const trackY = {
            strategy: margin.top,
            execution: margin.top + TRACK_HEIGHT + TRACK_GAP,
            residual: margin.top + (TRACK_HEIGHT + TRACK_GAP) * 2
        };

        // Define Safety Car stripe pattern
        svg.append('defs')
            .append('pattern')
            .attr('id', 'sc-stripe')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 6)
            .attr('height', 6)
            .append('path')
            .attr('d', 'M0,6 l6,-6')
            .attr('stroke', '#9ca3af')
            .attr('stroke-width', 1);

        // TRACK 1: Strategy Window Bands
        svg.append('g')
            .selectAll('.pit-window')
            .data(timelineData)
            .enter()
            .append('rect')
            .attr('class', 'pit-window')
            .attr('x', d => x(d.lap - 0.5))
            .attr('y', trackY.strategy)
            .attr('width', x(1) - x(0))
            .attr('height', TRACK_HEIGHT)
            .attr('fill', d => {
                if (d.pitWindow === 'OPTIMAL') return '#16a34a';
                if (d.pitWindow === 'VIABLE') return '#f59e0b';
                return '#dc2626';
            })
            .attr('opacity', 0.15);

        // Safety Car Overlay on Strategy Track
        svg.append('g')
            .selectAll('.sc-overlay')
            .data(timelineData.filter(d => d.safetyCar))
            .enter()
            .append('rect')
            .attr('class', 'sc-overlay')
            .attr('x', d => x(d.lap - 0.5))
            .attr('y', trackY.strategy)
            .attr('width', x(1) - x(0))
            .attr('height', TRACK_HEIGHT)
            .attr('fill', 'url(#sc-stripe)')
            .attr('opacity', 0.25);

        // TRACK 2: Pit Execution Markers
        svg.append('g')
            .selectAll('.pit-marker')
            .data(timelineData.filter(d => d.pitExecuted))
            .enter()
            .append('line')
            .attr('class', 'pit-marker')
            .attr('x1', d => x(d.lap))
            .attr('x2', d => x(d.lap))
            .attr('y1', trackY.execution)
            .attr('y2', trackY.execution + TRACK_HEIGHT)
            .attr('stroke', '#111827')
            .attr('stroke-width', 2);

        // Counterfactual Overlay (on Execution Track)
        if (counterfactualData) {
            const line = d3.line<StrategyTimelineFrame>()
                .x(d => x(d.lap))
                .y(d => {
                    if (d.degradedLapTime === undefined) return trackY.execution + TRACK_HEIGHT / 2;
                    return yResidual(d.degradedLapTime);
                })
                .defined(d => d.degradedLapTime !== undefined);

            // Baseline (solid)
            svg.append('path')
                .datum(counterfactualData.baseline.filter(d => d.degradedLapTime !== undefined))
                .attr('fill', 'none')
                .attr('stroke', '#2563eb')
                .attr('stroke-width', 2)
                .attr('d', line);

            // Early (dashed)
            svg.append('path')
                .datum(counterfactualData.early.filter(d => d.degradedLapTime !== undefined))
                .attr('fill', 'none')
                .attr('stroke', '#2563eb')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '4,4')
                .attr('opacity', 0.6)
                .attr('d', line);

            // Late (dashed)
            svg.append('path')
                .datum(counterfactualData.late.filter(d => d.degradedLapTime !== undefined))
                .attr('fill', 'none')
                .attr('stroke', '#2563eb')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '4,4')
                .attr('opacity', 0.6)
                .attr('d', line);
        }

        // TRACK 3: Residual Debug Bars
        if (residualData.length > 0) {
            svg.append('g')
                .selectAll('.residual-bar')
                .data(residualData)
                .enter()
                .append('rect')
                .attr('class', 'residual-bar')
                .attr('x', d => x(d.lap - 0.5))
                .attr('y', d => {
                    const zeroY = yResidual(d.physics);
                    const deltaY = yResidual(d.physics + d.delta * 1000) - zeroY;
                    return deltaY > 0 ? zeroY : zeroY + deltaY;
                })
                .attr('width', x(1) - x(0))
                .attr('height', d => Math.abs(yResidual(d.physics + d.delta * 1000) - yResidual(d.physics)))
                .attr('fill', d => d.delta > 0 ? '#dc2626' : '#16a34a')
                .attr('opacity', 0.7)
                .append('title')
                .text(d => `Lap ${d.lap}\nPhysics: ${(d.physics / 1000).toFixed(3)}s\nCorrected: ${(d.corrected / 1000).toFixed(3)}s\nΔ: ${d.delta > 0 ? '+' : ''}${d.delta.toFixed(3)}s`);

            // Zero reference line
            if (residualData.length > 0) {
                const firstPhysics = residualData[0].physics;
                svg.append('line')
                    .attr('x1', margin.left)
                    .attr('x2', width - margin.right)
                    .attr('y1', yResidual(firstPhysics))
                    .attr('y2', yResidual(firstPhysics))
                    .attr('stroke', '#666')
                    .attr('stroke-dasharray', '2,2')
                    .attr('opacity', 0.5);
            }
        }

        // X Axis
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10))
            .attr('color', '#666')
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', '#999')
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .text('Lap');

        // Current Lap Indicator
        if (currentLap) {
            svg.append('line')
                .attr('x1', x(currentLap))
                .attr('x2', x(currentLap))
                .attr('y1', margin.top)
                .attr('y2', height - margin.bottom)
                .attr('stroke', '#E10600')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '4,2')
                .attr('opacity', 0.8);
        }

        // Track Labels
        svg.append('text')
            .attr('x', margin.left - 10)
            .attr('y', trackY.strategy + TRACK_HEIGHT / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '9px')
            .attr('fill', '#999')
            .text('Strategy');

        svg.append('text')
            .attr('x', margin.left - 10)
            .attr('y', trackY.execution + TRACK_HEIGHT / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '9px')
            .attr('fill', '#999')
            .text('Execution');

        if (residualData.length > 0) {
            svg.append('text')
                .attr('x', margin.left - 10)
                .attr('y', trackY.residual + TRACK_HEIGHT / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .attr('font-size', '9px')
                .attr('fill', '#999')
                .text('Residual');
        }

    }, [timelineData, counterfactualData, residualData, currentLap, simulationState, useMLResiduals]);

    if (simulationState === "empty" || !timelineData.length) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                Run simulation to view strategy timeline
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full w-full relative">
            <svg ref={svgRef} className="w-full h-full text-white" />
            <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] font-medium font-mono bg-black/50 p-2 rounded backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>
                    <span className="text-gray-300">OPTIMAL</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                    <span className="text-gray-300">VIABLE</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#dc2626]"></div>
                    <span className="text-gray-300">CLOSED</span>
                </div>
            </div>
        </div>
    );
}

