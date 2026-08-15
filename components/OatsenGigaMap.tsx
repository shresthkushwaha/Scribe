'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  synthesizeStrategistGigaMap,
  executeStrategistQuery,
} from '@/lib/services/strategistGigaBrain';
import {
  GigaMapData, GigaSatellite, GigaWorkbenchSession, askWorkbenchOracle,
  getGigaMapCacheKey,
} from '@/lib/services/oracleGigaBrain';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import { getWorkspace } from '@/lib/services/scribeV2Db';
import {
  CircleNotch, X, Lightning, MagicWand, ExclamationMark, Graph,
  Intersect, SquaresFour, ArrowCounterClockwise, Target, GlobeSimple,
  Warning, Ghost, ShieldCheck, Path, ChartPieSlice, Fingerprint,
  ArrowRight, ArrowsOut, Plus,
} from '@phosphor-icons/react';

// ── Layout Constants ────────────────────────────────────────────────────────
const PILLAR_COL_WIDTH   = 300;
const PILLAR_GAP         = 320;
const PILLAR_TOP_PAD     = 100;
const PILLAR_INNER_PAD_X = 20;
const PILLAR_INNER_PAD_T = 60;
const CLUSTER_HEADER_H   = 40;
const CLUSTER_GAP        = 32;
const LEAF_HEIGHT        = 68;
const LEAF_GAP           = 10;
const LEAF_ACCENT_W      = 5;
const LEAF_INNER_PAD     = 12;
const SESSION_NODE_W     = 240;
const SESSION_NODE_H     = 76;
const SESSION_NODE_GAP   = 12;
const SESSION_SIDE_GAP   = 60; // Min distance to side of node
const SESSION_SIDE_EXT   = 240; 
const TITLE_ROW_Y        = 50;

// Category accent colors (must work in both themes)
const CATEGORY_COLORS: Record<string, string> = {
  RISK:        '#ef4444',
  PROBLEM:     '#ef4444',
  CRITIQUE:    '#f97316',
  OPPORTUNITY: '#22c55e',
  IDEA:        '#22c55e',
  SOLUTION:    '#10b981',
  ACTION:      '#10b981',
  INSIGHT:     '#3b82f6',
  STRATEGY:    '#3b82f6',
  FRAMEWORK:   '#6366f1',
  PRINCIPLE:   '#8b5cf6',
  FACT:        '#8b5cf6',
  QUESTION:    '#eab308',
  PATH:        '#06b6d4',
  DATA:        '#94a3b8',
  METRIC:      '#ec4899',
  IMPLICATION: '#a855f7',
  CONCEPT:     '#3b82f6',
};

const PILLAR_PALETTE = [
  '#e91e63', '#9c27b0', '#4caf50', '#ff5722', '#00bcd4', '#607d8b',
];

// ── Types ─────────────────────────────────────────────────────────────────
interface LayoutNode {
  id: string;
  name: string;
  type: 'pillar' | 'cluster' | 'leaf';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  accentColor?: string;  // leaf category color
  category?: string;
  summary?: string;
  clusterId?: string;
  pillarId?: string;
}

