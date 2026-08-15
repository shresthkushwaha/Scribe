import React from 'react';
import { BaseEdge, getBezierPath, EdgeProps } from '@xyflow/react';

/**
 * Tactical Edge — High-fidelity connection line with custom styling support.
 */
export function TacticalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isSynthesis = data?.type === 'SYNTHESIS';
  const isGap = data?.type === 'GAP_LINK';
  const isStrat = data?.type === 'STRAT_LINK';
  const isStratSubtle = data?.type === 'STRAT_LINK_SUBTLE';

  // Golden Path: High resonance connections
  const isGolden = ((data as any)?.value as number || 0) > 0.8;

  const finalStyle: React.CSSProperties = {
    ...style,
    strokeWidth: (isGolden ? 3 : isSynthesis ? 2.5 : isGap ? 1.5 : (isStrat || isStratSubtle ? 1.2 : 0.8)) as any,
    stroke: (data?.color || (isGolden ? '#facc15' : isSynthesis ? '#facc15' : isGap ? '#f87171' : (isStratSubtle ? '#64748b' : 'rgba(0,0,0,0.12)'))) as any,
    strokeDasharray: isGap ? '4 4' : undefined,
    opacity: isGolden ? 1.0 : isStratSubtle ? 0.2 : isStrat ? 0.6 : 0.3,
    transition: 'all 0.3s',
    filter: isGolden ? 'drop-shadow(0 0 5px #facc1566)' : 'none'
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={finalStyle} 
        interactionWidth={20}
      />
    </>
  );
}
