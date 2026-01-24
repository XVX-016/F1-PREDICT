import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useLapSeries } from '../../hooks/useLapSeries';
import { useRaceStore } from '../../stores/raceStore';
import { useShallow } from 'zustand/react/shallow';

export default function PitStopTimeline() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { fullSeries, visibleData } = useLapSeries();
    const simulationState = useRaceStore(useShallow(s => s.simulationState));
    const dataSource = useRaceStore(useShallow(s => s.dataSource));

    // Stops are points where tyre compound changes or explicitly marked as pit
    const pitData = useMemo(() => {
        const stops: { driverId: string, lap: number, compound: string }[] = [];

        const driverLaps = new Map<string, typeof fullSeries>();
        fullSeries.forEach(d => {
            if (!driverLaps.has(d.driverId)) driverLaps.set(d.driverId, []);
            driverLaps.get(d.driverId)!.push(d);
        });

        driverLaps.forEach((laps, driverId) => {
            laps.sort((a, b) => a.lap - b.lap);
            for (let i = 1; i < laps.length; i++) {
                if (laps[i].tyre !== laps[i - 1].tyre) {
                    stops.push({ driverId, lap: laps[i].lap, compound: laps[i].tyre });
                }
            }
        });
        return stops;
    }, [fullSeries]);

    const drivers = useMemo(() => {
        return Array.from(new Set(fullSeries.map(d => d.driverId)));
    }, [fullSeries]);

    // Determine cutoff lap for highlighting
    const currentLap = visibleData.length > 0 ? d3.max(visibleData, d => d.lap) || 1 : 1;

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        // Gate: Empty State
        if (simulationState === "empty") {
            const svg = d3.select(svgRef.current);
            svg.selectAll('*').remove();
            return;
        }

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 20, right: 30, bottom: 30, left: 60 };

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const x = d3.scaleLinear()
            .domain([1, 50]) // Approx race distance
            .range([margin.left, width - margin.right]);

        const y = d3.scaleBand()
            .domain(drivers)
            .range([margin.top, height - margin.bottom])
            .padding(0.2);

        // Driver rows
        svg.append("g")
            .selectAll("line")
            .data(drivers)
            .enter()
            .append("line")
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("y1", d => (y(d) || 0) + y.bandwidth() / 2)
            .attr("y2", d => (y(d) || 0) + y.bandwidth() / 2)
            .attr("stroke", "#222")
            .attr("stroke-dasharray", "2 2");

        // Pit marks
        svg.append("g")
            .selectAll("circle")
            .data(pitData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.lap))
            .attr("cy", d => (y(d.driverId) || 0) + y.bandwidth() / 2)
            .attr("r", 4)
            .attr("fill", d => d.compound === "SOFT" ? "#E10600" : d.compound === "MEDIUM" ? "#FFD700" : "#FFF")
            .attr("stroke", d => d.lap <= currentLap ? "#fff" : "none") // Highlight past stops
            .attr("stroke-width", 1)
            .attr("opacity", d => d.lap <= currentLap ? 1 : 0.5); // Dim future stops

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10))
            .attr("color", "#666");

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .attr("color", "#666");

        // Current Lap Line
        if (currentLap) {
            svg.append("line")
                .attr("x1", x(currentLap))
                .attr("x2", x(currentLap))
                .attr("y1", margin.top)
                .attr("y2", height - margin.bottom)
                .attr("stroke", "#E10600")
                .attr("stroke-dasharray", "4 2");
        }
    }, [drivers, pitData, currentLap, simulationState]);

    if (simulationState === "empty") {
        return <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">Run simulation to view strategy</div>;
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
