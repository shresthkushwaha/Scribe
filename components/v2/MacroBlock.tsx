'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useScribeV2Store, V2Block } from '@/lib/store/scribeV2Store';
import { Database, Scan, Pulse } from '@phosphor-icons/react';

export default function MacroBlock({ block }: { block: V2Block }) {
  const { updateBlock, enterMicroView } = useScribeV2Store();
  const [isDragging, setIsDragging] = useState(false);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    enterMicroView(block.id);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        updateBlock(block.id, { 
          x: block.x + info.offset.x, 
          y: block.y + info.offset.y 
        });
      }}
      onDoubleClick={handleDoubleClick}
      animate={block.isVibrating ? {
        x: [0, -1, 1, -1, 1, 0],
        y: [0, 1, -1, 1, -1, 0],
        transition: { repeat: Infinity, duration: 0.1 }
      } : {}}
      className={`absolute w-64 p-4 bg-[#1a1a1a] border-2 rounded-lg shadow-2xl cursor-grab active:cursor-grabbing group
        ${block.isDesynced ? 'border-[#ff4d00] shadow-[#ff4d00]/20' : 'border-white/10 shadow-black/50'}
        ${block.isHollow ? 'border-dashed opacity-40 grayscale pointer-events-none' : ''}
        hover:border-white/30 transition-all
      `}
      style={{ left: block.x, top: block.y, zIndex: isDragging ? 100 : 10 }}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          {block.type === 'dataset' ? (
            <Database size={14} className="text-[#00e5ff]" />
          ) : (
            <Scan size={14} className="text-[#ff4d00]" />
          )}
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
            {block.type}
          </span>
        </div>
        {block.isDesynced && (
          <div className="flex items-center gap-1">
            <Pulse size={10} weight="fill" className="text-[#ff4d00] animate-pulse" />
            <span className="text-[8px] text-[#ff4d00] uppercase font-bold">Desync</span>
          </div>
        )}
      </div>

      {/* Block Name */}
      <h3 className="text-sm font-bold text-white mb-2 truncate group-hover:text-[#ff4d00] transition-colors">
        {block.name}
      </h3>

      {/* Block Metadata Stubs */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] opacity-40">
          <span>Processing ID</span>
          <span>{block.id.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between text-[9px] opacity-40">
          <span>Status</span>
          <span className={block.data ? 'text-green-500' : ''}>
            {block.data ? 'Synthesized' : 'Idle'}
          </span>
        </div>
      </div>

      {/* "Eyepiece" Indicator (Hint for ZUI) */}
      <div className="mt-4 pt-2 border-t border-white/5 flex justify-center">
        <div className="w-8 h-1 bg-white/10 rounded-full group-hover:bg-[#ff4d00]/40 transition-colors" />
      </div>
    </motion.div>
  );
}
