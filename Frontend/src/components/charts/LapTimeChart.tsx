import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';
import { DriverId } from '../../types/race';

interface PaceDataPoint {
    lap: number;
    p05: number;
    p50: number;
    p95: number;
}

export default function LapTimeChart() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Subscribe to store
    // We only need the full replayFrames if we want the history up to current lap
    // OR if we are in SIMULATION mode, we might want the full projection.
    // For now, let's assume we show the FULL history available in replayFrames.
    const replayFrames = useRaceStore(useShallow(s => s.replayFrames));
    const currentLap = useRaceStore(useShallow(s => s.currentLap));
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));

    // Transform data for the selected driver
    const data: PaceDataPoint[] = useMemo(() => {
        if (!selectedDriverId) return [];

        return Object.values(replayFrames)
            .sort((a, b) => a.lap - b.lap)
            .map(frame => {
                const driver = frame.drivers[selectedDriverId];
                if (!driver) return null;
                return {
                    lap: frame.lap,
                    p05: driver.pace.p05Ms,
                    p50: driver.pace.p50Ms,
                    p95: driver.pace.p95Ms,
                };
            })
            .filter((d): d is PaceDataPoint => d !== null);
    }, [replayFrames, selectedDriverId]);

    // D3 Rendering Effect
    useEffect(() => {
        if (!data.length || !svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        // Scales
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.lap) as [number, number])
            .range([margin.left, width - margin.right]);

        // Y domain based on P05/P95 to show full range
        const yMin = d3.min(data, d => d.p05) || 0;
        const yMax = d3.max(data, d => d.p95) || 0;
        const y = d3.scaleLinear()
            .domain([yMin * 0.99, yMax * 1.01]) // Add slight padding
            .range([height - margin.bottom, margin.top]);

        // Area Generator (Uncertainty Band)
        const area = d3.area<PaceDataPoint>()
            .x(d => x(d.lap))
            .y0(d => y(d.p05))
            .y1(d => y(d.p95))
            .curve(d3.curveMonotoneX);

        // Line Generator (Median Pace)
        const line = d3.line<PaceDataPoint>()
            .x(d => x(d.lap))
            .y(d => y(d.p50))
            .curve(d3.curveMonotoneX);

        // Axes
        const xAxis = (g: any) => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
            .call((g: any) => g.select(".domain").remove())
            .call((g: any) => g.selectAll(".tick line").attr("stroke", "#333"))
            .call((g: any) => g.selectAll(".tick text").attr("fill", "#666"));

        const yAxis = (g: any) => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(height / 40))
            .call((g: any) => g.select(".domain").remove())
            .call((g: any) => g.selectAll(".tick line").attr("stroke", "#333"))
            .call((g: any) => g.selectAll(".tick text").attr("fill", "#666"));

        // Draw Uncertainty Band
        svg.append("path")
            .datum(data)
            .attr("fill", "rgba(225, 6, 0, 0.1)") // Red tint
            .attr("d", area);

        // Draw Median Line
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Draw Current Lap Marker line
        if (currentLap) {
            svg.append("line")
                .attr("x1", x(currentLap))
                .attr("x2", x(currentLap))
                .attr("y1", margin.top)
                .attr("y2", height - margin.bottom)
                .attr("stroke", "#E10600")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "4 2");
        }

        // Draw Axes
        svg.append("g").call(xAxis);
        svg.append("g").call(yAxis);

    }, [data, currentLap]); // Re-render when data or cursor changes

    if (!selectedDriverId) {
        return <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">select a driver to view pace metrics</div>;
    }

    if (data.length === 0) {
        return <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">no pace data available</div>;
    }

    return (
        <div ref={containerRef} className="h-full w-full">
            <svg ref={svgRef} className="w-full h-full text-white" />
        </div>
    );
}
