'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightning, X } from '@phosphor-icons/react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onScamper: () => void;
  nodeLabel: string;
}

export default function ContextMenu({ x, y, onClose, onScamper, nodeLabel }: ContextMenuProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        style={{ left: x, top: y }}
        className="fixed z-[300] min-w-[200px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1 backdrop-blur-xl"
      >
        <div className="px-3 py-2 border-b border-white/5 mb-1">
          <div className="text-[10px] uppercase tracking-widest font-black text-[#ff4d00]">Node Operations</div>
          <div className="text-xs font-bold text-white truncate max-w-[180px]">{nodeLabel}</div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onScamper();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#ff4d00] hover:text-black rounded-lg transition-all group text-white/70"
        >
          <div className="p-1 bg-[#ff4d00]/10 rounded group-hover:bg-black/20">
            <Lightning size={16} weight="fill" className="text-[#ff4d00] group-hover:text-black" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-black uppercase tracking-tighter">Trigger SCAMPER</span>
            <span className="text-[8px] opacity-60 uppercase tracking-widest font-bold">Spatial Explosion</span>
          </div>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-all text-white/40 hover:text-white mt-1"
        >
          <X size={14} />
          <span className="text-[10px] uppercase font-bold tracking-widest">Cancel</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
