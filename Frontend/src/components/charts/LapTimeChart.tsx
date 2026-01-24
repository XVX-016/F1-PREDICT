import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useLapPaceSeries, useFullLapPaceSeries, LapPacePoint } from '../../selectors/useLapPaceSeries';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Lap Time / Pace Chart
 * 
 * Phase 2A: Shows baseline vs counterfactual lap pace
 * - Solid line = baseline
 * - Dashed line = counterfactual
 * 
 * RULES:
 * - Uses useLapPaceSeries selector (cursor-driven)
 * - No animations - chart only updates when cursor moves
 * - Domains calculated from full series to prevent axis jitter
 */
export default function LapTimeChart() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cursor-driven data
    const visibleData = useLapPaceSeries();
    const fullData = useFullLapPaceSeries();

    // Store state
    const selectedDriverId = useRaceStore(useShallow(s => s.selectedDriverId));
    const simulationState = useRaceStore(useShallow(s => s.simulationState));
    const dataSource = useRaceStore(useShallow(s => s.dataSource));
    const cfDescription = useRaceStore(useShallow(s => s.simulationResult?.meta.counterfactualDescription));

    // Calculate stable domains from FULL series (include both baseline and CF)
    const domains = useMemo(() => {
        if (!fullData || fullData.length === 0) {
            return { x: [1, 58], y: [75000, 95000] };
        }

        const xMax = d3.max(fullData, d => d.lap) || 58;

        // Consider both baseline and counterfactual for Y domain
        const allValues = fullData.flatMap(d =>
            [d.baseline, d.counterfactual].filter((v): v is number => v !== undefined)
        );
        const yMin = d3.min(allValues) || 75000;
        const yMax = d3.max(allValues) || 95000;

        return {
            x: [1, xMax],
            y: [yMin - 500, yMax + 500] // Padding
        };
    }, [fullData]);

    // Render Effect
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        // Gate: Empty State
        if (simulationState === "empty" || !visibleData) {
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

        // Grid
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10).tickSize(-height + margin.top + margin.bottom).tickFormat(() => ""))
            .attr("opacity", 0.1);

        // Baseline Line Generator
        const baselineLine = d3.line<LapPacePoint>()
            .x(d => x(d.lap))
            .y(d => y(d.baseline))
            .curve(d3.curveMonotoneX);

        // Counterfactual Line Generator
        const cfLine = d3.line<LapPacePoint>()
            .defined(d => d.counterfactual !== undefined)
            .x(d => x(d.lap))
            .y(d => y(d.counterfactual!))
            .curve(d3.curveMonotoneX);

        // Baseline Line (Solid - F1 Red)
        svg.append("path")
            .datum(visibleData)
            .attr("fill", "none")
            .attr("stroke", "#E10600")
            .attr("stroke-width", 2)
            .attr("d", baselineLine as any);

        // Counterfactual Line (Dashed - Cyan)
        const cfData = visibleData.filter(d => d.counterfactual !== undefined);
        if (cfData.length > 0) {
            svg.append("path")
                .datum(cfData)
                .attr("fill", "none")
                .attr("stroke", "#00CED1")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "6,4")
                .attr("opacity", 0.8)
                .attr("d", cfLine as any);
        }

        // Current Lap Markers
        const currentDatum = visibleData[visibleData.length - 1];
        if (currentDatum) {
            // Baseline marker
            svg.append("circle")
                .attr("cx", x(currentDatum.lap))
                .attr("cy", y(currentDatum.baseline))
                .attr("r", 4)
                .attr("fill", "#E10600");

            // Counterfactual marker
            if (currentDatum.counterfactual !== undefined) {
                svg.append("circle")
                    .attr("cx", x(currentDatum.lap))
                    .attr("cy", y(currentDatum.counterfactual))
                    .attr("r", 4)
                    .attr("fill", "#00CED1");
            }
        }

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10))
            .attr("color", "#666");

        // Y Axis (formatted as seconds)
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => (Number(d) / 1000).toFixed(1) + "s"))
            .attr("color", "#666");

    }, [visibleData, domains, simulationState]);

    // Gate: Empty State UI
    if (simulationState === "empty") {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                <div className="text-center">
                    <div className="text-2xl mb-2">⏱</div>
                    <div>Run simulation to view pace</div>
                </div>
            </div>
        );
    }

    if (!selectedDriverId) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                Select a driver to view pace metrics
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full w-full relative">
            <svg ref={svgRef} className="w-full h-full text-white" />

            {/* Legend */}
            <div className="absolute bottom-2 left-14 flex items-center gap-4 text-[9px] font-mono">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-[#E10600]" />
                    <span className="text-gray-400">Baseline</span>
                </div>
                {cfDescription && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-0.5 bg-[#00CED1]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #00CED1, #00CED1 6px, transparent 6px, transparent 10px)' }} />
                        <span className="text-gray-400">{cfDescription}</span>
                    </div>
                )}
            </div>

            {dataSource === "sample" && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] font-bold uppercase rounded border border-yellow-500/20">
                    Sample Data
                </div>
            )}
        </div>
    );
}
