'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import { Database, Scan, Plus, DownloadSimple, Lightning, Ghost, Robot } from '@phosphor-icons/react';
import { v4 as uuidv4 } from 'uuid';
import { LENS_DICTIONARY } from '@/lib/v2/lenses.config';

export default function CartridgeDock() {
  const { addBlock, exportWorkspace } = useScribeV2Store();

  const cartridges = [
    { id: 'dataset-local', name: 'Local Store', type: 'dataset' as const, icon: <Database size={16} /> },
    { id: 'dataset-external', name: 'External Injector', type: 'dataset' as const, icon: <Database size={16} /> },
    ...Object.values(LENS_DICTIONARY).map(lens => ({
      id: `lens-${lens.id}`,
      name: lens.name,
      type: 'lens' as const,
      configId: lens.id,
      icon: 
        lens.id === 'oracle' ? <Lightning size={16} /> :
        lens.id === 'swamp' ? <Ghost size={16} /> :
        lens.id === 'strategist' ? <Robot size={16} /> :
        <Scan size={16} />
    }))
  ];

  const handleCreateBlock = (cartridge: any) => {
    addBlock({
      id: uuidv4(),
      type: cartridge.type,
      configId: cartridge.configId,
      name: cartridge.name,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      isDesynced: false
    });
  };

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-100">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="flex items-center gap-2 p-2 bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="flex px-4 py-2 border-r border-white/10 gap-4">
          <div className="flex flex-col justify-center">
            <span className="text-[8px] uppercase tracking-[0.2em] font-black opacity-40">System</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#ff4d00]">Dock</span>
          </div>
          <button 
            onClick={exportWorkspace}
            className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-[#ff4d00] transition-colors"
            title="Export Workspace (.scribe)"
          >
            <DownloadSimple size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto max-w-[70vw] px-2 no-scrollbar">
          {cartridges.map((cartridge, idx) => (
            <button
              key={idx}
              onClick={() => handleCreateBlock(cartridge)}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group shrink-0"
            >
              <div className={`p-1.5 rounded-lg ${cartridge.type === 'dataset' ? 'bg-[#00e5ff]/20 text-[#00e5ff]' : 'bg-[#ff4d00]/20 text-[#ff4d00]'}`}>
                {cartridge.icon}
              </div>
              <span className="text-xs font-bold whitespace-nowrap opacity-80 group-hover:opacity-100 uppercase tracking-tighter">
                {cartridge.name}
              </span>
              <Plus size={10} className="ml-2 opacity-0 group-hover:opacity-40 transition-opacity" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
