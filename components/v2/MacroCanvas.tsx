'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import MacroBlock from './MacroBlock';
import SvgCables from './SvgCables';
import GoldenPath from './GoldenPath';
import ScribeStrategist from '@/components/v2/ScribeStrategist';

export default function MacroCanvas() {
  const { blocks, updateBlock, activeStrategistSkillId, strategistMessages } = useScribeV2Store();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Derive points for Golden Path from strategist execution data
  const goldenPathPoints = strategistMessages
    .filter(m => m.role === 'assistant' && m.executionData?.trajectory)
    .flatMap(m => m.executionData.trajectory)
    .map(step => {
        const found = blocks.find(b => b.id === step.id);
        return found ? { x: found.x, y: found.y } : null;
    })
    .filter(Boolean) as { x: number, y: number }[];


  // Pan logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Click
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Zoom logic
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.2, Math.min(2, prev * zoomDelta)));
    } else {
      setOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden outline-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      tabIndex={0}
    >
      <div 
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
        className="relative w-full h-full"
      >
        {/* Connection Layer */}
        <SvgCables />

        {/* Golden Path Trajectory */}
        <GoldenPath points={goldenPathPoints} isVisible={goldenPathPoints.length > 0} />

        {/* Blocks Layer */}
        {blocks.map(block => (
          <MacroBlock key={block.id} block={block} />
        ))}
      </div>

    </div>
  );
}
