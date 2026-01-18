import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface PaceChartProps {
    paceSeries: { [driverId: string]: number[] }; // { VER: [0.1, -0.2, ...], ... }
    width?: number;
    height?: number;
}

const PaceChart: React.FC<PaceChartProps> = ({ paceSeries, width = 800, height = 300 }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !paceSeries || Object.keys(paceSeries).length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        // Laps on X axis (assuming 60 laps)
        const maxLaps = Math.max(...Object.values(paceSeries).map(arr => arr.length)) || 60;
        const xScale = d3.scaleLinear()
            .domain([1, maxLaps])
            .range([0, innerWidth]);

        // Pace Delta on Y axis (LOCKED as per requirements: ±2.5s)
        const yScale = d3.scaleLinear()
            .domain([-2.5, 2.5])
            .range([innerHeight, 0]);

        // Axes
        const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d => `L${d}`);
        const yAxis = d3.axisLeft(yScale).tickFormat(d => {
            const val = d as number;
            return `${val > 0 ? '+' : ''}${val}s`;
        });

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .attr("font-family", "JetBrains Mono, monospace")
            .attr("font-size", "9px")
            .attr("color", "#6B7280");

        g.append("g")
            .call(yAxis)
            .attr("font-family", "JetBrains Mono, monospace")
            .attr("font-size", "9px")
            .attr("color", "#6B7280");

        // Zero line
        g.append("line")
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "#1f1f26")
            .attr("stroke-width", 2);

        // Grid lines (horizontal only)
        g.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.05)
            .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ""));

        // Lines for each driver
        const lineGenerator = d3.line<number>()
            .x((_, i) => xScale(i + 1))
            .y(d => yScale(d))
            .curve(d3.curveMonotoneX);

        // Color scale for drivers
        const colors = ["#E10600", "#3671C6", "#6CD3BF", "#F58020", "#F91536", "#FFFFFF", "#2293D1", "#B6BABD", "#5E8FAA", "#27F4D2"];

        Object.entries(paceSeries).forEach(([driverId, series], index) => {
            const color = colors[index % colors.length];

            g.append("path")
                .datum(series)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", driverId === 'VER' ? 3 : 1.5) // Highlighted for demo
                .attr("opacity", 0.8)
                .attr("d", lineGenerator);

            // Legend entry (simplified)
            if (index < 5) { // Only top 5 in legend to avoid clutter
                const legendX = innerWidth - 80;
                const legendY = 10 + (index * 15);

                g.append("circle")
                    .attr("cx", legendX)
                    .attr("cy", legendY)
                    .attr("r", 4)
                    .attr("fill", color);

                g.append("text")
                    .attr("x", legendX + 10)
                    .attr("y", legendY + 4)
                    .text(driverId)
                    .attr("fill", "#9AA1AC")
                    .attr("font-family", "JetBrains Mono, monospace")
                    .attr("font-size", "9px")
                    .attr("font-weight", "bold");
            }
        });

    }, [paceSeries, width, height]);

    return (
        <div className="w-full h-full">
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
            />
        </div>
    );
};

export default PaceChart;
