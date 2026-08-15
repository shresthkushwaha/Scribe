import { create } from 'zustand';
import { V2Block, V2Connection, V2Workspace, saveWorkspace } from '../services/scribeV2Db';
export type { V2Block, V2Connection, V2Workspace };

interface ScribeV2State {
  activeWorkspaceId: string | null;
  blocks: V2Block[];
  connections: V2Connection[];
  oracleSessions: any[]; // GigaWorkbenchSession[]
  swampSessions: any[]; // SwampSession[]
  activeMicroBlockId: string | null; // null = Macro view, blockId = Micro view
  
  // Strategist State
  strategistMessages: any[]; // { role: 'user' | 'assistant', text: string, skillId?: string, executionData?: any }[]
  activeStrategistSkillId: string | null;
  isStrategistExecuting: boolean;
  
  // Actions
  setWorkspace: (workspace: V2Workspace) => void;
  addBlock: (block: V2Block) => void;
  updateBlock: (id: string, updates: Partial<V2Block>) => void;
  removeBlock: (id: string) => void;
  addConnection: (conn: V2Connection) => void;
  removeConnection: (id: string) => void;
  enterMicroView: (blockId: string) => void;
  exitMicroView: () => void;
  exportWorkspace: () => void;
  addScamperNodes: (blockId: string, anchorId: string, satellites: any[], jolt: string) => void;
  
  // Logic
  triggerDesync: (sourceId: string) => void;
  
  // Oracle Sessions
  addOracleSession: (session: any) => void;
  updateOracleSession: (id: string, updates: any) => void;
  removeOracleSession: (id: string) => void;

  // Swamp Sessions
  addSwampSession: (session: any) => void;
  removeSwampSession: (id: string) => void;

  // Strategist Actions
  addStrategistMessage: (message: any) => void;
  setStrategistExecution: (executing: boolean, skillId?: string | null) => void;
  clearStrategistHistory: () => void;
  executeCanvasMutation: (mutation: any) => void;
}

export const useScribeV2Store = create<ScribeV2State>((set, get) => ({
  activeWorkspaceId: 'default-workspace', // For now
  blocks: [],
  connections: [],
  oracleSessions: [],
  swampSessions: [],
  activeMicroBlockId: null,
  strategistMessages: [],
  activeStrategistSkillId: null,
  isStrategistExecuting: false,

  setWorkspace: (workspace) => set({
    activeWorkspaceId: workspace.id,
    blocks: workspace.blocks,
    connections: workspace.connections,
    oracleSessions: workspace.oracleSessions || [],
    swampSessions: workspace.swampSessions || [],
    strategistMessages: (workspace as any).strategistMessages || []
  }),

  addBlock: (block) => {
    set((state) => ({ blocks: [...state.blocks, block] }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  updateBlock: (id, updates) => {
    set((state) => ({
      blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  removeBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter(b => b.id !== id),
      connections: state.connections.filter(c => c.sourceId !== id && c.targetId !== id)
    }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  addConnection: (conn) => {
    set((state) => ({ connections: [...state.connections, conn] }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  removeConnection: (id) => {
    set((state) => ({ connections: state.connections.filter(c => c.id !== id) }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  enterMicroView: (blockId) => set({ activeMicroBlockId: blockId }),
  
  exitMicroView: () => set({ activeMicroBlockId: null }),

  setActiveMicroBlock: (blockId: string | null) => {
    set({ activeMicroBlockId: blockId });
  },

  exportWorkspace: () => {
    const { blocks, connections } = get();
    const workspace = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      blocks,
      connections
    };
    
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `${date}_scribe-v2-workspace.scribe`;
    a.click();
    URL.revokeObjectURL(url);
  },

  triggerDesync: (sourceId) => {
    const state = get();
    const affectedTargets = state.connections
      .filter(c => c.sourceId === sourceId)
      .map(c => c.targetId);

    set((state) => ({
      blocks: state.blocks.map(b => 
        affectedTargets.includes(b.id) ? { ...b, isDesynced: true } : b
      )
    }));
  },

  addScamperNodes: (blockId, anchorId, satellites, jolt) => {
    set((state) => {
      const block = state.blocks.find(b => b.id === blockId);
      if (!block || !block.data) return state;

      const newNodes = satellites.map((s, i) => ({
        id: `scamper-${Date.now()}-${s.letter}`,
        name: s.title,
        type: 'node',
        fx: s.fx, // These are fixed positions calculated by the engine
        fy: s.fy,
        scamperType: s.letter,
        logic: s.logic,
        isScamper: true
      }));

      const newLinks = newNodes.map(n => ({
        source: anchorId,
        target: n.id,
        type: 'supports',
        isScamper: true
      }));

      const updatedBlocks = state.blocks.map(b => {
        if (b.id === blockId) {
          return {
            ...b,
            data: {
              ...b.data,
              nodes: [...b.data.nodes, ...newNodes],
              edges: [...b.data.edges, ...newLinks],
              jolt: jolt // Store the last jolt info
            }
          };
        }
        return b;
      });

      return { blocks: updatedBlocks };
    });

    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  addOracleSession: (session) => {
    set((state) => ({ oracleSessions: [...state.oracleSessions, session] }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  updateOracleSession: (id, updates) => {
    set((state) => ({
      oracleSessions: state.oracleSessions.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  removeOracleSession: (id) => {
    set((state) => ({
      oracleSessions: state.oracleSessions.filter(s => s.id !== id)
    }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  addSwampSession: (session) => {
    set((state) => ({ swampSessions: [...state.swampSessions, session] }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  removeSwampSession: (id) => {
    set((state) => ({
      swampSessions: state.swampSessions.filter(s => s.id !== id)
    }));
    const state = get();
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now()
    });
  },

  addStrategistMessage: (message) => {
    set((state) => ({ strategistMessages: [...state.strategistMessages, message] }));
    const state = get();
    // Persist strategist messages within workspace state (extending SaveWorkspace if needed)
    saveWorkspace({
      id: state.activeWorkspaceId!,
      name: 'Default',
      blocks: state.blocks,
      connections: state.connections,
      oracleSessions: state.oracleSessions,
      swampSessions: state.swampSessions,
      updatedAt: Date.now(),
      // Adding strategistMessages to persistence
      ...({ strategistMessages: state.strategistMessages } as any)
    });
  },

  setStrategistExecution: (executing, skillId) => {
    set({ isStrategistExecuting: executing, activeStrategistSkillId: skillId || null });
  },

  clearStrategistHistory: () => {
    set({ strategistMessages: [] });
  },

  executeCanvasMutation: (mutation) => {
    //mutation: { type: 'add_nodes', nodes: [], links: [] }
    if (mutation.type === 'add_nodes') {
      set((state) => ({
        blocks: [...state.blocks, ...mutation.nodes],
        connections: [...state.connections, ...mutation.links]
      }));
    }
    // More mutation types can be added here
  }
}));