interface LayoutPillarContainer {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface LayoutEdge {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  type: 'hierarchy' | 'cross' | 'session';
  color: string;
}

interface SessionColumnNode {
  id: string;
  name: string;
  category: string;
  summary: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  targetNodeId?: string; // the leaf/cluster it connects to
}

interface LayoutSessionContainer {
  id: string;
  title: string;
  x1: number; y1: number; x2: number; y2: number;
  color: string;
}

interface BoundingBox {
  x1: number; y1: number; x2: number; y2: number;
}

// ── Layout Engine ─────────────────────────────────────────────────────────
function computeLayout(data: GigaMapData | null, sessions: GigaWorkbenchSession[]) {
  const layoutNodes: LayoutNode[] = [];
  const pillarContainers: LayoutPillarContainer[] = [];
  const edges: LayoutEdge[] = [];
  const sessionColNodes: SessionColumnNode[] = [];
  const sessionContainers: LayoutSessionContainer[] = [];
  const occupiedBoxes: BoundingBox[] = [];

  if (!data) return { layoutNodes, pillarContainers, edges, sessionColNodes, sessionContainers };

  const { pillars, clusters, leaves } = data;

  function isOccupied(box: BoundingBox) {
    return occupiedBoxes.some(other => {
      return !(box.x2 < other.x1 || box.x1 > other.x2 || box.y2 < other.y1 || box.y1 > other.y2);
    });
  }

  // -- 1. Map each pillar's structural nodes for quick lookup --
  const nodeToPillar: Record<string, string> = {};
  pillars.forEach(p => { nodeToPillar[p.id] = p.id; });
  clusters.forEach(c => { nodeToPillar[c.id] = c.pillarId; });
  leaves.forEach(l => { 
    const c = clusters.find(cl => cl.id === l.clusterId);
    if (c) nodeToPillar[l.id] = c.pillarId;
  });

  // -- 2. Trace sessions back to their ROOT pillar (multi-pass for recursive) --
  const sessionToRootPillar: Record<string, string> = {};
  let unresolved = [...sessions];
  let lastUnresolvedCount = unresolved.length + 1;

  while (unresolved.length > 0 && unresolved.length < lastUnresolvedCount) {
    lastUnresolvedCount = unresolved.length;
    const nextUnresolved: GigaWorkbenchSession[] = [];

    unresolved.forEach(s => {
      const targetId = s.targetNodeIds?.[0];
      if (!targetId) return;

      if (nodeToPillar[targetId]) {
        sessionToRootPillar[s.id] = nodeToPillar[targetId];
      } else {
        // Is it a node from another ALREADY RESOLVED session?
        const parentSession = sessions.find(os => os.nodes.some(n => n.id === targetId));
        if (parentSession && sessionToRootPillar[parentSession.id]) {
          sessionToRootPillar[s.id] = sessionToRootPillar[parentSession.id];
        } else {
          nextUnresolved.push(s);
        }
      }
    });
    unresolved = nextUnresolved;
  }

  // -- 3. Layout Pillars at fixed positions --
  const laneLows: Record<string, number> = {};

  pillars.forEach((pillar, pIdx) => {
    const pillarColor = PILLAR_PALETTE[pIdx % PILLAR_PALETTE.length];
    const pillarClusters = clusters.filter(c => c.pillarId === pillar.id);
    const pillarX = pIdx * (PILLAR_COL_WIDTH + PILLAR_GAP);

    let pillarContentH = PILLAR_INNER_PAD_T;
    pillarClusters.forEach(cluster => {
      const clusterLeaves = leaves.filter(l => l.clusterId === cluster.id);
      pillarContentH += CLUSTER_HEADER_H + (clusterLeaves.length * (LEAF_HEIGHT + LEAF_GAP)) + CLUSTER_GAP;
    });
    pillarContentH += 24;

    const pBox = { x1: pillarX, y1: PILLAR_TOP_PAD, x2: pillarX + PILLAR_COL_WIDTH, y2: PILLAR_TOP_PAD + pillarContentH };
    pillarContainers.push({ ...pBox, id: pillar.id, name: pillar.name, x: pillarX, y: PILLAR_TOP_PAD, w: PILLAR_COL_WIDTH, h: pillarContentH, color: pillarColor });
    occupiedBoxes.push(pBox);

    layoutNodes.push({
      id: pillar.id,
      name: pillar.name,
      type: 'pillar',
      x: pillarX + PILLAR_COL_WIDTH / 2,
      y: PILLAR_TOP_PAD,
      w: PILLAR_COL_WIDTH,
      h: PILLAR_INNER_PAD_T,
      color: pillarColor,
    });

    let curY = PILLAR_TOP_PAD + PILLAR_INNER_PAD_T;
    pillarClusters.forEach(cluster => {
      const clusterLeaves = leaves.filter(l => l.clusterId === cluster.id);
      const clusterX = pillarX + PILLAR_INNER_PAD_X;
      const clusterW = PILLAR_COL_WIDTH - PILLAR_INNER_PAD_X * 2;

      layoutNodes.push({
        id: cluster.id,
        name: cluster.name,
        type: 'cluster',
        x: clusterX,
        y: curY,
        w: clusterW,
        h: CLUSTER_HEADER_H,
        color: pillarColor,
        pillarId: pillar.id,
      });

      edges.push({
        id: `e-${pillar.id}-${cluster.id}`,
        sourceX: pillarX + PILLAR_COL_WIDTH / 2,
        sourceY: PILLAR_TOP_PAD + PILLAR_INNER_PAD_T,
        targetX: clusterX + clusterW / 2,
        targetY: curY,
        type: 'hierarchy',
        color: pillarColor,
      });

      curY += CLUSTER_HEADER_H + 8;
      clusterLeaves.forEach(leaf => {
        const accentColor = CATEGORY_COLORS[(leaf as any).category || 'INSIGHT'] || CATEGORY_COLORS.INSIGHT;
        layoutNodes.push({
          id: leaf.id,
          name: leaf.name,
          type: 'leaf',
          x: clusterX,
          y: curY,
          w: clusterW,
          h: LEAF_HEIGHT,
          color: pillarColor,
          accentColor,
          category: (leaf as any).category,
          summary: leaf.summary,
          clusterId: cluster.id,
          pillarId: pillar.id,
        });

        edges.push({
          id: `e-${cluster.id}-${leaf.id}`,
          sourceX: clusterX + clusterW / 2,
          sourceY: curY - 8 + CLUSTER_HEADER_H,
          targetX: clusterX + clusterW / 2,
          targetY: curY,
          type: 'hierarchy',
          color: pillarColor + '60',
        });
        curY += LEAF_HEIGHT + LEAF_GAP;
      });
      curY += CLUSTER_GAP;
    });

    laneLows[pillar.id] = PILLAR_TOP_PAD + pillarContentH + 100;
  });

  // -- 4. Multi-Directional Session Placement (Smart Search) --
  sessions.forEach((session) => {
    let rootPillarId = sessionToRootPillar[session.id];
    let primaryTargetId = session.targetNodeIds?.[0];
    let targetNode = layoutNodes.find(n => n.id === primaryTargetId);
    if (!targetNode) targetNode = sessionColNodes.find(n => n.id === primaryTargetId) as any;
    if (!targetNode && layoutNodes.length > 0) {
      targetNode = layoutNodes.find(n => n.type === 'leaf') || layoutNodes.find(n => n.type === 'cluster') || layoutNodes[0];
      primaryTargetId = targetNode?.id;
    }
    if (!rootPillarId && targetNode) {
      rootPillarId = (targetNode as any).pillarId || (targetNode.type === 'pillar' ? targetNode.id : pillars[0]?.id);
    }
    if (!rootPillarId || !targetNode) return;

    // ── Grid & Multi-Column Synthesis ───────────────────────────────────
    const numNodes = session.nodes.length;
    const cols = numNodes > 8 ? 3 : numNodes > 3 ? 2 : 1;
    const rows = Math.ceil(numNodes / cols);
    const colWidth = SESSION_NODE_W + 20;

    const clusterW = (cols * colWidth) + 40; 
    const clusterH = rows * (SESSION_NODE_H + SESSION_NODE_GAP) + 60; 

    // Dynamic Search with 40px Snap-to-Grid
    const snap = (v: number) => Math.round(v / 40) * 40;
    const sideGap = 120; // spacious air gap
    
    const candidates = [
      { x: snap(targetNode.x + (targetNode.w || 0) + sideGap), y: snap(targetNode.y), side: 'right' },
      { x: snap(targetNode.x - clusterW - sideGap), y: snap(targetNode.y), side: 'left' },
      { x: snap(targetNode.x + (targetNode.w!/2 - clusterW/2)), y: snap(laneLows[rootPillarId]), side: 'bottom' },
    ];

    let chosen = candidates[2]; 
    for (const cand of candidates) {
      if (!isOccupied({ x1: cand.x, y1: cand.y, x2: cand.x + clusterW, y2: cand.y + clusterH })) {
        chosen = cand;
        break;
      }
    }

    // Safety Vacuum
    let failSafe = 0;
    while (isOccupied({ x1: chosen.x, y1: chosen.y, x2: chosen.x + clusterW, y2: chosen.y + clusterH }) && failSafe < 20) {
      chosen.y += 80;
      failSafe++;
    }

    const side = (chosen as any).side;
    const protocolType = (session.nodes[0]?.type || 'INSIGHTS').toUpperCase();
    const sessionColor = CATEGORY_COLORS[protocolType] || '#3b82f6';
    const rawTitle = session.title || `ORACLE: ${protocolType}`;
    const sessionTitle = rawTitle.length > 40 ? rawTitle.slice(0, 37) + '...' : rawTitle;

    sessionContainers.push({
      id: session.id,
      title: sessionTitle,
      x1: chosen.x,
      y1: chosen.y,
      x2: chosen.x + clusterW,
      y2: chosen.y + clusterH,
      color: sessionColor,
    });

    // SINGLE WIRE: Precision Anchor (Middle-Center of face)
    if (targetNode) {
      let sx = targetNode.x + (targetNode.w || 0) / 2;
      let sy = targetNode.y + (targetNode.h || 0) / 2;
      let tx = chosen.x;
      let ty = chosen.y + clusterH / 2;

      // Exact border alignment for "Strategic Port" feel
      if (side === 'right') { 
        sx = targetNode.x + targetNode.w!; 
        sy = targetNode.y + targetNode.h! / 2; 
        tx = chosen.x; 
      }
      else if (side === 'left') { 
        sx = targetNode.x; 
        sy = targetNode.y + targetNode.h! / 2; 
        tx = chosen.x + clusterW; 
      }
      else { 
        sx = targetNode.x + targetNode.w! / 2; 
        sy = targetNode.y + targetNode.h!; 
        ty = chosen.y; 
        tx = chosen.x + clusterW / 2; 
      }

      edges.push({
        id: `session-link-${session.id}`,
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        type: 'session',
        color: sessionColor,
      });
    }

    session.nodes.forEach((node, nIdx) => {
      const colIdx = nIdx % cols;
      const rowIdx = Math.floor(nIdx / cols);

      const nodeX = chosen.x + 20 + (colIdx * colWidth);
      const nodeY = chosen.y + 40 + (rowIdx * (SESSION_NODE_H + SESSION_NODE_GAP));
      const nodeCat = (node.category || node.type || 'INSIGHT').toUpperCase();
      const accentColor = CATEGORY_COLORS[nodeCat] || CATEGORY_COLORS.INSIGHT;

      sessionColNodes.push({
        id: node.id,
        name: node.name,
        category: nodeCat,
        summary: node.summary || '',
        color: accentColor,
        x: nodeX,
        y: nodeY,
        w: SESSION_NODE_W,
        h: SESSION_NODE_H,
        targetNodeId: primaryTargetId,
      });
    });

    occupiedBoxes.push({ x1: chosen.x - 20, y1: chosen.y - 20, x2: chosen.x + clusterW + 20, y2: chosen.y + clusterH + 20 });
    
    // Only push laneLow if it's actually in the pillar's vertical path
    if (side === 'bottom') {
      laneLows[rootPillarId] = Math.max(laneLows[rootPillarId], chosen.y + clusterH + 80);
    }
  });

  // Cross-links
  if (data.crossLinks) {
    data.crossLinks.forEach((cl, i) => {
      const src = layoutNodes.find(n => n.id === cl.source);
      const tgt = layoutNodes.find(n => n.id === cl.target);
      if (src && tgt) {
        edges.push({
          id: `cross-${i}`,
          sourceX: src.x + (src.w || 0),
          sourceY: src.y + (src.h || 0) / 2,
          targetX: tgt.x,
          targetY: tgt.y + (tgt.h || 0) / 2,
          type: 'cross',
          color: '#ff453a50',
        });
      }
    });
  }

  return { layoutNodes, pillarContainers, edges, sessionColNodes, sessionContainers };
}

// ── Main Component ────────────────────────────────────────────────────────
export default function OatsenGigaMap({
  sourceContent, onClose, noteId, onDataGenerated,
}: {
  sourceContent: string;
  onClose: () => void;
  noteId?: string;
  onDataGenerated?: (data: GigaMapData) => void;
}) {
  const { oracleSessions, addOracleSession, removeOracleSession } = useScribeV2Store();
  
  // Bug Fix: Filter sessions so they only appear in the specific context they belong to
  const contextualSessions = useMemo(() => {
    const currentContextKey = getGigaMapCacheKey(sourceContent).toString();
    return oracleSessions.filter(s => {
      // If noteId exists, match by noteId. 
      // If not (e.g. multi-graph), match by contextKey (hash of sourceContent).
      if (noteId && s.noteId === noteId) return true;
      if (s.contextKey === currentContextKey) return true;
      return false;
    });
  }, [oracleSessions, noteId, sourceContent]);

  const [data, setData] = useState<GigaMapData | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState<{ id: string; name: string; type: string; summary?: string }[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const { 
    activeWorkspaceId, 
    setWorkspace 
  } = useScribeV2Store();

  // ── Persistence: Load workspace on mount if needed ────────────────────────
  useEffect(() => {
    async function init() {
      if (!activeWorkspaceId || activeWorkspaceId === 'default-workspace') {
        const ws = await getWorkspace('default-workspace');
        if (ws) {
          setWorkspace(ws);
        }
      }
    }
    init();
  }, [activeWorkspaceId, setWorkspace]);

  // ESC to close
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [onClose]);

  // Synthesize map
  useEffect(() => {
    let active = true;
    synthesizeStrategistGigaMap(sourceContent).then(res => {
      if (active && res) {
        setData(res);
        setIsSynthesizing(false);
        if (onDataGenerated) onDataGenerated(res);
      }
    });
    return () => { active = false; };
  }, [sourceContent]);

  // D3 render: PRIMARY (Structural)
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const W = svgRef.current.clientWidth || window.innerWidth;
    const H = svgRef.current.clientHeight || window.innerHeight;

    // Capture current transform before clearing to prevent "jerk"
    const currentTransform = zoomRef.current ? d3.zoomTransform(svgRef.current) : d3.zoomIdentity;

    svg.selectAll('*').remove();

    // ── Defs: arrowhead marker + drop shadow ─────────────────────────────
    const defs = svg.append('defs');

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', 'var(--border)');

    defs.append('marker')
      .attr('id', 'arrowhead-session')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', 'var(--swarm-blue)');

    // Drop shadow filter
    const filter = defs.append('filter').attr('id', 'card-shadow').attr('x', '-5%').attr('y', '-5%').attr('width', '110%').attr('height', '110%');
    filter.append('feDropShadow').attr('dx', 0).attr('dy', 2).attr('stdDeviation', 6).attr('flood-color', 'rgba(0,0,0,0.15)').attr('flood-opacity', 1);

    // ── Dot grid background ──────────────────────────────────────────────
    const patternId = 'dot-grid';
    const pat = defs.append('pattern')
      .attr('id', patternId)
      .attr('x', 0).attr('y', 0)
      .attr('width', 24).attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');
    pat.append('circle').attr('cx', 1).attr('cy', 1).attr('r', 1).attr('fill', 'var(--border)').attr('opacity', 0.5);

    svg.append('rect')
      .attr('width', '100%').attr('height', '100%')
      .attr('fill', `url(#${patternId})`);

    // ── Zoom & Pan ──────────────────────────────────────────────────────
    const g = svg.append('g').attr('class', 'map-root');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 4])
      .on('zoom', e => g.attr('transform', e.transform));

    svg.call(zoom).on('dblclick.zoom', null);
    
    // Restore transform if it was already set (prevents the jerk)
    if (currentTransform !== d3.zoomIdentity) {
      svg.call(zoom.transform, currentTransform);
    }
    
    zoomRef.current = zoom;

    // ── Compute layout ───────────────────────────────────────────────────
    const { 
      layoutNodes, pillarContainers, edges, sessionColNodes, sessionContainers 
    } = computeLayout(data, contextualSessions);

    const mainG = g.append('g').attr('class', 'main-g');

    // ── Session Containers (Background) ──────────────────────────────────
    const sessG = mainG.append('g').attr('class', 'session-containers');
    
    const sessConts = sessG.selectAll('g.session-frame')
      .data(sessionContainers || [])
      .enter().append('g')
      .attr('class', 'session-frame');

    // The Frame Rect
    sessConts.append('rect')
      .attr('x', d => d.x1)
      .attr('y', d => d.y1)
      .attr('width', d => d.x2 - d.x1)
      .attr('height', d => d.y2 - d.y1)
      .attr('rx', 12)
      .attr('fill', d => d.color + '08') // Very subtle tint
      .attr('stroke', d => d.color + '40') // Faded border
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5 3');

    // The Title Tag BG (Pill)
    sessConts.append('rect')
      .attr('x', d => d.x1 + 16)
      .attr('y', d => d.y1 - 14)
      .attr('width', d => Math.min(d.x2 - d.x1 - 32, Math.max(130, (d.title.length * 7.2) + 32)))
      .attr('height', 28)
      .attr('rx', 14)
      .attr('fill', d => d.color)
      .attr('opacity', 0.95);

    // The Title Text
    sessConts.append('text')
      .attr('x', d => d.x1 + 30)
      .attr('y', d => d.y1 + 4)
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.04em')
      .text(d => d.title);

    // ── Hierarchy & Session Edges ────────────────────────────────────────
    const edgeG = mainG.append('g').attr('class', 'edges');

    edgeG.selectAll('path.edge')
      .data(edges.filter(e => e.type === 'hierarchy'))
      .enter().append('path')
      .attr('class', 'edge')
      .attr('d', (e: LayoutEdge) => {
        const dy = Math.abs(e.targetY - e.sourceY);
        const cp = dy / 2;
        return `M${e.sourceX},${e.sourceY} C${e.sourceX},${e.sourceY + cp} ${e.targetX},${e.targetY - cp} ${e.targetX},${e.targetY}`;
      })
      .attr('stroke', (e: LayoutEdge) => e.color)
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');

    // ── Session links (dashed lines from nodes to their analysis sessions) ─
    const sessLinks = edgeG.selectAll('g.session-link-group')
      .data(edges.filter(e => e.type === 'session'))
      .enter().append('g')
      .attr('class', 'session-link-group');

    // The Path
    sessLinks.append('path')
      .attr('class', 'session-link')
      .attr('d', (e: LayoutEdge) => {
        const midX = (e.sourceX + e.targetX) / 2;
        return `M${e.sourceX},${e.sourceY} L${midX},${e.sourceY} L${midX},${e.targetY} L${e.targetX},${e.targetY}`;
      })
      .attr('stroke', (e: LayoutEdge) => e.color)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '6 4')
      .attr('fill', 'none')
      .attr('opacity', 1.0)
      .attr('marker-end', 'url(#arrowhead-session)');

    // Source Plug (Anchor Marker)
    sessLinks.append('circle')
      .attr('cx', e => e.sourceX)
      .attr('cy', e => e.sourceY)
      .attr('r', 5.5)
      .attr('fill', e => e.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // Target Plug (Entry Marker)
    sessLinks.append('circle')
      .attr('cx', e => e.targetX)
      .attr('cy', e => e.targetY)
      .attr('r', 5.5)
      .attr('fill', e => e.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // ── Cross-links ───────────────────────────────────────────────────────
    edgeG.selectAll('path.cross')
      .data(edges.filter(e => e.type === 'cross'))
      .enter().append('path')
      .attr('class', 'cross')
      .attr('d', (e: LayoutEdge) => {
        const mx = (e.sourceX + e.targetX) / 2;
        return `M${e.sourceX},${e.sourceY} C${mx},${e.sourceY} ${mx},${e.targetY} ${e.targetX},${e.targetY}`;
      })
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4')
      .attr('fill', 'none')
      .attr('opacity', 0.5);

    // ── Pillar section containers ─────────────────────────────────────────
    const pillarG = g.append('g').attr('class', 'pillars');
    pillarContainers.forEach((pc: LayoutPillarContainer) => {
      const pg = pillarG.append('g').attr('class', 'pillar-container');

      // Background rect
      pg.append('rect')
        .attr('x', pc.x)
        .attr('y', pc.y)
        .attr('width', pc.w)
        .attr('height', pc.h)
        .attr('rx', 16)
        .attr('fill', 'var(--bg-card)')
        .attr('stroke', pc.color + '40')
        .attr('stroke-width', 1.5)
        .style('filter', 'url(#card-shadow)');

      // Top colored band
      pg.append('rect')
        .attr('x', pc.x)
        .attr('y', pc.y)
        .attr('width', pc.w)
        .attr('height', 6)
        .attr('rx', 16)
        .attr('fill', pc.color);

      // Pillar title label (wrapped using foreignObject)
      pg.append('foreignObject')
        .attr('x', pc.x)
        .attr('y', TITLE_ROW_Y - 15) // Adjust to center vertically if needed
        .attr('width', pc.w)
        .attr('height', 50)
        .append('xhtml:div')
        .attr('style', `
          font-family: var(--font-inter, sans-serif);
          font-size: 14.5px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: ${pc.color};
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          line-height: 1.1;
          word-break: break-word;
          overflow: hidden;
        `)
        .text(pc.name.toUpperCase());
    });

    // ── Cluster headers ───────────────────────────────────────────────────
    const clusterNodes = layoutNodes.filter(n => n.type === 'cluster');
    const clusterG = g.append('g').attr('class', 'clusters');

    clusterNodes.forEach(cl => {
      const cg = clusterG.append('g')
        .attr('class', 'cluster-node')
        .attr('data-id', cl.id)
        .style('cursor', 'pointer')
        .on('click', (event: MouseEvent) => {
          event.stopPropagation();
          setSelectedNodes(prev => {
            const exists = prev.find(n => n.id === cl.id);
            if (event.shiftKey) return exists ? prev.filter(n => n.id !== cl.id) : [...prev, { id: cl.id, name: cl.name, type: 'cluster' }];
            return exists && prev.length === 1 ? [] : [{ id: cl.id, name: cl.name, type: 'cluster' }];
          });
        });

      cg.append('rect')
        .attr('x', cl.x)
        .attr('y', cl.y)
        .attr('width', cl.w)
        .attr('height', cl.h)
        .attr('rx', 10)
        .attr('fill', cl.color)
        .attr('opacity', 0.15);

      cg.append('rect')
        .attr('x', cl.x)
        .attr('y', cl.y)
        .attr('width', cl.w)
        .attr('height', cl.h)
        .attr('rx', 10)
        .attr('fill', 'none')
        .attr('stroke', cl.color)
        .attr('stroke-width', 1.5);

      // Cluster label (wrapped using foreignObject)
      const fo = cg.append('foreignObject')
        .attr('x', cl.x + 10)
        .attr('y', cl.y)
        .attr('width', cl.w - 20)
        .attr('height', cl.h);

      fo.append('xhtml:div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('height', '100%')
        .style('font-size', '10px')
        .style('font-weight', '800')
        .style('font-family', 'var(--font-inter, sans-serif)')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.12em')
        .style('color', cl.color)
        .style('overflow', 'hidden')
        .style('white-space', 'nowrap')
        .style('text-overflow', 'ellipsis')
        .html(cl.name.toUpperCase());
    });

    // ── Leaf cards ────────────────────────────────────────────────────────
    const leafNodes = layoutNodes.filter(n => n.type === 'leaf');
    const leafG = g.append('g').attr('class', 'leaves');

    leafNodes.forEach(lf => {
      const lg = leafG.append('g')
        .attr('class', 'leaf-node')
        .attr('data-id', lf.id)
        .style('cursor', 'pointer')
        .on('click', (event: MouseEvent) => {
          event.stopPropagation();
          setSelectedNodes(prev => {
            const exists = prev.find(n => n.id === lf.id);
            if (event.shiftKey) return exists ? prev.filter(n => n.id !== lf.id) : [...prev, { id: lf.id, name: lf.name, type: 'leaf', summary: lf.summary }];
            return exists && prev.length === 1 ? [] : [{ id: lf.id, name: lf.name, type: 'leaf', summary: lf.summary }];
          });
        })
        .on('mouseenter', () => setHoveredId(lf.id))
        .on('mouseleave', () => setHoveredId(null));

      // Card background
      lg.append('rect')
        .attr('class', 'card-bg')
        .attr('x', lf.x)
        .attr('y', lf.y)
        .attr('width', lf.w)
        .attr('height', lf.h)
        .attr('rx', 10)
        .attr('fill', 'var(--bg-card)')
        .attr('stroke', 'var(--border-soft)')
        .attr('stroke-width', 1);

      // Left color accent bar
      lg.append('rect')
        .attr('x', lf.x)
        .attr('y', lf.y + 8)
        .attr('width', LEAF_ACCENT_W)
        .attr('height', lf.h - 16)
        .attr('rx', 3)
        .attr('fill', lf.accentColor!);

      // Node content via foreignObject
      const fo = lg.append('foreignObject')
        .attr('x', lf.x + LEAF_ACCENT_W + LEAF_INNER_PAD)
        .attr('y', lf.y)
        .attr('width', lf.w - LEAF_ACCENT_W - LEAF_INNER_PAD * 2)
        .attr('height', lf.h);

      const inner = fo.append('xhtml:div')
        .attr('class', 'card-content')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('justify-content', 'center')
        .style('height', '100%')
        .style('padding', '6px 0')
        .style('overflow', 'hidden')
        .style('pointer-events', 'none');

      // Category badge
      if (lf.category) {
        inner.append('xhtml:span')
          .attr('class', 'category-badge')
          .style('font-size', '8px')
          .style('font-weight', '900')
          .style('font-family', 'var(--font-inter, sans-serif)')
          .style('text-transform', 'uppercase')
          .style('letter-spacing', '0.12em')
          .style('color', lf.accentColor ?? CATEGORY_COLORS.INSIGHT)
          .style('margin-bottom', '3px')
          .html(lf.category);
      }

      inner.append('xhtml:p')
        .attr('class', 'node-title')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('font-family', 'var(--font-inter, sans-serif)')
        .style('color', 'var(--ink)')
        .style('line-height', '1.35')
        .style('overflow', 'hidden')
        .style('display', '-webkit-box')
        .style('-webkit-line-clamp', '2')
        .style('-webkit-box-orient', 'vertical')
        .style('margin', '0')
        .html(lf.name);
    });

    // ── Session analysis nodes (placed near their target nodes) ──────────────
    if (sessionColNodes.length > 0) {
      const sessionG = g.append('g').attr('class', 'session-nodes');

      sessionColNodes.forEach(sn => {
        const sg = sessionG.append('g')
          .attr('class', 'session-node')
          .attr('data-id', sn.id)
          .style('cursor', 'pointer')
          .on('click', (event: MouseEvent) => {
            event.stopPropagation();
            setSelectedNodes(prev => {
              const exists = prev.find(n => n.id === sn.id);
              if (event.shiftKey) return exists ? prev.filter(n => n.id !== sn.id) : [...prev, { id: sn.id, name: sn.name, type: sn.category, summary: sn.summary }];
              return exists && prev.length === 1 ? [] : [{ id: sn.id, name: sn.name, type: sn.category, summary: sn.summary }];
            });
          });

        sg.append('rect')
          .attr('class', 'card-bg')
          .attr('x', sn.x)
          .attr('y', sn.y)
          .attr('width', sn.w)
          .attr('height', sn.h)
          .attr('rx', 12)
          .attr('fill', 'var(--bg-card)')
          .attr('stroke', sn.color)
          .attr('stroke-width', 1.5)
          .style('filter', 'url(#card-shadow)');

        sg.append('rect')
          .attr('x', sn.x)
          .attr('y', sn.y + 10)
          .attr('width', LEAF_ACCENT_W - 1)
          .attr('height', sn.h - 20)
          .attr('rx', 3)
          .attr('fill', sn.color);

        const fo = sg.append('foreignObject')
          .attr('x', sn.x + LEAF_ACCENT_W + 8)
          .attr('y', sn.y)
          .attr('width', sn.w - LEAF_ACCENT_W - 18)
          .attr('height', sn.h);

        const inner = fo.append('xhtml:div')
          .attr('class', 'card-content')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('justify-content', 'center')
          .style('height', '100%')
          .style('overflow', 'hidden')
          .style('pointer-events', 'none');

        inner.append('xhtml:span')
          .attr('class', 'category-badge')
          .style('font-size', '8px').style('font-weight', '900')
          .style('font-family', 'var(--font-inter, sans-serif)')
          .style('text-transform', 'uppercase').style('letter-spacing', '0.12em')
          .style('color', sn.color).style('margin-bottom', '4px')
          .html(sn.category.toUpperCase());

        inner.append('xhtml:p')
          .attr('class', 'node-title')
          .style('font-size', '11px').style('font-weight', '600')
          .style('font-family', 'var(--font-inter, sans-serif)')
          .style('color', 'var(--ink)').style('line-height', '1.3')
          .style('overflow', 'hidden').style('display', '-webkit-box')
          .style('-webkit-line-clamp', '2').style('-webkit-box-orient', 'vertical')
          .style('margin', '0').html(sn.name);

        // Redundant edge logic removed - handled by main edge layer
      });
    }

  }, [data, oracleSessions]);

  // D3 render: INTERACTION updates (Selection/Hover)
  useEffect(() => {
    if (!data || !svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Update highlights for all nodes based on selectedNodes and hoveredId
    const { layoutNodes, sessionColNodes } = computeLayout(data, oracleSessions);
    const allSelectableNodes = [...layoutNodes, ...sessionColNodes];

    allSelectableNodes.forEach(node => {
      const isSelected = selectedNodes.some(sn => sn.id === node.id);
      const isHovered = hoveredId === node.id;
      
      const nodeG = svg.select(`[data-id="${node.id}"]`);
      if (nodeG.empty()) return;

      const accentColor = (node as any).accentColor || (node as any).color || 'var(--ink)';
      const nodeType = (node as any).type || 'session';

      nodeG.select('.card-bg')
        .attr('fill', isSelected ? accentColor! : 'var(--bg-card)')
        .attr('stroke', isSelected ? (nodeType === 'leaf' ? accentColor! : '#fff') : (isHovered ? accentColor! : 'var(--border-soft)'))
        .attr('stroke-width', isSelected ? 2 : (isHovered ? 1.5 : 1));

      const content = nodeG.select('.card-content');
      content.select('.category-badge')
        .style('color', isSelected ? 'rgba(255,255,255,0.8)' : accentColor);
      content.select('.node-title')
        .style('color', isSelected ? '#fff' : 'var(--ink)');
    });
  }, [selectedNodes, hoveredId, data, oracleSessions]);

  // ── Protocol-specific prompt builder ─────────────────────────────────────
  const PROTOCOL_PROMPTS: Record<string, string> = {
    'red-team': `You are a relentless adversarial analyst. Your ONLY job is to stress-test, challenge, and expose every critical flaw, assumption, and vulnerability in the selected node. Generate 5–8 nodes. Categories MUST be: CRITIQUE, RISK, or QUESTION only. Be brutal, specific, named, and evidence-based.`,
    'gaps-audit': `You are a precision gaps auditor. Find every logical gap, missing element, unstated assumption, and blind spot related to the selected node. Generate 5–8 nodes. Categories MUST be: QUESTION, RISK, or INSIGHT. Each node must name a specific missing piece.`,
    'golden-path': `You are a strategic pathfinder. Map the optimal step-by-step route from the current state of the selected node to a successful outcome. Generate 6–10 sequential or parallel action steps. Categories MUST be: PATH only (all nodes). Each node must be a specific, actionable step with a clear owner or mechanism. Order them logically as a roadmap.`,
    'blue-ocean': `You are a Blue Ocean strategist. Identify untapped market spaces, uncontested opportunities, and differentiation vectors related to the selected node. Generate 5–8 nodes. Categories MUST be: OPPORTUNITY or INSIGHT. Each must name a specific unexplored space or strategic move with real market context.`,
    'first-principles': `You are a first-principles thinker. Decompose the selected node down to its foundational axioms and irreducible truths. Then reconstruct key insights from the ground up. Generate 6–9 nodes. Categories MUST be: FACT, INSIGHT, or PATH. Each node should be either a bedrock truth or a reconstructed principle.`,
    'scamper': `You are a SCAMPER innovation facilitator. Apply each SCAMPER lens (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Rearrange) to the selected node and generate novel innovation angles. Generate 7–9 nodes (one per SCAMPER lens where applicable). Categories: OPPORTUNITY or INSIGHT. Label each with its SCAMPER lens.`,
    'find-connection': `You are a systemic connection mapper. Find the deepest, most non-obvious systemic links between the selected nodes. Generate 5–8 nodes revealing hidden dependencies, causal chains, or leverage points. Categories: INSIGHT, PATH, or FACT.`,
  };

  // ── Workbench action ─────────────────────────────────────────────────────
  const handleWorkbenchAction = useCallback(async (action: string) => {
    if (selectedNodes.length === 0 || !data) return;
    setIsMutating(true);
    try {
      // Build a protocol-aware query using the specific protocol prompt
      const protocolContext = PROTOCOL_PROMPTS[action] || `Perform ${action} analysis on the selected node.`;
      const nodeSummaries = selectedNodes.map(n => n.summary ? `${n.name}: ${n.summary}` : n.name).join('\n');
      const query = `PROTOCOL: ${action.toUpperCase()}\n\nSELECTED NODES:\n${nodeSummaries}\n\nINSTRUCTION: ${protocolContext}`;

      const result = await executeStrategistQuery(query, action, sourceContent, []);
      if (result) {
        const session: GigaWorkbenchSession = {
          id: Math.random().toString(36).substr(2, 9),
          type: action as any,
          title: result.sessionTitle,
          summary: result.chatSummary,
          timestamp: new Date().toISOString(),
          targetNodeIds: selectedNodes.map(n => n.id),
          noteId: noteId,
          contextKey: getGigaMapCacheKey(sourceContent).toString(),
          nodes: result.nodes.map((n: any, i: number) => ({
            id: `oatsen-node-${Date.now()}-${i}`,
            name: n.label,
            type: n.category?.toLowerCase() as any,
            summary: n.summary,
          })),
        };
        addOracleSession(session);
      }
    } finally {
      setIsMutating(false);
    }
  }, [selectedNodes, data, sourceContent, addOracleSession]);

  const handleRegenerate = useCallback(async () => {
    setIsSynthesizing(true);
    try {
      const res = await synthesizeStrategistGigaMap(sourceContent, true);
      if (res) {
        setData(res);
        if (onDataGenerated) onDataGenerated(res);
      }
    } finally {
      setIsSynthesizing(false);
    }
  }, [sourceContent, onDataGenerated]);

  // ── Sorted data for sidebar ───────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      pillars: [...(data.pillars || [])].sort((a, b) => a.name.localeCompare(b.name)),
      clusters: [...(data.clusters || [])].sort((a, b) => a.name.localeCompare(b.name)),
      leaves: [...(data.leaves || [])].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [data]);

  return (
    <div className="fixed inset-0 z-500 overflow-hidden" style={{ backgroundColor: 'var(--tactical-bg)' }}>
      {/* ESC hint */}
      <div className="absolute top-6 right-8 flex items-center gap-4 z-50 font-sans text-[10px]">
        <div className="text-(--ink-light) pointer-events-none uppercase font-black tracking-widest opacity-40">
          ESC to return
        </div>
      </div>

      {/* Loading overlay */}
      {isSynthesizing && (
        <div className="absolute inset-0 flex flex-col justify-center items-center z-50" style={{ backgroundColor: 'var(--tactical-bg)' }}>
          <CircleNotch size={40} weight="thin" className="animate-spin text-(--ink-light)" />
          <span className="text-(--ink-dim) uppercase font-sans tracking-widest text-xs mt-4">
            Building Oracle Map
          </span>
          <span className="text-(--ink-light) font-sans text-xs mt-1 opacity-60">
            Extracting structured intelligence...
          </span>
        </div>
      )}

      {/* Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={() => setSelectedNodes([])}
      />

      {/* Sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(v => !v)}
        className={`fixed top-1/2 -translate-y-1/2 right-0 z-100 p-2 bg-(--bg-card) border border-r-0 border-(--border) rounded-l-xl shadow-lg transition-transform duration-300 ${isSidebarOpen ? 'translate-x-[360px]' : 'translate-x-0'}`}
      >
        <Graph size={20} weight="duotone" className="text-(--ink-dim)" />
      </button>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="fixed top-[84px] right-4 w-[360px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden z-500 bg-(--bg-card)/95 backdrop-blur-md border border-(--border) shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-2xl">
          {/* Header */}
          <div className="flex flex-col px-6 pt-6 pb-3 border-b border-(--border-soft) bg-(--bg-card)/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-(--ink-light) uppercase tracking-[0.2em] font-bold">
                  ORACLE
                </span>
                <span className="text-[11px] font-black text-(--ink) tracking-tight">
                  {selectedNodes.length > 0 ? `${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''} selected` : 'Oracle Spatial Map'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleRegenerate}
                  disabled={isSynthesizing || isMutating}
                  className="p-1.5 text-(--ink-light) hover:bg-(--ink)/5 hover:text-indigo-500 rounded transition-all disabled:opacity-30"
                  title="Refine & Reconstruct Map"
                >
                  <ArrowCounterClockwise size={16} className={isSynthesizing ? 'animate-spin' : ''} />
                </button>
                {selectedNodes.length > 0 && (
                  <button onClick={() => setSelectedNodes([])} className="text-[9px] font-mono text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded uppercase tracking-wider transition-colors">
                    Clear
                  </button>
                )}
                <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-(--ink-light) hover:bg-(--ink)/5 hover:text-(--ink) rounded transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-minimal">
            {selectedNodes.length > 0 ? (
              <div className="space-y-4">
                {/* Selected node detail */}
                {selectedNodes.length === 1 && (
                  <div className="px-2">
                    {selectedNodes[0].summary && (
                      <p className="text-(--ink-dim) text-[13px] leading-relaxed bg-(--bg-muted) p-3 rounded-lg border border-(--border-soft) mb-4">
                        {selectedNodes[0].summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Multi-select list */}
                {selectedNodes.length > 1 && (
                  <div className="space-y-2 px-2">
                    {selectedNodes.map(node => (
                      <div key={node.id} className="p-3 bg-(--bg-card) rounded-xl border border-(--border-soft) flex justify-between items-center">
                        <div>
                          <p className="text-(--ink) text-[12px] font-semibold">{node.name}</p>
                          <span className="text-(--ink-light) text-[9px] uppercase">{node.type}</span>
                        </div>
                        <X size={12} className="text-(--ink-light) hover:text-red-400 cursor-pointer" onClick={e => { e.stopPropagation(); setSelectedNodes(p => p.filter(n => n.id !== node.id)); }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Workbench protocols */}
                <div className="px-2 pt-4 border-t border-(--border-soft)">
                  <p className="text-[9px] font-mono text-(--ink-light) uppercase tracking-[0.2em] mb-3">
                    Oracle Protocols
                  </p>
                  {selectedNodes.length === 1 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'red-team', label: 'Red Team', icon: <ShieldCheck size={16} className="text-red-500" />, hoverColor: 'hover:border-red-400' },
                          { id: 'gaps-audit', label: 'Gaps Audit', icon: <Fingerprint size={16} className="text-orange-500" />, hoverColor: 'hover:border-orange-400' },
                          { id: 'golden-path', label: 'Golden Path', icon: <Path size={16} className="text-indigo-500" />, hoverColor: 'hover:border-indigo-400' },
                          { id: 'blue-ocean', label: 'Blue Ocean', icon: <ChartPieSlice size={16} className="text-blue-500" />, hoverColor: 'hover:border-blue-400' },
                          { id: 'first-principles', label: 'Pillars', icon: <Target size={16} className="text-emerald-500" />, hoverColor: 'hover:border-emerald-400' },
                          { id: 'scamper', label: 'SCAMPER', icon: <ArrowCounterClockwise size={16} className="text-violet-500" />, hoverColor: 'hover:border-violet-400' },
                        ].map(btn => (
                          <button
                            key={btn.id}
                            onClick={() => handleWorkbenchAction(btn.id)}
                            disabled={isMutating}
                            className={`flex flex-col items-center gap-1.5 p-3 bg-(--bg-card) border border-(--border) rounded-xl ${btn.hoverColor} transition-all disabled:opacity-50`}
                          >
                            {btn.icon}
                            <span className="text-[8px] font-bold uppercase tracking-widest text-(--ink)">{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedNodes.length > 1 && (
                    <button
                      onClick={() => handleWorkbenchAction('find-connection')}
                      disabled={isMutating}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-(--bg-card) border border-(--border) rounded-xl hover:border-purple-400 transition-all"
                    >
                      <Intersect size={20} className="text-purple-500" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-(--ink)">Find Systemic Link</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Node tree explorer */
              <div className="space-y-4 px-2">
                {sortedData?.pillars.map((pillar, pIdx) => (
                  <div key={pillar.id} className="space-y-1.5">
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.2em] pb-1.5 border-b cursor-pointer"
                      style={{ color: PILLAR_PALETTE[pIdx % PILLAR_PALETTE.length], borderColor: PILLAR_PALETTE[pIdx % PILLAR_PALETTE.length] + '30' }}
                      onClick={() => setSelectedNodes([{ id: pillar.id, name: pillar.name, type: 'pillar' }])}
                    >
                      {pillar.name}
                    </p>
                    {sortedData.clusters.filter(c => c.pillarId === pillar.id).map(cluster => (
                      <div key={cluster.id} className="ml-2 space-y-0.5">
                        <p
                          className="text-[9px] font-bold uppercase tracking-wider text-(--ink-dim) cursor-pointer hover:text-(--ink) transition-colors py-0.5"
                          onClick={() => setSelectedNodes([{ id: cluster.id, name: cluster.name, type: 'cluster' }])}
                        >
                          ↳ {cluster.name}
                        </p>
                        {sortedData.leaves.filter(l => l.clusterId === cluster.id).map(leaf => (
                          <p
                            key={leaf.id}
                            className="text-[12px] font-serif text-(--ink-dim) hover:text-(--ink) cursor-pointer pl-3 py-0.5 rounded hover:bg-(--ink)/5 transition-all"
                            onClick={() => setSelectedNodes([{ id: leaf.id, name: leaf.name, type: 'leaf', summary: leaf.summary }])}
                          >
                            {leaf.name}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Oracle sessions */}
                {oracleSessions.length > 0 && (
                  <div className="pt-4 border-t border-(--border-soft)">
                    <p className="text-[9px] font-mono text-(--ink-light) uppercase tracking-widest mb-3">Analysis Blocks</p>
                    {oracleSessions.slice().reverse().map(session => (
                      <div key={session.id} className="p-3 bg-(--bg-muted) rounded-xl border border-(--border-soft) mb-2 relative group">
                        <button
                          onClick={() => removeOracleSession(session.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-(--ink-light) hover:text-red-400 transition-all"
                        >
                          <X size={12} />
                        </button>
                        <p className="text-[10px] font-black uppercase tracking-wider text-(--ink)">{session.title}</p>
                        <p className="text-[11px] text-(--ink-dim) mt-1 leading-relaxed">{session.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading indicator during workbench action */}
      {isMutating && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-(--bg-card) border border-(--border) rounded-2xl shadow-xl">
          <CircleNotch size={16} className="animate-spin text-(--ink-dim)" />
          <span className="text-[11px] font-mono text-(--ink-dim) uppercase tracking-widest">Analyzing...</span>
        </div>
      )}
    </div>
  );
}
