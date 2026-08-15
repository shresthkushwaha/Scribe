'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArrowsClockwise, Lightning } from '@phosphor-icons/react';
import { V2Block } from '@/lib/services/scribeV2Db';
import ContextMenu from './ContextMenu';
import { generateMutationBox, placeMutationBox } from '@/lib/services/mutationEngine';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import { Point } from '@/lib/utils/spatial';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'hub' | 'node';
  role?: 'constraint' | 'metric' | 'insight' | 'question';
  hubId?: string;
  isScamper?: boolean;
  scamperType?: string;
  logic?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  type: 'supports' | 'contradicts' | 'belongs';
}

export default function D3PhysicsEngine({ block }: { block: V2Block }) {
  const { addScamperNodes } = useScribeV2Store();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = React.useState<{ x: number, y: number, nodeId: string, label: string } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !block.data) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);

    // Mock Data Preparation (until Brain is ready)
    const { hubs, nodes, edges } = block.data;

    const d3Nodes: Node[] = [
      ...hubs.map((h: any) => ({ ...h, type: 'hub' as const })),
      ...nodes.map((n: any) => ({ ...n, type: 'node' as const }))
    ];

    const d3Links: Link[] = [
      ...edges.map((e: any) => ({ ...e })),
      // Synthetic 'belongs' links to keep nodes near their hubs
      ...nodes.map((n: any) => ({ 
        source: n.hubId, 
        target: n.id, 
        type: 'belongs' as const 
      }))
    ];

    const simulation = d3.forceSimulation<Node>(d3Nodes)
      .force('link', d3.forceLink<Node, Link>(d3Links).id(d => d.id).distance(d => d.type === 'belongs' ? 80 : 150))
      .force('charge', d3.forceManyBody<Node>().strength((d: Node) => d.type === 'hub' ? -2000 : -200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<Node>().radius((d: Node) => d.type === 'hub' ? 60 : 20));

    // Render Links
    const link = g.append('g')
      .selectAll('path')
      .data(d3Links.filter(l => l.type !== 'belongs'))
      .enter().append('path')
      .attr('stroke', l => l.type === 'supports' ? '#22c55e' : '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', l => l.type === 'contradicts' ? '5,5' : 'none')
      .attr('fill', 'none')
      .attr('opacity', 0.6);

    // Render Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(d3Nodes)
      .enter().append('g')
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          nodeId: d.id,
          label: d.name
        });
      })
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Hub circles
    node.filter(d => d.type === 'hub')
      .append('circle')
      .attr('r', 40)
      .attr('fill', '#1a1a1a')
      .attr('stroke', '#ff4d00')
      .attr('stroke-width', 2);

    // Node circles
    node.filter(d => d.type === 'node')
      .append('circle')
      .attr('r', d => d.isScamper ? 12 : 8)
      .attr('fill', d => d.isScamper ? '#ff4d00' : '#d4d4d4')
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 2);

    // SCAMPER specific icons / labels inside circles
    node.filter(d => d.isScamper === true)
      .append('text')
      .text(d => d.scamperType || '')
      .attr('font-size', '10px')
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-weight', 'black')
      .attr('class', 'pointer-events-none select-none');

    // Labels
    node.append('text')
      .text(d => d.name)
      .attr('font-size', d => d.type === 'hub' ? '12px' : '8px')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'hub' ? 65 : 18)
      .attr('font-weight', d => d.type === 'hub' ? 'bold' : 'normal')
      .attr('class', 'pointer-events-none select-none uppercase tracking-tighter');

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        return `M ${d.source.x} ${d.source.y} Q ${(d.source.x + d.target.x) / 2} ${(d.source.y + d.target.y) / 2 + 20} ${d.target.x} ${d.target.y}`;
      });

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => { simulation.stop(); };
  }, [block.data]);

  const handleMutation = async (technique: string = 'scamper-divergence') => {
    if (!contextMenu) return;
    setIsProcessing(true);

    const anchorNode = [...block.data.hubs, ...block.data.nodes].find(n => n.id === contextMenu.nodeId);
    if (!anchorNode) return;

    // Prepare occupied area for collision avoidance
    const occupied = [...block.data.hubs, ...block.data.nodes].map(n => ({
      x: n.x || 0,
      y: n.y || 0,
      r: n.type === 'hub' ? 60 : 20
    }));

    const result = await generateMutationBox(
      technique,
      { 
        id: anchorNode.id, 
        label: anchorNode.name, 
        text: anchorNode.summary || anchorNode.name, 
        x: anchorNode.x || 0, 
        y: anchorNode.y || 0 
      },
      occupied
    );

    if (result) {
      // Find a void space for the new cluster
      const center = placeMutationBox(
        { x: anchorNode.x || 0, y: anchorNode.y || 0 },
        occupied,
        { width: containerRef.current?.clientWidth || 1000, height: containerRef.current?.clientHeight || 1000 }
      );

      const satellites = result.satellites.map(s => ({
        ...s,
        fx: center.x + s.coords.x,
        fy: center.y + s.coords.y
      }));

      addScamperNodes(block.id, anchorNode.id, satellites, result.jolt);
    }

    setIsProcessing(false);
    setContextMenu(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full" onClick={() => setContextMenu(null)}>
      {(isProcessing || !block.data) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20 z-50 bg-black/20 backdrop-blur-sm">
          <ArrowsClockwise size={48} className="animate-spin text-[#ff4d00]" />
          <span className="text-xs uppercase tracking-[0.4em] font-black text-[#ff4d00]">
            {isProcessing ? 'Mutating Graph Space' : 'Waiting for Synthesis'}
          </span>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full outline-none" />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeLabel={contextMenu.label}
          onClose={() => setContextMenu(null)}
          onScamper={() => handleMutation('scamper-divergence')}
        />
      )}
    </div>
  );
}
