'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ArrowCounterClockwise } from '@phosphor-icons/react';
import { useStore, ScribeNode, ScribeLink } from '../lib/store';
import Note from './Note';
import { motion, AnimatePresence } from 'framer-motion';

const LENS_CONFIGS = {
    WEAVER: { charge: -30, gravity: 0.05, linkDist: 100 },
    ANALYST: { charge: -100, gravity: 0.1, linkDist: 150 },
    EXPERIMENTAL: { charge: -50, gravity: 0.02, linkDist: 120 },
};

export default function Canvas() {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<SVGGElement>(null);
    const {
        nodes, links, lens, setLens,
        activeNodeId, centerNodeId, hoverNodeId,
        isolateNode, expandNode, resetGraph
    } = useStore();

    const simRef = useRef<d3.Simulation<any, any> | null>(null);

    // --- PHYSICS ENGINE ---
    useEffect(() => {
        if (simRef.current) simRef.current.stop();

        const config = LENS_CONFIGS[lens];

        const sim = d3.forceSimulation(nodes as any)
            .force("charge", d3.forceManyBody().strength((d: any) => {
                return d.id === centerNodeId ? -500 : config.charge;
            }))
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(config.linkDist))
            .force("collision", d3.forceCollide().radius((d: any) => (d.r || 40) + 20))

            // Adaptation for Lenses
            .force("x", d3.forceX((d: any) => {
                if (lens === 'WEAVER' && d.type === 'SENTENCE' && d.index !== undefined) {
                    return (d.index * 60) - (nodes.length * 15);
                }
                return window.innerWidth / 2;
            }).strength((d: any) => (lens === 'WEAVER' && d.type === 'SENTENCE' ? 0.8 : config.gravity)))

            .force("y", d3.forceY(window.innerHeight / 2).strength(config.gravity))

            .on("tick", () => {
                if (!wrapperRef.current) return;

                // Link update
                d3.select(wrapperRef.current)
                    .selectAll('.link')
                    .attr('x1', (d: any) => d.source.x)
                    .attr('y1', (d: any) => d.source.y)
                    .attr('x2', (d: any) => d.target.x)
                    .attr('y2', (d: any) => d.target.y);

                // Node update
                d3.select(wrapperRef.current)
                    .selectAll('.node-group')
                    .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
            });

        simRef.current = sim;
        return () => { sim.stop(); };
    }, [nodes, links, lens, centerNodeId]);

    // --- ZOOM ---
    useEffect(() => {
        if (!svgRef.current) return;
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (e) => {
                if (wrapperRef.current) wrapperRef.current.setAttribute('transform', e.transform.toString());
            });
        d3.select(svgRef.current).call(zoom as any);
    }, []);

    const handleNodeClick = (id: string) => {
        if (!centerNodeId) {
            isolateNode(id);
        } else if (id === centerNodeId) {
            // Option: reset or do nothing
        } else {
            expandNode(id);
        }
        simRef.current?.alpha(1).restart();
    };

    return (
        <div className="w-screen h-screen bg-[#050505] overflow-hidden relative">
            {/* Lens Selector */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex gap-1 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
                {(['WEAVER', 'ANALYST', 'EXPERIMENTAL'] as const).map((l) => (
                    <button
                        key={l}
                        onClick={() => setLens(l as any)}
                        className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all ${lens === l
                            ? "bg-white text-black shadow-lg"
                            : "text-white/40 hover:text-white/80"
                            }`}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {/* Navigation Tools */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
                <button
                    onClick={resetGraph}
                    className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
                    title="Reset View"
                >
                    <ArrowCounterClockwise size={20} weight="bold" />
                </button>
            </div>

            <svg ref={svgRef} className="w-full h-full">
                <g ref={wrapperRef}>
                    {/* Links */}
                    {links.map((l, i) => {
                        const sId = typeof l.source === 'string' ? l.source : l.source.id;
                        const tId = typeof l.target === 'string' ? l.target : l.target.id;
                        const isRelated = hoverNodeId === sId || hoverNodeId === tId || activeNodeId === sId || activeNodeId === tId;

                        return (
                            <line
                                key={`${sId}-${tId}-${i}`}
                                className="link transition-all"
                                stroke="white"
                                strokeOpacity={isRelated ? 0.4 : 0.05}
                                strokeWidth={isRelated ? 2 : 1}
                                strokeDasharray={l.type === 'SEMANTIC' ? "4 4" : "none"}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((n) => (
                        <g
                            key={n.id}
                            className="node-group cursor-pointer"
                            onClick={() => handleNodeClick(n.id)}
                        >
                            <Note node={n} />
                        </g>
                    ))}
                </g>
            </svg>

            {/* Perspective Info */}
            <div className="fixed bottom-8 left-8 z-50">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${centerNodeId ? 'bg-orange-500 animate-pulse' : 'bg-white/20'}`} />
                        <span>{centerNodeId ? 'Isolated' : 'Atlas'}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <span>{nodes.length} Nodes</span>
                </div>
            </div>
        </div>
    );
}
