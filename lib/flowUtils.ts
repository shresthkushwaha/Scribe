import { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import dagre from 'dagre';
import * as d3 from 'd3';
import { Node as GNode, Link as GLink, LENS_CONFIGS } from './graphEngine';

/**
 * Converts internal GraphEngine nodes/links to React Flow format.
 */
export function convertToFlow(nodes: GNode[], links: GLink[]): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const flowNodes: FlowNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    parentId: (n as any).parentId,
    extent: (n as any).extent,
    width: n.width,
    height: n.height,
    data: { 
      label: n.label,
      text: n.text,
      resonanceScore: n.resonanceScore,
      summary: n.summary,
      pkgId: n.pkgId,
      category: (n as any).category,
      sessionTitle: (n as any).sessionTitle,
      resourceType: n.type,
      fullNode: n,
      color: n.color
    },
    style: (n as any).style
  }));

  const flowEdges: FlowEdge[] = links.map((l, i) => {
    const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
    const targetId = typeof l.target === 'string' ? l.target : l.target.id;
    
    return {
      id: `e-${sourceId}-${targetId}-${i}`,
      source: sourceId,
      target: targetId,
      type: 'tactical', // Our custom edge type
      data: { 
        type: l.type,
        value: l.value,
        color: l.color
      },
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
}

/**
 * Uses Dagre to calculate an auto-organized layout (structured).
 */
export function getLayoutedElements(nodes: FlowNode[], edges: FlowEdge[], direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 60;

  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    // Only layout top-level nodes to avoid breaking nested sections
    if (!node.parentId) {
      dagreGraph.setNode(node.id, { width: node.width || nodeWidth, height: node.height || nodeHeight });
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node; // Skip child nodes (keep original relative position)
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.width || nodeWidth) / 2,
        y: nodeWithPosition.y - (node.height || nodeHeight) / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
}

/**
 * Uses d3-force to calculate an organic, non-overlapping layout.
 * Runs a simulation for limited ticks to "settle" the nodes.
 */
export function getForceLayout(nodes: FlowNode[], edges: FlowEdge[], lensValue: string = 'strategist') {
  // 1. Prepare simulation nodes (only those without parents, or the parents themselves)
  // In our case, we want to layout everything but maintain relative positions for some.
  // For 'Oracle' feel, let's layout all nodes but apply clustering forces.
  
  const simulationNodes = nodes.map(n => ({ 
    id: n.id, 
    x: n.position.x || Math.random() * 800, 
    y: n.position.y || Math.random() * 600,
    width: n.width || 200,
    height: n.height || 80,
    type: n.type,
    parentId: n.parentId,
    insightIndex: ((n.data as any)?.fullNode?.insightIndex ?? (n.data as any)?.insightIndex) as number | undefined,
    category: n.data?.category,
    _node: n 
  }));

  const nodeIds = new Set(simulationNodes.map(n => n.id));
  const simulationEdges = edges
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map(e => ({
      source: e.source,
      target: e.target,
      value: e.data?.value || 0.5
    }));

  // 2. Clustering Logic: Group by parent or insightIndex
  const clusters: Record<string, { x: number; y: number; count: number }> = {};
  simulationNodes.forEach(n => {
    const clusterId = (n.parentId || (n.insightIndex !== undefined ? `island-${n.insightIndex}` : 'global')) as string;
    if (!clusters[clusterId]) clusters[clusterId] = { x: 0, y: 0, count: 0 };
    (clusters as any)[clusterId].x += n.x;
    (clusters as any)[clusterId].y += n.y;
    (clusters as any)[clusterId].count++;
  });
  Object.values(clusters).forEach(c => { c.x /= c.count; c.y /= c.count; });

  const simulation = d3.forceSimulation(simulationNodes as any)
    .force('link', d3.forceLink(simulationEdges).id((d: any) => d.id).distance((d: any) => {
        // Shorter links for same-cluster, longer for inter-cluster
        return d.value > 0.8 ? 80 : 180;
    }))
    // 3. Exponential Repulsion: Stronger many-body force
    .force('charge', d3.forceManyBody().strength((d: any) => {
        if (d.type === 'SECTION_GROUP') return -2000; // Sections push away HARD
        return -400; // Stronger default repulsion
    }))
    .force('x', d3.forceX().x((d: any) => {
        const clusterId = d.parentId || (d.insightIndex !== undefined ? `island-${d.insightIndex}` : 'global');
        return clusters[clusterId]?.x || 400;
    }).strength(0.15)) // Clustering 'gravity'
    .force('y', d3.forceY().y((d: any) => {
        const clusterId = d.parentId || (d.insightIndex !== undefined ? `island-${d.insightIndex}` : 'global');
        return clusters[clusterId]?.y || 300;
    }).strength(0.15))
    .force('collide', d3.forceCollide().radius((d: any) => {
        // 4. Force-Directed Distancing: Massive personal bubbles
        if (d.type === 'SECTION_GROUP') return Math.max(d.width, d.height) / 1.5 + 50;
        if (d.type === 'EPICENTER' || d.type === 'ANCHOR') return 120;
        return 90; // Default bubble
    }).iterations(3))
    .force('center', d3.forceCenter(800, 600).strength(0.01))
    .stop();

  // Run simulation longer for better settlement
  for (let i = 0; i < 300; ++i) simulation.tick();

  const layoutedNodes = nodes.map(originalNode => {
    const simNode = simulationNodes.find(sn => sn.id === originalNode.id);
    if (simNode) {
        return {
            ...originalNode,
            position: { x: simNode.x, y: simNode.y }
        };
    }
    return originalNode;
  });

  return { nodes: layoutedNodes, edges };
}
