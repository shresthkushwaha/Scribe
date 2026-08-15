'use client';

import React, { useState, useEffect } from 'react';
import { Ghost, X, CircleNotch, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import { useNotesStore } from '@/lib/notesStore';
import { generateSwampSession, SwampSession } from '@/lib/services/swampBrain';
import { BAUHAUS_COUNCIL, RED_TEAM, MARKET_MOVERS, DEEP_THINKERS } from '@/lib/constants/swampPersonas';
import SwampSelector from './SwampSelector';
import SwampMap from './SwampMap';

interface Props {
  noteId: string;
  onClose: () => void;
}

export default function SwampWorkbench({ noteId, onClose }: Props) {
  const { notes } = useNotesStore();
  const { swampSessions, addSwampSession } = useScribeV2Store();
  const [activeSession, setActiveSession] = useState<SwampSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing session for this note if any
  useEffect(() => {
    const existing = swampSessions.find(s => s.noteId === noteId);
    if (existing) {
      setActiveSession(existing);
    }
  }, [noteId, swampSessions]);

  const handleStartSimulation = async (selectedNoteId: string, packageId: string) => {
    setLoading(true);
    
    const targetNote = notes.find((n: any) => n.id === selectedNoteId);
    if (!targetNote) return;

    let selectedPersonas = RED_TEAM;
    if (packageId === 'bauhaus') selectedPersonas = BAUHAUS_COUNCIL;
    if (packageId === 'market-movers') selectedPersonas = MARKET_MOVERS;
    if (packageId === 'deep-thinkers') selectedPersonas = DEEP_THINKERS;

    try {
      const session = await generateSwampSession(
        selectedNoteId,
        targetNote.body,
        packageId,
        selectedPersonas
      );

      if (session) {
        addSwampSession(session);
        setActiveSession(session);
      }
    } catch (error) {
      console.error("❌ [Swamp] Simulation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-500 overflow-hidden bg-[#e4ebe6]">
      {/* Top Bar - Consistent with OracleGigaMap style */}
      <div className="absolute top-6 right-8 flex items-center gap-4 z-50 font-sans text-xs">
        {activeSession && (
          <button 
            onClick={() => setActiveSession(null)} 
            className="text-[#666] hover:text-black px-3 py-1.5 border border-[#ccc] rounded uppercase tracking-wider transition-colors"
          >
            New Stress-Test
          </button>
        )}
        <button onClick={onClose} className="text-[#999] hover:text-black uppercase tracking-widest flex items-center gap-2">
           <X size={16} weight="bold" />
           Press ESC to return
        </button>
      </div>

      <div className="absolute top-6 left-8 z-50 flex items-center gap-3">
         <div className="bg-indigo-600 text-white p-2 rounded-lg">
           <Ghost size={20} weight="fill" />
         </div>
         <div className="flex flex-col">
           <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-950">Swamp Mode</h2>
           <span className="text-[10px] text-indigo-600/60 font-mono uppercase font-bold tracking-widest">Stress-Test Protocol</span>
         </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col justify-center items-center z-50 bg-[#e4ebe6]/80 backdrop-blur-sm">
          <CircleNotch size={40} weight="thin" className="animate-spin text-indigo-600" />
          <span className="text-indigo-950 uppercase font-sans tracking-[0.3em] text-xs mt-6 font-bold">Simulating 30 Expert Critiques</span>
          <p className="text-indigo-600/60 text-[10px] uppercase tracking-widest mt-2 animate-pulse">Initializing Neural Swarm...</p>
        </div>
      )}

      <div className="w-full h-full pt-20">
        {!activeSession ? (
          <div className="h-full overflow-y-auto no-scrollbar pb-20">
             <SwampSelector 
                notes={notes.filter(n => n.body && n.body.length > 50).map(n => ({ id: n.id, name: n.title }))} 
                onStart={handleStartSimulation} 
                loading={loading}
                preSelectedNoteId={noteId}
              />
          </div>
        ) : (
          <SwampMap 
            session={activeSession} 
            onClose={onClose} 
          />
        )}
      </div>
    </div>
  );
}
