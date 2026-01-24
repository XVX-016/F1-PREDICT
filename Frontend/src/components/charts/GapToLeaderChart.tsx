import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useGapSeries, useFullGapSeries } from '../../selectors/useGapSeries';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Gap to Leader Chart
 * 
 * Shows gap evolution for the selected driver.
 * - Uses stepAfter curve (gaps change at lap completion)
 * - Highlights safety car periods
 * 
 * RULES:
 * - Uses useGapSeries selector (cursor-driven)
 * - No animations - chart only updates when cursor moves
 */
export default function GapToLeaderChart() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cursor-driven data
    const visibleData = useGapSeries();
    const fullData = useFullGapSeries();

    // Store state
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));
    const simulationState = useRaceStore(useShallow(s => s.simulationState));
    const dataSource = useRaceStore(useShallow(s => s.dataSource));

    // Calculate stable domains from FULL series
    const domains = useMemo(() => {
        if (!fullData || fullData.length === 0) {
            return { x: [1, 58], y: [0, 30000] };
        }

        const xMax = d3.max(fullData, d => d.lap) || 58;
        const yMax = d3.max(fullData, d => d.gapBaseline) || 30000;

        return {
            x: [1, xMax],
            y: [0, yMax + 2000] // Padding
        };
    }, [fullData]);

    // Render Effect
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        // Gate: Empty State or no data
        if (simulationState === "empty" || !visibleData || visibleData.length === 0) {
            const svg = d3.select(svgRef.current);
            svg.selectAll('*').remove();
            return;
        }

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 20, right: 30, bottom: 30, left: 55 };

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Scales
        const x = d3.scaleLinear()
            .domain(domains.x as [number, number])
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain(domains.y as [number, number])
            .range([height - margin.bottom, margin.top]);

        // Line Generator
        const line = d3.line<{ lap: number; gapBaseline: number }>()
            .x(d => x(d.lap))
            .y(d => y(d.gapBaseline))
            .curve(d3.curveStepAfter);

        // Grid
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10).tickSize(-height + margin.top + margin.bottom).tickFormat(() => ""))
            .attr("opacity", 0.1);

        // Safety Car Highlighting
        visibleData.forEach(d => {
            if (d.isSafetyCar) {
                svg.append("rect")
                    .attr("x", x(d.lap - 0.5))
                    .attr("y", margin.top)
                    .attr("width", x(d.lap + 0.5) - x(d.lap - 0.5))
                    .attr("height", height - margin.top - margin.bottom)
                    .attr("fill", "#FFCC00")
                    .attr("opacity", 0.1);
            }
        });

        // Gap Line (Red)
        svg.append("path")
            .datum(visibleData)
            .attr("fill", "none")
            .attr("stroke", "#E10600")
            .attr("stroke-width", 2)
            .attr("d", line as any);

        // Current point marker
        const currentDatum = visibleData[visibleData.length - 1];
        if (currentDatum) {
            svg.append("circle")
                .attr("cx", x(currentDatum.lap))
                .attr("cy", y(currentDatum.gapBaseline))
                .attr("r", 4)
                .attr("fill", "#E10600");
        }

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10))
            .attr("color", "#666");

        // Y Axis (formatted as seconds)
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => "+" + (Number(d) / 1000).toFixed(1) + "s"))
            .attr("color", "#666");

    }, [visibleData, domains, simulationState]);

    // Gate: Empty State UI
    if (simulationState === "empty") {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                <div className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <div>Run simulation to view gaps</div>
                </div>
            </div>
        );
    }

    if (!selectedDriverId) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                Select a driver to view gaps
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
