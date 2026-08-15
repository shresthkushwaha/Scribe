'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import { CaretLeft, Play, ArrowsClockwise, SquaresFour, CircleNotch, Lightning } from '@phosphor-icons/react';
import D3PhysicsEngine from './D3PhysicsEngine';
import GhostNodes from './GhostNodes';
import { synthesizeLens } from '@/lib/services/scribeV2Brain';
import { generateMutationBox, placeMutationBox } from '@/lib/services/mutationEngine';

export default function MicroWorkbench({ blockId }: { blockId: string }) {
  const { blocks, connections, exitMicroView, updateBlock } = useScribeV2Store();
  const block = blocks.find(b => b.id === blockId);
  const [showGhostNodes, setShowGhostNodes] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [activeTechnique, setActiveTechnique] = useState('scamper-divergence');

  if (!block) return null;

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    
    // Find input blocks
    const inputIds = connections
      .filter(c => c.targetId === blockId)
      .map(c => c.sourceId);
    const inputBlocks = blocks.filter(b => inputIds.includes(b.id));

    const result = await synthesizeLens(block, inputBlocks);
    
    if (result) {
      updateBlock(block.id, { 
        data: result,
        isDesynced: false 
      });
    }
    
    setIsSynthesizing(false);
  };

  const handleMutation = async () => {
    if (!block) return;
    setIsMutating(true);

    const anchorNode = block.data.hubs[0] || block.data.nodes[0];
    if (!anchorNode) return;

    const occupied = [...block.data.hubs, ...block.data.nodes].map(n => ({
      x: n.x || 0,
      y: n.y || 0,
      r: n.type === 'hub' ? 60 : 20
    }));

    const result = await generateMutationBox(
      activeTechnique,
      { 
        id: anchorNode.id, 
        label: anchorNode.name, 
        text: anchorNode.summary || anchorNode.name, 
        x: anchorNode.x || 0, 
        y: anchorNode.y || 0 
      },
      occupied
    );

    if (result) {
      // Find void space
      const center = placeMutationBox(
        { x: anchorNode.x || 0, y: anchorNode.y || 0 },
        occupied,
        { width: 1200, height: 1000 }
      );

      const satellites = result.satellites.map(s => ({
        ...s,
        fx: center.x + s.coords.x,
        fy: center.y + s.coords.y
      }));

      useScribeV2Store.getState().addScamperNodes(block.id, anchorNode.id, satellites, result.jolt);
    }

    setIsMutating(false);
  };

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
      exit={{ scale: 1.2, opacity: 0, filter: 'blur(20px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col"
    >
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={exitMicroView}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
          >
            <CaretLeft size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors">
              <ArrowsClockwise size={18} />
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors">
              <SquaresFour size={18} />
            </button>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">
              {block.name}
            </h2>
            <div className="flex items-center gap-2 text-[10px] opacity-40 uppercase tracking-widest font-bold">
              <span>Workbench</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>Block ID: {block.id.slice(0,8)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowGhostNodes(!showGhostNodes)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-[10px] uppercase font-bold tracking-widest
              ${showGhostNodes ? 'bg-[#ff4d00]/10 border-[#ff4d00]/40 text-[#ff4d00]' : 'bg-white/5 border-white/10 text-white/40'}
            `}
          >
            <SquaresFour size={14} />
            Context Mask
          </button>

          <button 
            onClick={handleSynthesize}
            disabled={isSynthesizing || isMutating}
            className={`flex items-center gap-2 px-6 py-2 bg-[#ff4d00] text-black rounded-lg hover:bg-[#ff6a26] transition-colors font-black text-xs uppercase tracking-tighter
              ${(isSynthesizing || isMutating) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSynthesizing ? (
              <CircleNotch size={20} className="animate-spin text-black" />
            ) : (
              <Play size={14} weight="fill" />
            )}
            {isSynthesizing ? 'Processing' : 'Synthesize'}
          </button>

          <button 
            onClick={handleMutation}
            disabled={isMutating || isSynthesizing}
            className={`flex items-center gap-2 px-6 py-2 bg-black border border-white/20 text-white rounded-lg hover:border-[#ff4d00]/50 transition-all font-black text-xs uppercase tracking-tighter shadow-xl
              ${(isMutating || isSynthesizing) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isMutating ? (
              <CircleNotch size={20} className="animate-spin text-[#ff4d00]" />
            ) : (
              <Lightning size={14} weight="fill" className="text-[#ff4d00]" />
            )}
            {isMutating ? 'Exploding' : 'SCAMPER'}
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="relative flex-grow overflow-hidden">
        {/* Optical Zoom Vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10" />
        
        {/* Background Ghost Layer */}
        {showGhostNodes && <GhostNodes parentBlockId={block.id} />}

        {/* The Physics Engine */}
        <D3PhysicsEngine block={block} />

        {/* Compass / Legend Overlay */}
        <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-2 p-4 bg-black/60 backdrop-blur-md border border-white/5 rounded-xl">
          <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-bold">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="opacity-60">Supporting Evidence</span>
          </div>
          <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-bold">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span className="opacity-60">Contradictions</span>
          </div>
          <div className="mt-2 text-[8px] opacity-30 italic">
            * Contradictory nodes apply repulsive D3 forces
          </div>
        </div>
      </div>
    </motion.div>
  );
}
