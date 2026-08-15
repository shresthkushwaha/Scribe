'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SwampSession, SwampPersona } from '@/lib/services/swampBrain';
import { X, Info, WarningCircle, Cube, Users } from '@phosphor-icons/react';

interface SwampMapProps {
  session: SwampSession;
  onClose: () => void;
}

export default function SwampMap({ session, onClose }: SwampMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPersona, setSelectedPersona] = useState<SwampPersona | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 1000;
    const height = 1000;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `[-550, -550, 1100, 1100]`);

    svg.selectAll('*').remove();

    // 1. Background Grid / Topography (Simplistic Heatmap)
    const g = svg.append('g').attr('class', 'main-g');

    // Concentric circles for topographic depth
    for (let r = 100; r <= 600; r += 100) {
      g.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#f0f0f5')
        .attr('stroke-width', 1);
    }

    // 2. Render Topographic Anchors (Centers of Gravity)
    session.anchors.forEach(anchor => {
      const anchorG = g.append('g')
        .attr('transform', `translate(${anchor.x}, ${anchor.y})`);
      
      // Halo for gravity
      anchorG.append('circle')
        .attr('r', anchor.weight * 18)
        .attr('fill', 'url(#anchorGradient)')
        .attr('opacity', 0.15);

      anchorG.append('circle')
        .attr('r', 4)
        .attr('fill', '#6366f1')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);

      anchorG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', -anchor.weight * 18 - 8)
        .attr('class', 'text-[10px] font-black uppercase tracking-[0.2em] fill-indigo-900/40')
        .text(anchor.name);
    });

    // 2.5 Link Personas to Anchors (Node Connections)
    session.personas.forEach(persona => {
      const px = persona.x ?? 0;
      const py = persona.y ?? 0;

      // Find nearest anchor
      let nearest = session.anchors[0];
      let minDist = Infinity;
      
      session.anchors.forEach(anchor => {
        const d = Math.sqrt(Math.pow(px - anchor.x, 2) + Math.pow(py - anchor.y, 2));
        if (d < minDist) {
          minDist = d;
          nearest = anchor;
        }
      });

      if (nearest) {
        g.append('line')
          .attr('x1', px)
          .attr('y1', py)
          .attr('x2', nearest.x)
          .attr('y2', nearest.y)
          .attr('stroke', '#6366f1')
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '2 4')
          .attr('opacity', 0.15);
      }

      // Also link to Epicenter if close
      const distToEpi = Math.sqrt(Math.pow(px - session.epicenter.x, 2) + Math.pow(py - session.epicenter.y, 2));
      if (distToEpi < 250) {
        g.append('line')
          .attr('x1', px)
          .attr('y1', py)
          .attr('x2', session.epicenter.x)
          .attr('y2', session.epicenter.y)
          .attr('stroke', '#ff4d4d')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '1 3')
          .attr('opacity', 0.2);
      }
    });

    // 3. Render Epicenter (The Pulse)
    const epiG = g.append('g')
      .attr('transform', `translate(${session.epicenter.x}, ${session.epicenter.y})`);

    // Triple pulse animation
    [0, 1, 2].forEach(i => {
      epiG.append('circle')
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', '#ff4d4d')
        .attr('stroke-width', 2)
        .append('animate')
          .attr('attributeName', 'r')
          .attr('from', 10)
          .attr('to', 40)
          .attr('dur', '2s')
          .attr('begin', `${i * 0.6}s`)
          .attr('repeatCount', 'indefinite');

      epiG.append('circle')
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', '#ff4d4d')
        .attr('stroke-width', 2)
        .append('animate')
          .attr('attributeName', 'opacity')
          .attr('from', 1)
          .attr('to', 0)
          .attr('dur', '2s')
          .attr('begin', `${i * 0.6}s`)
          .attr('repeatCount', 'indefinite');
    });

    // Epicenter Label
    epiG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 50)
      .attr('class', 'text-[14px] font-black fill-red-600')
      .text(session.epicenter.label.toUpperCase());

    // 4. Render Persona Nodes
    const nodeG = g.selectAll('.persona-node')
      .data(session.personas)
      .enter()
      .append('g')
      .attr('class', 'persona-node cursor-pointer')
      .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
      .on('click', (event, d) => setSelectedPersona(d));

    nodeG.append('circle')
      .attr('r', 8)
      .attr('fill', '#fff')
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('class', 'hover:scale-150 transition-transform');

    nodeG.append('text')
      .attr('dy', 20)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[8px] font-mono fill-gray-500 opacity-0 hover:opacity-100')
      .text(d => d.name);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [session]);

  return (
    <div className="fixed inset-0 bg-[#f8f8fb] z-100 flex animate-in fade-in duration-500">
      <div className="flex-1 relative overflow-hidden">
        <svg ref={svgRef} className="w-full h-full">
          <defs>
            <radialGradient id="anchorGradient">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#f8f8fb" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* HUD Overlay */}
        <div className="absolute top-8 left-8 p-6 bg-white rounded-[32px] border border-[#eaeaec] shadow-2xl max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <WarningCircle size={24} weight="fill" className="text-red-500" />
            <div>
              <h1 className="text-[18px] font-black tracking-tight">{session.epicenter.label}</h1>
              <p className="text-[12px] text-gray-400 font-mono">Epicenter of Friction</p>
            </div>
          </div>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
            {session.epicenter.description}
          </p>
          <div className="pt-4 border-t border-[#f0f0f0] flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
             Swarm Density: 30 Experts
             <Cube size={16} />
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white border border-[#eaeaec] flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      {/* Side Panel: Persona Critique */}
      <div className={`w-[400px] border-l border-[#eaeaec] bg-white p-10 flex flex-col transition-transform duration-500 ${selectedPersona ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedPersona ? (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={() => setSelectedPersona(null)} className="mb-8 p-2 hover:bg-gray-100 rounded-full">
              <X size={16} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-[24px] bg-indigo-50 text-indigo-500 flex items-center justify-center font-black text-xl">
                {selectedPersona.id.split('_')[0]}
              </div>
              <div>
                <h3 className="text-[20px] font-black">{selectedPersona.name}</h3>
                <p className="text-[12px] text-indigo-500 font-bold uppercase tracking-widest">{selectedPersona.role}</p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-[30px] border border-[#eaeaec] mb-8">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase text-gray-400">
                <Info size={14} />
                Cognitive Bias
              </div>
              <p className="text-[14px] text-gray-600 italic">"{selectedPersona.bias}"</p>
            </div>

            <div className="space-y-4">
               <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Expert Critique</h4>
               <p className="text-[16px] text-[#111] leading-relaxed font-serif">
                 {selectedPersona.critique}
               </p>
            </div>

            <button className="mt-auto w-full py-4 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
              Address Friction
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
            <Users size={64} weight="thin" className="mb-6" />
            <p className="text-[14px] font-medium text-gray-400">Select a persona node on the topographic map to view their specific expert critique.</p>
          </div>
        )}
      </div>
    </div>
  );
}
