'use client';

import React from 'react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';

export default function GhostNodes({ parentBlockId }: { parentBlockId: string }) {
  const { blocks, connections } = useScribeV2Store();
  
  // Find nodes that are directly connected upstream
  const sourceBlockIds = connections
    .filter(c => c.targetId === parentBlockId)
    .map(c => c.sourceId);
    
  const sourceBlocks = blocks.filter(b => sourceBlockIds.includes(b.id));

  return (
    <div className="absolute inset-0 pointer-events-none opacity-20 filter grayscale">
      {/* 
        This is a visual placeholder for the 'Context Mask' 
        In a full implementation, this could render the hubs of the source blocks 
        to show where the current synthesis is physically 'coming from'.
      */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-[14vw] font-black uppercase tracking-[0.2em] opacity-5 select-none">
          Context
        </div>
      </div>

      {sourceBlocks.map((sb, i) => (
        <div 
          key={sb.id}
          className="absolute flex flex-col items-center gap-2 p-4 border border-white/20 rounded-xl"
          style={{ 
            left: `${30 + i * 20}%`, 
            top: '20%',
            transform: 'translate(-50%, -50%) rotate(-5deg)' 
          }}
        >
          <div className="w-12 h-1 bg-white/40 mb-2" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{sb.name}</span>
          <div className="text-[8px] opacity-40">Parent Source</div>
        </div>
      ))}
    </div>
  );
}
