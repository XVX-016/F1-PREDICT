import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataPoint {
    lap: number;
    p50: number; // Median
    p05: number; // 5th percentile
    p95: number; // 95th percentile
}

interface StrategyFanChartProps {
    data: DataPoint[];
    width?: number;
    height?: number;
}

export const StrategyFanChart: React.FC<StrategyFanChartProps> = ({ data, width = 800, height = 400 }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 40, right: 30, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.lap) || 0, d3.max(data, d => d.lap) || 57])
            .range([0, innerWidth]);

        const allValues = data.flatMap(d => [d.p05, d.p95, d.p50]);
        const yScale = d3.scaleLinear()
            .domain([d3.min(allValues) || 0, d3.max(allValues) || 120])
            .range([innerHeight, 0])
            .nice();

        // Axes
        const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d => `L${d}`);
        const yAxis = d3.axisLeft(yScale).tickFormat(d => `${d}s`);

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

        // Grid Lines
        g.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.05)
            .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ""));

        // Draw the "Fan" - Shaded area for p05-p95 (90% Confidence)
        const area90 = d3.area<DataPoint>()
            .x(d => xScale(d.lap))
            .y0(d => yScale(d.p05))
            .y1(d => yScale(d.p95))
            .curve(d3.curveBasis);

        // Confidence Fan
        g.append("path")
            .datum(data)
            .attr("fill", "rgba(225, 6, 0, 0.1)")
            .attr("d", area90);

        // Expected Path (Median)
        const line = d3.line<DataPoint>()
            .x(d => xScale(d.lap))
            .y(d => yScale(d.p50))
            .curve(d3.curveBasis);

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#E10600")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Horizontal threshold line (Current Gap/Target)
        g.append("line")
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .attr("y1", yScale(data[0].p50))
            .attr("y2", yScale(data[0].p50))
            .attr("stroke", "#1f1f26")
            .attr("stroke-width", 1.5);

    }, [data, width, height]);

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
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
