import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Panel,
  Connection,
  Edge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Node as GNode, Link as GLink } from '@/lib/graphEngine';
import { convertToFlow, getLayoutedElements, getForceLayout } from '@/lib/flowUtils';
import { 
  StrategistNode, 
  PersonaNode, 
  EntityNode, 
  SentenceNode,
  SectionGroupNode
} from './flow/FlowNodes';
import { TacticalEdge } from './flow/TacticalEdge';
import { ArrowsClockwise, MagicWand, Layout, SelectionAll } from '@phosphor-icons/react';

const nodeTypes = {
  STRAT_CRITIQUE: StrategistNode,
  STRAT_RISK: StrategistNode,
  STRAT_OPPORTUNITY: StrategistNode,
  STRAT_INSIGHT: StrategistNode,
  STRAT_PATH: StrategistNode,
  STRAT_FACT: StrategistNode,
  STRAT_QUESTION: StrategistNode,
  PERSONA: PersonaNode,
  ENTITY: EntityNode,
  TRAIT: EntityNode, 
  SENTENCE: SentenceNode,
  ANCHOR: EntityNode, 
  EPICENTER: EntityNode, 
  SECTION_GROUP: SectionGroupNode,
};

const edgeTypes = {
  tactical: TacticalEdge,
};

interface DecisionCanvasProps {
  nodes: GNode[];
  links: GLink[];
  onNodeSelect?: (nodeId: string | null) => void;
  lens?: string;
}

function DecisionCanvasContent({ 
  propNodes, 
  propLinks, 
  onNodeSelect,
  lens = 'strategist' 
}: { propNodes: GNode[], propLinks: GLink[], onNodeSelect?: any, lens?: string }) {
  const [isLayouting, setIsLayouting] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const { fitView } = useReactFlow();

  const performLayout = useCallback(async () => {
    setIsLayouting(true);
    await new Promise(resolve => setTimeout(resolve, 50));

    const { nodes: flowNodes, edges: flowEdges } = convertToFlow(propNodes, propLinks);
    
    let layouted;
    const hasDefinedPositions = propNodes.some(n => (n.x !== 0 || n.y !== 0));

    if (lens === 'oracle') {
      layouted = getLayoutedElements(flowNodes, flowEdges);
    } else if (lens === 'strategist') {
      if (hasDefinedPositions) {
          layouted = { nodes: flowNodes, edges: flowEdges };
      } else {
          layouted = getLayoutedElements(flowNodes, flowEdges);
      }
    } else {
      layouted = getForceLayout(flowNodes, flowEdges, lens);
    }

    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    
    setTimeout(() => {
        setIsLayouting(false);
        fitView({ duration: 800, padding: 0.2 });
    }, 400);
  }, [propNodes, propLinks, lens, setNodes, setEdges, fitView]);

  useEffect(() => {
    performLayout();
  }, [propNodes, propLinks, lens]); // Removed performLayout from deps to avoid loop if it changes

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onOrganicLayout = useCallback(() => {
      setIsLayouting(true);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getForceLayout(nodes, edges, lens);
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      setTimeout(() => {
          setIsLayouting(false);
          fitView({ duration: 800, padding: 0.2 });
      }, 400);
  }, [nodes, edges, lens, setNodes, setEdges, fitView]);

  return (
    <div className="w-full h-full bg-[#f8f9fa] relative group">
      {isLayouting && (
        <div className="absolute inset-0 z-100 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-black/5 border-t-black animate-spin" />
                <MagicWand size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black animate-pulse" />
            </div>
            <p className="mt-4 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-black opacity-40">
                Optimizing Territory...
            </p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onNodeSelect?.(node.id)}
        onPaneClick={() => onNodeSelect?.(null)}
        minZoom={0.05}
        maxZoom={4}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'tactical',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: 'rgba(0,0,0,0.2)',
          },
        }}
      >
        <Background color="#dee2e6" gap={20} size={1} />
        
        <Panel position="bottom-right" className="flex flex-col items-end gap-3 mb-4 mr-4">
            <button 
                onClick={onOrganicLayout}
                className="flex items-center gap-3 px-6 py-3 bg-black text-white border-2 border-white/20
                rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-amber-500/40 transition-all 
                font-black text-[12px] uppercase tracking-[0.2em] group"
                title="Perfect Realign"
            >
                <SelectionAll size={20} weight="fill" className="text-amber-400 group-hover:scale-125 transition-transform" />
                Perfect Realign
            </button>
        </Panel>

        <Controls 
            className="tactical-glass bg-white/80! border-gray-200! rounded-xl! overflow-hidden!" 
            showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}

export default function DecisionCanvas(props: DecisionCanvasProps) {
  return (
    <ReactFlowProvider>
      <DecisionCanvasContent 
        propNodes={props.nodes} 
        propLinks={props.links} 
        onNodeSelect={props.onNodeSelect} 
        lens={props.lens} 
      />
    </ReactFlowProvider>
  );
}
