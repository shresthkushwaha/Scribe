'use client';

import React, { useEffect } from 'react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import { getWorkspace } from '@/lib/services/scribeV2Db';
import MacroCanvas from '@/components/v2/MacroCanvas';
import MicroWorkbench from '@/components/v2/MicroWorkbench';
import CartridgeDock from '@/components/v2/CartridgeDock';
import { useStore as useScribeStore } from '@/lib/store'; // Legacy V1 notes store access
import { cachePrompt } from '@/lib/services/promptCache';

export default function ScribeV2Page() {
  const { 
    activeWorkspaceId, 
    activeMicroBlockId, 
    setWorkspace 
  } = useScribeV2Store();

  useEffect(() => {
    // Load default workspace on mount
    async function init() {
      const ws = await getWorkspace('default-workspace');
      if (ws) {
        setWorkspace(ws);
      }
    }
    init();

    // Seed SCAMPER prompt cache
    const SCAMPER_PROMPT = `---  
name: scamper-divergence  
description: "Generate seven distinct structural and logical mutations of a concept using the SCAMPER framework. Use to break cognitive fixation and expand the graph space within the Scribe Oracle Lens."  
risk: low  
source: oracle-studio  
date_added: "2026-02-28"  
---

# SCAMPER Divergence (Structural Mutation)

You are a **Divergent Thinking Architect**, not a synonym generator.

Your goal is to perform a **logical stress test** on a concept that:  
* Forces a fundamental shift in the original node's "DNA"  
* Avoids safe, incremental improvements  
* Operates within the Scribe "Box" spatial container  
* Translates abstract ideas into concrete, actionable system nodes

This skill prioritizes **structural transformation** over simple brainstorming.

---

## 1. Core Divergence Mandate

Every SCAMPER output must satisfy **all four**:

1. **Fundamental Mutation**  
   Each letter (S.C.A.M.P.E.R.) must propose a version of the idea that could exist as a standalone alternative to the original.

2. **Logical Rigor**  
   The mutation must be a plausible system change, not a creative "hallucination." It must be grounded in the user's current project context.

3. **Spatial Awareness**  
   Every generated node must include relative X/Y coordinates to fit within a designated 500x500 "Explosion Box."

4. **Essential Tech Alignment**  
   Mutations should prefer "Calm Tech" principles: local-first, privacy-preserving, and finite interfaces.

---

## 5. Required Output Structure

When generating the SCAMPER Box:

### 1. Divergence Summary  
* Master Node Name  
* DQI Score  
* Mutation Tone chosen

### 2. The SCAMPER Box (JSON)  
Return a JSON object with:
{
  "summary": { "masterNode": string, "dqiScore": number, "mutationTone": string },
  "satellites": [
    { "letter": "S"|"C"|"A"|"M"|"P"|"E"|"R", "title": string, "logic": string, "coords": { "x": number, "y": number } }
  ],
  "jolt": string
}
`;
    cachePrompt('scamper-divergence', SCAMPER_PROMPT);
  }, [setWorkspace]);

  return (
    <div className="relative w-screen h-screen bg-[#0a0a0a] text-[#d4d4d4] overflow-hidden font-mono select-none">
      {/* Background Grid - Industrial Aesthetic */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Main View Switcher */}
      {activeMicroBlockId ? (
        <MicroWorkbench blockId={activeMicroBlockId} />
      ) : (
        <>
          <MacroCanvas />
          <CartridgeDock />
        </>
      )}

      {/* Global Interface Details */}
      <div className="absolute top-6 left-8 z-50 flex items-center gap-4">
        <div className="w-2 h-6 bg-[#ff4d00]" />
        <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-white">
          Scribe <span className="text-[#ff4d00]">V2</span>
        </h1>
        <div className="px-3 py-1 border border-white/10 rounded-sm text-[10px] bg-white/5 uppercase tracking-widest opacity-60">
          Spatial Reasoning Engine
        </div>
      </div>
      
      {/* Bottom Right Workspace Info */}
      <div className="absolute bottom-6 right-8 z-50 text-[10px] uppercase tracking-widest opacity-40">
        System Status: {activeMicroBlockId ? 'Focused' : 'Pipeline Ready'} // Local Synthesis Enabled
      </div>
    </div>
  );
}
