import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface TyreData {
    lap: number;
    health: number; // 0 to 1
    lapTime: number;
}

interface TyreHeatmapProps {
    data: TyreData[];
    width?: number;
    height?: number;
}

export const TyreHeatmap: React.FC<TyreHeatmapProps> = ({ data, width = 600, height = 150 }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 10, right: 10, bottom: 20, left: 10 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleLinear()
            .domain([0, data.length - 1])
            .range([0, innerWidth]);

        // Color scale from Green (1.0) to Yellow (0.5) to Red (0.0)
        const colorScale = d3.scaleLinear<string>()
            .domain([0, 0.4, 0.7, 1.0])
            .range(["#ef4444", "#f59e0b", "#10b981", "#059669"]);

        // Draw bars
        const barWidth = innerWidth / data.length;

        g.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", (d, i) => xScale(i))
            .attr("y", 0)
            .attr("width", barWidth - 1)
            .attr("height", innerHeight)
            .attr("fill", d => colorScale(d.health))
            .attr("opacity", 0.8)
            .attr("rx", 2)
            .append("title")
            .text(d => `Lap ${d.lap}: ${(d.health * 100).toFixed(1)}% Health`);

        // Add glowing filter for critical health
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "heat-glow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");

        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2")
            .attr("result", "blur");

        // Highlight low health areas
        g.selectAll("circle")
            .data(data.filter(d => d.health < 0.3))
            .join("circle")
            .attr("cx", (d, i) => xScale(data.indexOf(d)) + barWidth / 2)
            .attr("cy", innerHeight / 2)
            .attr("r", barWidth * 2)
            .attr("fill", "#ef4444")
            .attr("opacity", 0.3)
            .attr("filter", "url(#heat-glow)");

    }, [data, width, height]);

    return (
        <div className="w-full h-full p-2 bg-black/20 rounded-xl">
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
            />
        </div>
    );
};
