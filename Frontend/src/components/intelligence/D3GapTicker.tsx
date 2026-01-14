import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Activity } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';

interface D3GapTickerProps {
    raceId: string;
    onDriverClick?: (driverId: string) => void;
}

interface DriverData {
    id: string;
    gap: number;
    delta: number;
    position: number;
}

export const D3GapTicker: React.FC<D3GapTickerProps> = ({ raceId, onDriverClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { snapshot } = useTelemetry(raceId, true);

    // Prepare data
    const driversData: DriverData[] = snapshot ? Object.entries(snapshot.drivers || {})
        .map(([id, data]: [string, any], index) => ({
            id,
            gap: data.gap || 0,
            delta: data.delta || 0, // Assume backend provides delta or we derive it
            position: index + 1 // Sort by gap if needed
        }))
        .sort((a, b) => a.gap - b.gap) : [];

    useEffect(() => {
        if (!svgRef.current || !driversData.length) return;

        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        const margin = { top: 10, right: 60, bottom: 10, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(driversData, d => d.gap) || 30])
            .range([0, innerWidth]);

        const yScale = d3.scaleBand()
            .domain(driversData.map(d => d.id))
            .range([0, innerHeight])
            .padding(0.3);

        const g = svg.selectAll('.container-group').data([null]);
        const gEnter = g.enter().append('g').attr('class', 'container-group')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const container = g.merge(gEnter as any);

        // GRID LINES (Muted Graphite)
        const gridLines = container.selectAll('.grid-line').data(xScale.ticks(5));
        gridLines.enter().append('line')
            .attr('class', 'grid-line')
            .merge(gridLines as any)
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', 'rgba(255, 255, 255, 0.05)')
            .attr('stroke-width', 1);
        gridLines.exit().remove();

        // BARS
        const bars = container.selectAll('.driver-bar').data(driversData, (d: any) => d.id);

        const barsEnter = bars.enter().append('rect')
            .attr('class', 'driver-bar')
            .attr('y', d => yScale(d.id) || 0)
            .attr('x', 0)
            .attr('height', yScale.bandwidth())
            .attr('width', 0)
            .attr('rx', 2)
            .style('cursor', 'pointer')
            .on('click', (_, d) => onDriverClick?.(d.id));

        bars.merge(barsEnter as any)
            .transition()
            .duration(600)
            .ease(d3.easeCubicOut)
            .attr('y', d => yScale(d.id) || 0)
            .attr('width', d => Math.max(xScale(d.gap), 2))
            .attr('fill', d => {
                if (d.gap === 0) return '#ffffff'; // Leader
                if (d.delta < 0) return '#22c55e'; // Gaining
                if (d.delta > 0.05) return '#f59e0b'; // Losing significantly
                return 'rgba(255, 255, 255, 0.2)'; // Stable
            })
            .style('opacity', 1);

        bars.exit().remove();

        // LABELS
        const labels = container.selectAll('.driver-label').data(driversData, (d: any) => d.id);

        labels.enter().append('text')
            .attr('class', 'driver-label')
            .attr('x', -10)
            .attr('text-anchor', 'end')
            .attr('alignment-baseline', 'middle')
            .attr('fill', '#ffffff')
            .style('font-family', 'JetBrains Mono')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text(d => d.id)
            .merge(labels as any)
            .transition()
            .duration(600)
            .attr('y', d => (yScale(d.id) || 0) + yScale.bandwidth() / 2);

        labels.exit().remove();

        // VALUES
        const values = container.selectAll('.gap-value').data(driversData, (d: any) => d.id);

        values.enter().append('text')
            .attr('class', 'gap-value')
            .attr('text-anchor', 'start')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'rgba(255,255,255,0.4)')
            .style('font-family', 'JetBrains Mono')
            .style('font-size', '9px')
            .merge(values as any)
            .transition()
            .duration(600)
            .attr('x', d => xScale(d.gap) + 8)
            .attr('y', d => (yScale(d.id) || 0) + yScale.bandwidth() / 2)
            .text(d => d.gap === 0 ? 'LEADER' : `+${d.gap.toFixed(3)}s`);

        values.exit().remove();

    }, [driversData, onDriverClick]);

    return (
        <div className="relative carbon-fiber border-y border-white/5 py-3 h-[180px] w-full bg-[#0a0a0a]">
            <div className="absolute top-2 left-4 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 z-10">
                <Activity className="w-3 h-3" />
                Live Interval Intelligence
            </div>
            <div className="carbon-fiber-overlay w-full h-full px-4">
                <svg ref={svgRef} className="w-full h-full overflow-visible" />
            </div>
        </div>
    );
};
