import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useRacePositionSeries, useFullRacePositionSeries } from '../../selectors/useRacePositionSeries';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';
import { Flag } from 'lucide-react';

/**
 * Race Position Chart
 * 
 * Shows position evolution for all drivers.
 * - Selected driver highlighted with thicker line
 * - Uses stepAfter curve for accurate position changes
 * 
 * RULES:
 * - Uses useRacePositionSeries selector (cursor-driven)
 * - No animations - chart only updates when cursor moves
 */
export default function RacePositionChart() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cursor-driven data
    const visibleSeries = useRacePositionSeries();
    const fullSeries = useFullRacePositionSeries();

    // Store state
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));
    const simulationState = useRaceStore(useShallow(s => s.simulationState));
    const dataSource = useRaceStore(useShallow(s => s.dataSource));

    // Calculate stable domains from FULL series
    const maxLap = useMemo(() => {
        if (!fullSeries || fullSeries.length === 0) return 58;
        return Math.max(...fullSeries.flatMap(d => d.points.map(p => p.lap)));
    }, [fullSeries]);

    // Render Effect
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        // Gate: Empty State
        if (simulationState === "empty" || !visibleSeries) {
            const svg = d3.select(svgRef.current);
            svg.selectAll('*').remove();
            return;
        }

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Scales
        const x = d3.scaleLinear()
            .domain([1, maxLap])
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([1, 20])
            .range([margin.top, height - margin.bottom]);

        // Line Generator
        const line = d3.line<{ lap: number; position: number }>()
            .x(d => x(d.lap))
            .y(d => y(d.position))
            .curve(d3.curveStepAfter);

        // Grid lines
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10).tickSize(-height + margin.top + margin.bottom).tickFormat(() => ""))
            .attr("opacity", 0.1);

        // Draw all driver lines
        visibleSeries.forEach((driver) => {
            if (driver.points.length === 0) return;

            const isSelected = driver.driverId === selectedDriverId;

            svg.append("path")
                .datum(driver.points)
                .attr("fill", "none")
                .attr("stroke", driver.color)
                .attr("stroke-width", isSelected ? 3 : 1.5)
                .attr("opacity", isSelected ? 1 : 0.4)
                .attr("d", line as any);

            // Add driver label at end of line
            const lastPoint = driver.points[driver.points.length - 1];
            if (lastPoint) {
                svg.append("text")
                    .attr("x", x(lastPoint.lap) + 5)
                    .attr("y", y(lastPoint.position))
                    .attr("fill", driver.color)
                    .attr("font-size", "10px")
                    .attr("font-weight", isSelected ? "bold" : "normal")
                    .attr("opacity", isSelected ? 1 : 0.6)
                    .attr("dominant-baseline", "middle")
                    .text(driver.driverId);
            }
        });

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10))
            .attr("color", "#666");

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(10))
            .attr("color", "#666");

    }, [visibleSeries, maxLap, selectedDriverId, simulationState]);

    // Gate: Empty State UI
    if (simulationState === "empty") {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                <div className="text-center flex flex-col items-center gap-2">
                    <Flag className="w-8 h-8 opacity-20" />
                    <div>Run simulation to view positions</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full w-full relative">
            <svg ref={svgRef} className="w-full h-full text-white" />
            {dataSource === "sample" && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] font-bold uppercase rounded border border-yellow-500/20">
                    Sample Data
                </div>
            )}
        </div>
    );
}
