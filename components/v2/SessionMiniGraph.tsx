'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GigaWorkbenchSession, GigaSatellite } from '@/lib/services/oracleGigaBrain';
import { Browsers } from '@phosphor-icons/react';

export default function SessionMiniGraph({ session }: { session: GigaWorkbenchSession }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !session.nodes.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 300;
    
    const buildTree = (nodes: GigaSatellite[], parentId?: string): any => {
      return nodes.filter(n => n.parentId === parentId).map(n => ({
        name: n.name,
        children: buildTree(nodes, n.id)
      }));
    };

    const data: any = {
      name: session.type.toUpperCase(),
      children: buildTree(session.nodes, undefined)
    };
    
    const root = d3.hierarchy(data);
    const treeLayout = d3.cluster().size([360, 110]);
    treeLayout(root);

    const g = svg.append("g").attr("transform", "translate(200, 150)");

    const colors = session.type === 'scamper' 
      ? ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
      : session.type === 'first-principles' ? ["#10b981", "#059669", "#047857", "#064e3b"]
      : ["#6366f1", "#4f46e5", "#4338ca", "#3730a3"];

    // Draw links radiating from center
    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("d", d3.linkRadial<any, any>().angle((d: any) => d.x * Math.PI / 180).radius((d: any) => d.y) as any)
      .attr("fill", "none")
      .attr("stroke", (d, i) => session.type === 'scamper' ? colors[i % colors.length] : "var(--border-soft)")
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0.5);

    // Draw nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("transform", (d: any) => `rotate(${d.x - 90}) translate(${d.y},0)`);

    node.append("circle")
      .attr("r", (d: any) => d.depth === 0 ? 10 : 6)
      .attr("fill", (d, i) => d.depth === 0 ? "var(--ink)" : (session.type === 'scamper' ? colors[i % colors.length] : colors[0]))
      .attr("stroke", "var(--bg-card)")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => d.x < 180 === (d.depth > 0) ? 14 : -14)
      .attr("text-anchor", (d: any) => d.x < 180 === (d.depth > 0) ? "start" : "end")
      .attr("transform", (d: any) => d.x >= 180 ? "rotate(180)" : null)
      .text((d: any) => d.data.name)
      .style("font-size", (d: any) => d.depth === 0 ? "12px" : "10px")
      .style("font-weight", "900")
      .style("font-family", "Inter, sans-serif")
      .style("fill", "var(--ink)");

  }, [session]);

  return (
    <div className="relative w-full aspect-video bg-(--bg-muted) rounded-2xl border border-(--border) overflow-hidden group/graph">
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" />
      <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-(--bg-card)/80 backdrop-blur-sm rounded-lg border border-(--border-soft)">
         <Browsers size={10} className="text-(--ink-light)" />
         <span className="text-[8px] font-bold uppercase tracking-tighter text-(--ink-dim)">Giga Map Session Graph</span>
      </div>
    </div>
  );
}
