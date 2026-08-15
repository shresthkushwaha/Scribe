import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { synthesizeOracleGigaMap, askWorkbenchOracle, getGigaMapCacheKey, GigaMapData, GigaSatellite, GigaGhostLink, GigaWorkbenchSession } from '@/lib/services/oracleGigaBrain';
import { synthesizeStrategistGigaMap } from '@/lib/services/strategistGigaBrain';
import { CircleNotch, X, Lightning, MagicWand, ExclamationMark, Graph, Intersect, SquaresFour, ArrowCounterClockwise, Target, GlobeSimple, Warning, Browsers, Ghost, ShieldCheck, Path, ChartPieSlice, Fingerprint } from '@phosphor-icons/react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';

import SessionMiniGraph from './v2/SessionMiniGraph';

const BRANCH_COLORS = ['#e91e63', '#9c27b0', '#4caf50', '#ff5722', '#00bcd4', '#607d8b'];

export default function OracleGigaMap({ 
  sourceContent, onClose, noteId, mode = 'oracle', onNodeSelect: propOnNodeSelect, onDataGenerated 
}: { 
  sourceContent: string; 
  onClose: () => void; 
  noteId?: string; 
  mode?: 'oracle' | 'strategist'; 
  onNodeSelect?: (nodeId: string | null) => void;
  onDataGenerated?: (data: GigaMapData) => void;
}) {
  const { oracleSessions, addOracleSession, removeOracleSession } = useScribeV2Store();
  const [data, setData] = useState<GigaMapData | null>(null);
  useEffect(() => { console.log("OracleGigaMap: Mounting - Checking for ghost references..."); }, []);
  const [isSynthesizing, setIsSynthesizing] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState<{ id: string, name: string, type: string, summary?: string, clusterId?: string }[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const previousPositions = useRef<Map<string, {x: number, y: number, vx: number, vy: number}>>(new Map());
  const previousSessionCount = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const synth = mode === 'oracle' ? synthesizeOracleGigaMap : synthesizeStrategistGigaMap;
    // Track if component unmounted to prevent state updates on unmounted component
    let isActive = true;
    
    synth(sourceContent).then(res => {
      if (isActive && res) {
          setData(res);
          setIsSynthesizing(false);
          if (onDataGenerated) onDataGenerated(res);
      }
    });

    return () => { isActive = false; };
  }, [sourceContent, mode]); // Removed onClose to prevent extreme rendering loops

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;

    svg.selectAll('*').remove();
    const g = svg.append('g');

    const currentTransform = d3.zoomTransform(svg.node()!);
    const isFirstRender = currentTransform.k === 1 && currentTransform.x === 0 && currentTransform.y === 0;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 4])
      .filter((event) => {
        if (event.type === 'wheel') {
           return event.ctrlKey || event.metaKey; 
        }
        return !event.button; // Allow left-click to drag/pan
      })
      .on('zoom', (event) => g.attr('transform', event.transform));
    
    svg.call(zoom).on('dblclick.zoom', null);

    const sessions = oracleSessions || [];
    const isNewSession = previousSessionCount.current > 0 && sessions.length > previousSessionCount.current;
    
    if (!isFirstRender && !isNewSession) {
      svg.call(zoom.transform, currentTransform);
    } else if (isNewSession) {
      const newestSession = sessions[sessions.length - 1];
      let targetX = width / 2; let targetY = height / 2;
      if (newestSession.targetNodeIds && newestSession.targetNodeIds[0]) {
          // Temporarily mock the hierarchy tree construction to find the target's cartesian positions
      }
      svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity.translate(width/2 - targetX * 0.5, height/2 - targetY * 0.5).scale(0.5));
    } else {
      svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.15));
    }

    if (!data.pillars || !data.clusters || !data.leaves) return;

    // ── HIERARCHY ──
    const rootData = {
      id: 'root', name: '', type: 'root',
      children: (data.pillars || []).map((p, i) => ({
        ...p, type: 'pillar', color: BRANCH_COLORS[i % BRANCH_COLORS.length],
        children: (data.clusters || []).filter(c => c.pillarId === p.id).map(c => ({
          ...c, type: 'cluster', color: BRANCH_COLORS[i % BRANCH_COLORS.length],
          children: (data.leaves || []).filter(l => l.clusterId === c.id).map(l => ({
            ...l, type: 'leaf', color: BRANCH_COLORS[i % BRANCH_COLORS.length]
          }))
        }))
      }))
    };

    const root = d3.hierarchy(rootData);
    const MAX_RADIUS = 2800;
    const treeLayout = d3.cluster().size([2 * Math.PI, MAX_RADIUS]).separation((a, b) => (a.parent === b.parent ? 2 : 4) / a.depth);
    treeLayout(root as any);

    root.each((d: any) => {
      if (d.data.type === 'root') d.y = 0;
      if (d.data.type === 'pillar') d.y = 400;
      if (d.data.type === 'cluster') d.y = 1600;
      if (d.data.type === 'leaf') d.y = 2800;
      d.cartX = d.y * Math.cos(d.x - Math.PI / 2);
      d.cartY = d.y * Math.sin(d.x - Math.PI / 2);
    });

    const nodes = root.descendants();
    const links = root.links();

    // 1. Hierarchical links
    g.append('g').selectAll('line')
      .data(links.filter((l: any) => l.source.data.type !== 'root'))
      .enter().append('line')
      .attr('x1', (d: any) => d.source.cartX)
      .attr('y1', (d: any) => d.source.cartY)
      .attr('x2', (d: any) => d.target.cartX)
      .attr('y2', (d: any) => d.target.cartY)
      .attr('stroke', (d: any) => d.target.data.type === 'leaf' ? 'var(--tactical-border-soft)' : d.target.data.color)
      .attr('stroke-width', (d: any) => d.target.data.type === 'cluster' ? 1.5 : 0.5);

    // 2. Cross Links
    const crossLinks = (data.crossLinks || []).map(cl => {
      const source = nodes.find(n => n.data.id === cl.source);
      const target = nodes.find(n => n.data.id === cl.target);
      return { source, target };
    }).filter(cl => cl.source && cl.target);

    g.append('g').selectAll('path.cross-link')
      .data(crossLinks)
      .enter().append('path')
      .attr('class', 'cross-link')
      .attr('d', (d: any) => {
        const dx = d.target.cartX - d.source.cartX;
        const dy = d.target.cartY - d.source.cartY;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.cartX},${d.source.cartY}A${dr},${dr} 0 0,1 ${d.target.cartX},${d.target.cartY}`;
      })
      .attr('stroke', 'var(--swarm-red)').attr('stroke-width', 0.6).attr('stroke-dasharray', '2 4').attr('fill', 'none');

    // 3. Main Nodes
    const nodeG = g.append('g').selectAll('g.main-node')
      .data(nodes.filter((n: any) => n.data.type !== 'root'))
      .enter().append('g')
      .attr('class', 'main-node')
      .attr('transform', (d: any) => `translate(${d.cartX},${d.cartY})`)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        if (propOnNodeSelect) propOnNodeSelect(d.data.id);
        setSelectedNodes(prev => {
          const exists = prev.find(n => n.id === d.data.id);
          if (event.shiftKey || event.metaKey || event.ctrlKey) {
            return exists ? prev.filter(n => n.id !== d.data.id) : [...prev, d.data];
          }
          return exists && prev.length === 1 ? [] : [d.data];
        });
      });

    nodeG.each(function(d: any) {
      const el = d3.select(this);
      if (d.data.type === 'pillar') {
        const isLeftHalf = d.x > Math.PI;
        el.append('text').text(d.data.name.toUpperCase()).attr('font-size', '44px').attr('font-family', 'var(--font-inter, sans-serif)').attr('font-weight', '300').attr('fill', d.data.color)
          .attr('stroke', 'var(--tactical-bg)').attr('stroke-width', '10px').attr('stroke-linejoin', 'round').style('paint-order', 'stroke fill')
          .attr('text-anchor', isLeftHalf ? 'end' : 'start').attr('dx', isLeftHalf ? -20 : 20).attr('dominant-baseline', 'middle').attr('letter-spacing', '2px');
      } else if (d.data.type === 'cluster') {
        const title = d.data.name.toUpperCase();
        const w = title.length * 14 + 40;
        const isLeftHalf = d.x > Math.PI;
        const gWrapper = el.append('g').attr('transform', `translate(${isLeftHalf ? -w/2 - 16 : w/2 + 16}, 0)`);
        gWrapper.append('rect').attr('x', -w / 2).attr('y', -24).attr('width', w).attr('height', 48).attr('rx', 24).attr('fill', d.data.color);
        gWrapper.append('text').text(title).attr('font-size', '20px').attr('font-family', 'var(--font-inter, sans-serif)').attr('font-weight', 'bold').attr('fill', '#ffffff').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('letter-spacing', '1px');
      } else if (d.data.type === 'leaf') {
        const isMutated = d.data.name.includes('mut-');
        const isLeftHalf = d.x > Math.PI;
        
        // Strategist category colors - Using Swarm Tokens
        let leafColor = isMutated ? 'var(--swarm-red)' : 'var(--ink-dim)';
        if (mode === 'strategist' && d.data.category) {
          const cat = d.data.category.toUpperCase();
          if (cat === 'RISK') leafColor = 'var(--swarm-red)';
          else if (cat === 'OPPORTUNITY') leafColor = 'var(--swarm-mint)';
          else if (cat === 'INSIGHT') leafColor = 'var(--swarm-blue)';
          else if (cat === 'FACT') leafColor = 'var(--ink-dim)';
          else if (cat === 'QUESTION') leafColor = 'var(--accent-amber)';
          else if (cat === 'PATH') leafColor = 'var(--swarm-violet)';
        }

        el.append('text').text(d.data.name).attr('font-size', '20px').attr('font-family', 'var(--font-inter, sans-serif)').attr('fill', leafColor).attr('stroke', 'var(--tactical-bg)').attr('stroke-width', '6px').attr('stroke-linejoin', 'round').style('paint-order', 'stroke fill')
          .attr('text-anchor', isLeftHalf ? 'end' : 'start').attr('dx', isLeftHalf ? -18 : 18).attr('dominant-baseline', 'middle');
        el.append('circle').attr('r', 8).attr('fill', leafColor);
      }
    });

    // 4. Analysis Hubs & Sessions
    const satellites = data.satellites || [];
    const sessionsList = oracleSessions || [];
    
    const sessionHubs = sessionsList.map(s => ({
      id: `hub-${s.id}`, name: s.title, type: 'session-hub', protocol: s.type, isSessionHub: true, summary: s.summary, targetNodeIds: s.targetNodeIds
    }));

    const sessionNodes = sessionsList.flatMap(s => s.nodes.map((n: GigaSatellite) => ({ 
      ...n, sessionId: s.id, isSessionNode: true, hubId: `hub-${s.id}`, type: 'session-node'
    })));

    const simSatellites = [...satellites, ...sessionHubs, ...sessionNodes].map((s: any) => {
      const existing = previousPositions.current.get(s.id);
      let initX = width / 2; let initY = height / 2;
      
      if (existing) {
        return { ...s, isSatellite: true, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy };
      }
      
      if (s.type === 'session-hub' && s.targetNodeIds && s.targetNodeIds[0]) {
        const target = nodes.find((n: any) => n.data.id === s.targetNodeIds[0]) as any;
        if (target) { initX = target.cartX; initY = target.cartY; }
      } else if (s.isSessionNode) {
        const hub = previousPositions.current.get(s.hubId);
        if (hub) { initX = hub.x + (Math.random() - 0.5) * 50; initY = hub.y + (Math.random() - 0.5) * 50; }
      } else {
        initX = Math.random() * width; initY = Math.random() * height;
      }
      
      return { ...s, isSatellite: true, x: initX, y: initY };
    });
    
    // Pan animation logic after nodes are placed
    if (isNewSession) {
       const newestSession = sessions[sessions.length - 1];
       const hub = simSatellites.find(ss => ss.id === `hub-${newestSession.id}`);
       if (hub && hub.x !== undefined) {
          svg.transition().duration(1200).call(zoom.transform, d3.zoomIdentity.translate(width/2 - hub.x * 0.8, height/2 - hub.y * 0.8).scale(0.8));
       }
    }
    previousSessionCount.current = sessions.length;

    const ghostLinks = (data.ghostLinks || []).map(l => ({ ...l, type: 'ghost' }));
    const sessionToHubLinks = sessions.flatMap(s => s.nodes.filter((n: GigaSatellite) => !n.parentId).map((n: GigaSatellite) => ({ source: n.id, target: `hub-${s.id}`, type: 'session-inner' })));
    const sessionToSessionLinks = sessions.flatMap(s => s.nodes.filter((n: GigaSatellite) => n.parentId).map((n: GigaSatellite) => ({ source: n.id, target: n.parentId!, type: 'session-inner' })));
    const hubToTargetLinks = sessions.flatMap(s => s.targetNodeIds.map((tid: string) => ({ source: `hub-${s.id}`, target: tid, type: 'session-ghost' })));
    const allLinks = [...ghostLinks, ...sessionToHubLinks, ...sessionToSessionLinks, ...hubToTargetLinks];

    if (simSatellites.length > 0) {
      const simLinks = allLinks.map(l => {
        const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const targetId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        const s = simSatellites.find(ss => ss.id === sourceId);
        const t = simSatellites.find(ss => ss.id === targetId) || nodes.find((n: any) => n.data.id === targetId);
        return { ...l, source: s, target: t };
      }).filter(l => l.source && l.target);

      const gigaLinkSelection = g.append('g').selectAll('line.analysis-link')
        .data(simLinks).enter().append('line').attr('class', 'analysis-link')
        .attr('stroke', (d: any) => d.type === 'session-inner' ? 'var(--swarm-blue)' : 'var(--tactical-ink-3)')
        .attr('stroke-width', (d: any) => d.type === 'session-inner' ? 2.5 : 1)
        .attr('stroke-dasharray', (d: any) => d.type === 'session-ghost' ? '4 4' : 'none')
        .attr('opacity', (d: any) => d.type === 'session-ghost' ? 0.4 : 0.8);

      const satelliteG = g.append('g').selectAll('g.satellite')
        .data(simSatellites).enter().append('g').attr('class', (d: any) => `satellite ${d.type}`).style('cursor', 'pointer')
        .on('click', (event, d: any) => {
          event.stopPropagation();
          if (propOnNodeSelect) propOnNodeSelect(d.id);
          const nodeData = { id: d.id, name: d.name, type: d.type, summary: d.summary };
          setSelectedNodes(prev => {
            const exists = prev.find(n => n.id === d.id);
            if (event.shiftKey || event.metaKey || event.ctrlKey) {
              return exists ? prev.filter(n => n.id !== d.id) : [...prev, nodeData];
            }
            return exists && prev.length === 1 ? [] : [nodeData];
          });
        });
        
      satelliteG.each(function(d: any) {
        const el = d3.select(this);
        if (d.type === 'session-hub') {
          el.append('rect').attr('x', -32).attr('y', -32).attr('width', 64).attr('height', 64).attr('rx', 16).attr('fill', d.protocol === 'scamper' ? 'var(--swarm-blue)' : 'var(--swarm-mint)').style('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))');
          el.append('path').attr('d', "M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z").attr('transform', 'scale(1.5) translate(-10, -10)').attr('fill', 'var(--tactical-bg)');
        } else {
          el.append('circle').attr('r', d.isSessionNode ? 12 : 16)
            .attr('fill', d.isSessionNode ? 'var(--bg-muted)' : 'var(--tactical-bg)')
            .attr('stroke', d.isSessionNode ? 'var(--swarm-blue)' : 'var(--border)')
            .attr('stroke-width', 2);
        }
      });
        
      satelliteG.append('text').text(d => d.name).attr('font-size', d => (d as any).type === 'session-hub' ? '18px' : '14px').attr('font-family', 'var(--font-inter, sans-serif)').attr('font-weight', 'bold').attr('fill', 'var(--ink)').attr('text-anchor', 'middle').attr('dy', d => (d as any).type === 'session-hub' ? -42 : -24);
      
      // Node Category Icons for satellites
      if (mode === 'strategist') {
        satelliteG.filter(d => !d.isSessionHub).append('text')
          .text(d => {
            const cat = (d as any).type?.toUpperCase();
            if (cat === 'RISK') return '⚠';
            if (cat === 'OPPORTUNITY') return '⚡';
            if (cat === 'INSIGHT') return '💡';
            if (cat === 'FACT') return '📄';
            if (cat === 'QUESTION') return '❓';
            if (cat === 'PATH') return '↗';
            return '';
          })
          .attr('font-size', '10px').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('fill', 'var(--tactical-bg)');
      }

      const simulation = d3.forceSimulation(simSatellites as d3.SimulationNodeDatum[])
        .force('charge', d3.forceManyBody().strength(-3000))
        .force('collide', d3.forceCollide().radius(220))
        .force('y', d3.forceY().y((d: any) => {
          if (d.type === 'session-hub' || d.isSessionNode) {
            const sessionId = d.isSessionNode ? d.sessionId : d.id.replace('hub-', '');
            const sessionIdx = sessions.findIndex(s => s.id === sessionId);
            return (sessionIdx - (sessions.length - 1) / 2) * 2400;
          }
          return 0;
        }).strength(d => (d as any).type === 'session-hub' ? 0.15 : 0.05))
        .on('tick', () => {
          simSatellites.forEach((s: any) => {
            if (s.type === 'session-hub') s.vx += (5000 - s.x) * 0.04;
          });
          simLinks.forEach(link => {
            const s = link.source as any; const t = link.target as any;
            if (s && t && s !== t) {
               const tx = t.cartX !== undefined ? t.cartX : (t.x !== undefined ? t.x : 0);
               const ty = t.cartY !== undefined ? t.cartY : (t.y !== undefined ? t.y : 0);
               const strength = link.type === 'session-inner' ? 0.08 : 0.003;
               s.vx += (tx - s.x) * strength; s.vy += (ty - s.y) * strength;
            }
          });
          satelliteG.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
          gigaLinkSelection
            .attr('x1', (d: any) => d.source.x)
            .attr('y1', (d: any) => d.source.y)
            .attr('x2', (d: any) => d.target.cartX !== undefined ? d.target.cartX : d.target.x)
            .attr('y2', (d: any) => d.target.cartY !== undefined ? d.target.cartY : d.target.y);
            
           simSatellites.forEach((s: any) => {
             previousPositions.current.set(s.id, { x: s.x, y: s.y, vx: s.vx, vy: s.vy });
           });
        });
        
      return () => {
        simulation.stop();
      };
    }
  }, [data, oracleSessions]);

  useEffect(() => {
    // We no longer sync to localStorage here, the store handles IndexedDB persistence.
  }, [data]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('circle').attr('opacity', 1);
    svg.selectAll('rect').attr('opacity', 1);
    svg.selectAll('text').attr('opacity', 1);
    const activeIds = new Set(selectedNodes.map(n => n.id));
    if (hoveredNodeId) activeIds.add(hoveredNodeId);
    if (activeIds.size > 0) {
      svg.selectAll('g').each(function(d: any) {
        if (!d) return;
        const id = d.data ? d.data.id : d.id; 
        if (id !== 'root' && id && !activeIds.has(id)) {
           d3.select(this).selectAll('circle, rect, text').attr('opacity', 0.15);
        }
      });
    }
  }, [selectedNodes, hoveredNodeId]);

  const handleWorkbenchAction = async (action: string) => {
    if (selectedNodes.length === 0 || !data) return;
    setIsMutating(true);
    
    let session: GigaWorkbenchSession | null = null;
    
    if (mode === 'oracle') {
        session = await askWorkbenchOracle(action as any, selectedNodes, sourceContent);
    } else {
        // Strategist Logic
        const { executeStrategistQuery } = await import('@/lib/services/strategistGigaBrain');
        const stratResult = await executeStrategistQuery(
            `Perform ${action} analysis on: ${selectedNodes.map(n => n.name).join(', ')}`,
            action,
            sourceContent,
            [] // Simplified for Giga Map context
        );
        
        if (stratResult) {
            session = {
                id: Math.random().toString(36).substr(2, 9),
                type: action as any,
                title: stratResult.sessionTitle,
                summary: stratResult.chatSummary,
                timestamp: new Date().toISOString(),
                targetNodeIds: selectedNodes.map(n => n.id),
                nodes: stratResult.nodes.map((n, i) => ({
                    id: `strat-node-${Date.now()}-${i}`,
                    name: n.label,
                    type: n.category.toLowerCase() as any,
                    summary: n.summary
                }))
            };
        }
    }

    if (session) {
      addOracleSession(session);
    }
    setIsMutating(false);
  };

  const sortedData = React.useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      pillars: [...(data.pillars || [])].sort((a, b) => a.name.localeCompare(b.name)),
      clusters: [...(data.clusters || [])].sort((a, b) => a.name.localeCompare(b.name)),
      leaves: [...(data.leaves || [])].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [data]);

  const handleRegenerate = () => {
    setIsSynthesizing(true);
    setData(null);
    setSelectedNodes([]);
    synthesizeOracleGigaMap(sourceContent, true).then(res => {
      setData(res);
      setIsSynthesizing(false);
    });
  };

  return (
    <div className="fixed inset-0 z-500 overflow-hidden" style={{ backgroundColor: 'var(--tactical-bg)' }}>
      <div className="absolute top-6 right-8 flex items-center gap-4 z-50 font-sans text-[10px]">
        {noteId && (
          <button 
            onClick={() => window.open(`/swamp?noteId=${noteId}`, '_blank')}
            className="flex items-center gap-2 text-(--ink-dim) hover:text-(--ink) px-3 py-1.5 border border-(--border) rounded-xl uppercase tracking-widest transition-colors font-bold"
          >
            <Ghost size={14} weight="bold" />
            Swamp Mode
          </button>
        )}
        <div className="text-(--ink-light) pointer-events-none uppercase font-black tracking-widest opacity-50">ESC to return</div>
      </div>
      {isSynthesizing && (
        <div className="absolute inset-0 flex flex-col justify-center items-center z-50" style={{ backgroundColor: 'var(--tactical-bg)' }}>
          <CircleNotch size={40} weight="thin" className="animate-spin text-(--ink-light)" />
          <span className="text-(--ink-dim) uppercase font-sans tracking-widest text-xs mt-4">Constructing Giga Map</span>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" onPointerDown={(e) => { if (e.target === svgRef.current) setSelectedNodes([]); }} />
      <style>{`
        @keyframes panelIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>
      {mode === 'oracle' && (
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`fixed top-1/2 -translate-y-1/2 right-0 z-100 p-2 bg-(--bg-card) border border-r-0 border-(--border) rounded-l-xl shadow-lg transition-transform duration-300 ${isSidebarOpen ? 'translate-x-[360px]' : 'translate-x-0'}`}>
          <Graph size={20} weight="duotone" className="text-(--ink-dim)" />
        </button>
      )}
      {isSidebarOpen && mode === 'oracle' && (
          <div className={`fixed transition-all duration-500 ease-in-out flex flex-col overflow-hidden z-500 bg-(--bg-card)/95 backdrop-blur-md border border-(--border) shadow-[0_12px_40px_rgba(0,0,0,0.08)] ${isFullscreen ? 'inset-6 rounded-3xl' : 'top-[60px] right-4 w-[360px] max-h-[calc(100vh-100px)] rounded-2xl'}`} style={{ animation: isFullscreen ? 'none' : 'panelIn 250ms cubic-bezier(.22,1,.36,1)' }}>
              <div className="flex flex-col px-6 pt-6 pb-2 border-b border-(--border-soft) bg-(--bg-card)/50">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono text-(--ink-light) uppercase tracking-[0.18em] font-bold">{selectedNodes.length > 0 ? (selectedNodes.length > 1 ? `${selectedNodes.length} NODES SELECTED` : 'NODE DETAILS') : 'MAP EXPLORER'}</span>
                      <div className="flex gap-1.5">
                          {selectedNodes.length > 0 && <button onClick={() => setSelectedNodes([])} className="text-[9px] font-mono text-red-500 hover:bg-red-50 px-2 py-1 rounded uppercase tracking-wider transition-colors mr-2">Clear</button>}
                          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-(--ink-light) hover:bg-(--ink)/5 hover:text-(--ink) rounded transition-all" title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}>{isFullscreen ? <Intersect size={16} weight="bold" /> : <SquaresFour size={16} />}</button>
                          <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-(--ink-light) hover:bg-(--ink)/5 hover:text-(--ink) rounded transition-all"><X size={16} /></button>
                      </div>
                  </div>
                  <div className="relative mb-3">
                    <input type="text" placeholder="Search nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-4 py-2 bg-(--bg-muted) border border-(--border) rounded-lg text-[13px] font-sans focus:outline-none focus:ring-1 focus:ring-black/10 text-(--ink)" />
                    <MagicWand size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--ink-light)" />
                  </div>
              </div>
              <div className={`overflow-hidden flex-1 flex ${isFullscreen ? 'flex-row' : 'flex-col'}`}>
                  {isFullscreen && selectedNodes.length > 0 && (
                    <div className="w-[400px] border-r border-(--border-soft) bg-(--bg-card)/30 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-mono text-(--ink-light) uppercase tracking-widest font-bold">Staging Area</p>
                        <span className="bg-(--ink) text-(--bg-card) text-[9px] px-2 py-0.5 rounded-full font-bold">{selectedNodes.length}</span>
                      </div>
                      <div className="space-y-2">
                        {selectedNodes.map(node => (
                          <div key={node.id} className="p-4 bg-(--bg-card) rounded-2xl border border-(--border-soft) shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
                            <div className="flex flex-col"><p className="text-(--ink) text-[14px] font-serif font-medium leading-tight">{node.name}</p><span className="text-(--ink-light) text-[9px] uppercase tracking-wider mt-1">{node.type}</span></div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedNodes(prev => prev.filter(n => n.id !== node.id)); }} className="p-1.5 rounded-lg text-(--ink-light) hover:text-red-500 hover:bg-red-50 transition-all"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto pt-6 border-t border-(--border-soft) space-y-3">
                        <p className="text-[9px] font-mono text-(--ink-light) uppercase tracking-[0.2em] mb-3">Protocols</p>
                        {selectedNodes.length === 1 ? (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => handleWorkbenchAction('find-problems')} disabled={isMutating} className="flex flex-col items-center gap-2 p-4 bg-(--bg-card) border border-(--border) rounded-2xl hover:border-red-400 hover:shadow-lg transition-all disabled:opacity-50"><ExclamationMark size={20} className="text-red-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Failures</span></button>
                              <button onClick={() => handleWorkbenchAction('generate-ideas')} disabled={isMutating} className="flex flex-col items-center gap-2 p-4 bg-(--bg-card) border border-(--border) rounded-2xl hover:border-orange-400 hover:shadow-lg transition-all disabled:opacity-50"><Lightning size={20} className="text-orange-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Ideas</span></button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <button onClick={() => handleWorkbenchAction('scamper')} disabled={isMutating} className="flex items-center gap-3 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-indigo-400 transition-all text-left"><ArrowCounterClockwise size={18} className="text-indigo-500" /><div className="flex flex-col"><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">SCAMPER</span><span className="text-[8px] text-(--ink-light) uppercase tracking-tighter">Mutation</span></div></button>
                                <button onClick={() => handleWorkbenchAction('first-principles')} disabled={isMutating} className="flex items-center gap-3 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-emerald-400 transition-all text-left"><Target size={18} className="text-emerald-500" /><div className="flex flex-col"><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Pillars</span><span className="text-[8px] text-(--ink-light) uppercase tracking-tighter">1st Principles</span></div></button>
                                <button onClick={() => handleWorkbenchAction('analogy')} disabled={isMutating} className="flex items-center gap-3 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-blue-400 transition-all text-left"><GlobeSimple size={18} className="text-blue-500" /><div className="flex flex-col"><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Analogy</span><span className="text-[8px] text-(--ink-light) uppercase tracking-tighter">Cross-Domain</span></div></button>
                                <button onClick={() => handleWorkbenchAction('pre-mortem')} disabled={isMutating} className="flex items-center gap-3 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-rose-400 transition-all text-left"><Warning size={18} className="text-rose-500" /><div className="flex flex-col"><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Pre-Mortem</span><span className="text-[8px] text-(--ink-light) uppercase tracking-tighter">Future Risk</span></div></button>
                            </div>
                          </div>
                        ) : selectedNodes.length > 1 && (
                          <button onClick={() => handleWorkbenchAction('find-connection')} disabled={isMutating} className="w-full flex items-center justify-center gap-3 p-5 bg-(--ink) text-(--bg-card) rounded-2xl hover:bg-(--ink)/90 shadow-xl transition-all disabled:opacity-50"><Intersect size={22} className="text-purple-400" /><span className="text-[11px] font-bold uppercase tracking-widest">Find Systemic Link</span></button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
                      {searchTerm ? (
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-(--ink-light) uppercase tracking-widest px-2 mb-2">Search Results</p>
                          {sortedData?.leaves.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(node => (
                            <div key={node.id} onClick={() => { const exists = selectedNodes.find(n => n.id === node.id); setSelectedNodes(prev => exists ? prev.filter(n => n.id !== node.id) : [...prev, node]); }} onMouseEnter={() => setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)} className={`p-2.5 rounded-lg cursor-pointer transition-all ${selectedNodes.find(n => n.id === node.id) ? 'bg-(--ink) text-(--bg-card)' : 'hover:bg-(--ink)/5 text-(--ink-dim)'}`}><p className="text-[13px] font-serif font-medium leading-tight">{node.name}</p><p className="text-[10px] opacity-60 uppercase tracking-tighter mt-0.5">{node.type}</p></div>
                          ))}
                        </div>
                      ) : (selectedNodes.length > 0 && !isFullscreen) ? (
                        <div className="space-y-6">
                            {selectedNodes.length === 1 ? (
                              <div className="px-2"><p className="text-(--ink) text-[18px] font-serif font-medium mb-3 leading-snug tracking-tight">{selectedNodes[0].name}</p>{selectedNodes[0].summary && (<div className="mb-4"><p className="text-(--ink-light) text-[9px] font-mono uppercase tracking-widest mb-2">Insight Layer</p><p className="text-(--ink-dim) text-[13px] font-sans leading-relaxed bg-(--bg-card) p-3 rounded-lg border border-(--border-soft)">{selectedNodes[0].summary}</p></div>)}</div>
                            ) : (
                              <div className="space-y-2 px-2">{selectedNodes.map(node => (<div key={node.id} className="p-3 bg-(--bg-card) rounded-xl border border-(--border-soft) flex justify-between items-center group"><div className="flex flex-col"><p className="text-(--ink-dim) text-[13px] font-serif font-medium leading-tight">{node.name}</p><span className="text-(--ink-light) text-[9px] uppercase tracking-wider mt-0.5">{node.type}</span></div><X size={12} className="text-(--ink-light) group-hover:text-red-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedNodes(prev => prev.filter(n => n.id !== node.id)); }} /></div>))}</div>
                            )}
                            <div className="space-y-2.5 px-2 pt-4 border-t border-(--border-soft)">
                                <p className="text-[9px] font-mono text-(--ink-light) uppercase tracking-[0.2em] mb-3">{mode === 'oracle' ? 'Workbench Protocols' : 'Strategist Workbench'}</p>
                                {selectedNodes.length === 1 && (
                                  <div className="flex flex-col gap-2">
                                    {mode === 'oracle' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <button onClick={() => handleWorkbenchAction('find-problems')} disabled={isMutating} className="flex flex-col items-center gap-2 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-red-400 transition-all"><ExclamationMark size={16} className="text-red-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Failures</span></button>
                                          <button onClick={() => handleWorkbenchAction('generate-ideas')} disabled={isMutating} className="flex flex-col items-center gap-2 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-orange-400 transition-all"><Lightning size={16} className="text-orange-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Ideas</span></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <button onClick={() => handleWorkbenchAction('scamper')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-indigo-400 transition-all"><ArrowCounterClockwise size={14} className="text-indigo-500" /><span className="text-[8px] font-bold uppercase tracking-[0.05em] text-(--ink)">SCAMPER</span></button>
                                          <button onClick={() => handleWorkbenchAction('first-principles')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-emerald-400 transition-all"><Target size={14} className="text-emerald-500" /><span className="text-[8px] font-bold uppercase tracking-[0.05em] text-(--ink)">Pillars</span></button>
                                          <button onClick={() => handleWorkbenchAction('analogy')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-blue-400 transition-all"><GlobeSimple size={14} className="text-blue-500" /><span className="text-[8px] font-bold uppercase tracking-[0.05em] text-(--ink)">Analogy</span></button>
                                          <button onClick={() => handleWorkbenchAction('pre-mortem')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-rose-400 transition-all"><Warning size={14} className="text-rose-500" /><span className="text-[8px] font-bold uppercase tracking-[0.05em] text-(--ink)">Pre-Mortem</span></button>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black text-(--ink-light) uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                <MagicWand size={12} className="text-amber-500" /> Advanced Skills
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => handleWorkbenchAction('red-team')} disabled={isMutating} className="flex items-center gap-2 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-red-400 transition-all"><ShieldCheck size={16} className="text-red-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Red Team</span></button>
                                                <button onClick={() => handleWorkbenchAction('gaps-audit')} disabled={isMutating} className="flex items-center gap-2 p-3 bg-(--bg-card) border border-(--border) rounded-xl hover:border-orange-400 transition-all"><Fingerprint size={16} className="text-orange-500" /><span className="text-[9px] font-bold uppercase tracking-widest text-(--ink)">Gaps Audit</span></button>
                                                <button onClick={() => handleWorkbenchAction('golden-path')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-indigo-400 transition-all"><Path size={14} className="text-indigo-500" /><span className="text-[8px] font-bold uppercase tracking-[0.05em] text-(--ink)">Golden Path</span></button>
                                                <button onClick={() => handleWorkbenchAction('blue-ocean')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-blue-400 transition-all"><ChartPieSlice size={14} className="text-blue-500" /><span className="text-[8px] font-bold uppercase tracking-[0.05em] text-(--ink)">Blue Ocean</span></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black text-(--ink-light) uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                <Graph size={12} className="text-indigo-500" /> Swarm Personas
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => handleWorkbenchAction('RED_TEAM')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-red-400 transition-all"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[8px] font-bold uppercase tracking-widest text-(--ink)">Red Team</span></button>
                                                <button onClick={() => handleWorkbenchAction('BAUHAUS_COUNCIL')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-cyan-400 transition-all"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[8px] font-bold uppercase tracking-widest text-(--ink)">Bauhaus</span></button>
                                                <button onClick={() => handleWorkbenchAction('MARKET_MOVERS')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-amber-400 transition-all"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[8px] font-bold uppercase tracking-widest text-(--ink)">Movers</span></button>
                                                <button onClick={() => handleWorkbenchAction('DEEP_THINKERS')} disabled={isMutating} className="flex items-center gap-2 p-2.5 bg-(--bg-card) border border-(--border) rounded-xl hover:border-violet-400 transition-all"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-[8px] font-bold uppercase tracking-widest text-(--ink)">Thinkers</span></button>
                                            </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {selectedNodes.length > 1 && (
                                  <button onClick={() => handleWorkbenchAction('find-connection')} disabled={isMutating} className="w-full flex items-center justify-center gap-3 p-4 bg-(--bg-card) border border-(--border) rounded-xl hover:border-purple-400 transition-all"><Intersect size={20} className="text-purple-500" /><span className="text-[11px] font-bold uppercase tracking-widest text-(--ink)">Find Systemic Link</span></button>
                                )}
                            </div>
                        </div>
                      ) : (
                        <div className="space-y-12">
                          {oracleSessions.length > 0 && (
                            <div className="space-y-6">
                               <div className="flex items-center gap-4 px-2"><div className="h-px flex-1 bg-(--border-soft)" /><span className="text-[10px] font-mono text-(--ink-light) uppercase tracking-[0.3em]">Workbench Analysis Blocks</span><div className="h-px flex-1 bg-(--border-soft)" /></div>
                               <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                 {oracleSessions.slice().reverse().map(session => (
                                   <div key={session.id} className="bg-(--bg-card) p-6 rounded-3xl border border-(--border) shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col group relative">
                                      <button onClick={() => removeOracleSession(session.id)} className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 text-(--ink-light) hover:text-red-500 transition-all z-20"><X size={14} /></button>
                                      <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${session.type === 'scamper' ? 'bg-indigo-500' : session.type === 'first-principles' ? 'bg-emerald-500' : 'bg-blue-500'}`} /><h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-(--ink)">{session.title}</h3></div>
                                        <span className="text-[9px] font-mono text-(--ink-light)">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                        <div className="md:col-span-3 space-y-3">
                                          {session.nodes.map((node: GigaSatellite) => (
                                            <div key={node.id} className="p-3.5 bg-(--bg-muted) rounded-xl border border-(--border-soft) group/node hover:border-black/10 transition-colors"><p className="text-[14px] font-serif font-semibold text-(--ink) leading-tight mb-1">{node.name}</p><p className="text-[11px] text-(--ink-dim) leading-relaxed italic">{node.summary}</p></div>
                                          ))}
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                           <SessionMiniGraph session={session} />
                                           <div className="sticky top-0 bg-(--bg-muted) p-5 rounded-2xl border border-(--border) border-dashed"><p className="text-[10px] font-mono text-(--ink-dim) uppercase tracking-widest mb-3 flex items-center gap-2"><MagicWand size={12} />Systemic Synthesis</p><p className="text-[13px] font-sans leading-relaxed text-(--ink-dim) font-medium">{session.summary}</p></div>
                                        </div>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          )}
                          <div className={`${isFullscreen ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4' : 'space-y-4 px-2'}`}>
                              {sortedData?.pillars.map(pillar => (
                                <div key={pillar.id} className={`space-y-2 ${isFullscreen ? 'bg-(--bg-card)/50 p-6 rounded-2xl border border-(--border-soft)' : ''}`}>
                                  <div onClick={() => { const exists = selectedNodes.find(n => n.id === pillar.id); setSelectedNodes(prev => exists ? prev.filter(n => n.id !== pillar.id) : [...prev, { ...pillar, type: 'pillar' }]); }} className={`group flex items-center gap-2 cursor-pointer p-1 rounded transition-colors ${selectedNodes.find(n => n.id === pillar.id) ? 'bg-(--ink) text-(--bg-card)' : 'hover:bg-(--ink)/5 text-(--ink)'}`}><p className="text-[11px] font-black font-sans uppercase tracking-[0.2em] border-b border-current pb-1.5 flex-1">{pillar.name}</p></div>
                                  <div className={`${isFullscreen ? 'grid grid-cols-1 gap-6 mt-4' : ''}`}>
                                    {sortedData.clusters.filter(c => c.pillarId === pillar.id).map(cluster => (
                                      <div key={cluster.id} className={`${isFullscreen ? 'bg-(--bg-card) p-4 rounded-xl border border-(--border-soft)/50' : 'ml-2 border-l border-(--border) pl-3 py-1'}`}>
                                        <div onClick={() => { const exists = selectedNodes.find(n => n.id === cluster.id); setSelectedNodes(prev => exists ? prev.filter(n => n.id !== cluster.id) : [...prev, { ...cluster, type: 'cluster' }]); }} className={`group flex items-center gap-2 cursor-pointer p-1 rounded transition-colors mb-2 ${selectedNodes.find(n => n.id === cluster.id) ? 'bg-(--ink) text-(--bg-card)' : 'hover:bg-(--ink)/5 text-(--ink-dim)'}`}><p className="text-[10px] font-bold uppercase tracking-wider flex-1">{cluster.name}</p></div>
                                        <div className={`space-y-1.5 ${isFullscreen ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1' : ''}`}>
                                          {sortedData.leaves.filter(l => l.clusterId === cluster.id).map(leaf => (
                                            <div key={leaf.id} onClick={() => { const exists = selectedNodes.find(n => n.id === leaf.id); setSelectedNodes(prev => exists ? prev.filter(n => n.id !== leaf.id) : [...prev, { ...leaf, type: 'leaf' }]); }} onMouseEnter={() => setHoveredNodeId(leaf.id)} onMouseLeave={() => setHoveredNodeId(null)} className={`text-[12px] font-serif transition-all cursor-pointer leading-tight wrap-break-word p-1 rounded ${selectedNodes.find(n => n.id === leaf.id) ? 'bg-(--ink) text-(--bg-card)' : 'text-(--ink-dim) hover:text-(--ink) hover:pl-2 hover:bg-(--ink)/5'}`}>{leaf.name}</div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
