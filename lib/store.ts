import { create } from 'zustand';
import { generateEmbedding } from './ai';

export type NodeType = 'SOURCE' | 'PARA' | 'SENTENCE' | 'WORD' | 'BRIDGE' | 'ENTITY' | 'TRAIT';

export interface ScribeNode {
  id: string;
  type: NodeType;
  label: string;
  text: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  r: number;
  width?: number;
  height?: number;
  index?: number;
  resonanceScore?: number;
  embedding?: number[];
  value?: number;
}

export interface ScribeLink {
  source: string | ScribeNode;
  target: string | ScribeNode;
  value: number;
  type?: 'CONTAINS' | 'DESCRIBES' | 'SEMANTIC';
}

export type View = 'HOME' | 'CANVAS';
export type Lens = 'WEAVER' | 'ANALYST' | 'EXPERIMENTAL';
export type Depth = 'MACRO' | 'MICRO' | 'NANO';

interface Store {
  // View Data
  nodes: ScribeNode[];
  links: ScribeLink[];

  // Master Data
  masterNodes: ScribeNode[];
  masterLinks: ScribeLink[];

  // State
  view: View;
  lens: Lens;
  depth: Depth;
  isProcessing: boolean;
  activeNodeId: string | null;
  centerNodeId: string | null;
  hoverNodeId: string | null;

  // Actions
  setView: (view: View) => void;
  setLens: (lens: Lens) => void;
  setDepth: (depth: Depth, centerId?: string) => void;
  processNotes: (notes: string[]) => Promise<void>;
  isolateNode: (id: string) => void;
  expandNode: (id: string) => void;
  setHoverNode: (id: string | null) => void;
  resetGraph: () => void;
}

const STOP_WORDS = new Set(['the', 'and', 'to', 'of', 'a', 'in', 'was', 'it', 'she', 'her', 'had', 'with', 'for', 'on', 'that', 'but', 'as', 'at', 'is', 'from', 'by', 'not', 'be', 'this', 'so', 'out', 'up', 'one', 'very', 'he', 'him', 'his', 'they', 'them', 'i', 'my', 'me', 'we', 'our', 'us', 'you', 'your']);

const IS_ADJ = (w: string) => /ful$|ous$|ent$|ive$|ing$|ed$|ary$|al$|ic$|ish$|ble$|nt$/.test(w.toLowerCase());

export const useStore = create<Store>((set, get) => ({
  nodes: [],
  links: [],
  masterNodes: [],
  masterLinks: [],
  view: 'HOME',
  lens: 'WEAVER',
  depth: 'MACRO',
  isProcessing: false,
  activeNodeId: null,
  centerNodeId: null,
  hoverNodeId: null,

  setView: (view) => set({ view }),
  setLens: (lens) => set({ lens }),
  setDepth: (depth, centerId) => set({ depth, centerNodeId: centerId || null }),
  setHoverNode: (id) => set({ hoverNodeId: id }),

  resetGraph: () => set({
    nodes: [],
    links: [],
    masterNodes: [],
    masterLinks: [],
    centerNodeId: null,
    activeNodeId: null
  }),

  isolateNode: (id) => {
    const { masterNodes, masterLinks } = get();
    const target = masterNodes.find(n => n.id === id);
    if (!target) return;

    // Anchor target to center
    target.fx = window.innerWidth / 2;
    target.fy = window.innerHeight / 2;

    const nearbyLinks = masterLinks.filter(l =>
      (typeof l.source === 'string' ? l.source === id : l.source.id === id) ||
      (typeof l.target === 'string' ? l.target === id : l.target.id === id)
    );

    const nearbyNodeIds = new Set([id]);
    nearbyLinks.forEach(l => {
      nearbyNodeIds.add(typeof l.source === 'string' ? l.source : l.source.id);
      nearbyNodeIds.add(typeof l.target === 'string' ? l.target : l.target.id);
    });

    const nearbyNodes = masterNodes.filter(n => nearbyNodeIds.has(n.id));

    set({
      nodes: nearbyNodes,
      links: nearbyLinks,
      centerNodeId: id,
      activeNodeId: id
    });
  },

  expandNode: (id) => {
    const { masterNodes, masterLinks, nodes, links } = get();
    const newLinks = masterLinks.filter(l =>
      (typeof l.source === 'string' ? l.source === id : l.source.id === id) ||
      (typeof l.target === 'string' ? l.target === id : l.target.id === id)
    );

    const existingNodeIds = new Set(nodes.map(n => n.id));
    const newNodeIds = new Set<string>();
    newLinks.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      if (!existingNodeIds.has(s)) newNodeIds.add(s);
      if (!existingNodeIds.has(t)) newNodeIds.add(t);
    });

    const newNodes = masterNodes.filter(n => newNodeIds.has(n.id));

    // Sprout from parent
    const parent = nodes.find(n => n.id === id);
    if (parent) {
      newNodes.forEach(n => {
        n.x = parent.x;
        n.y = parent.y;
      });
    }

    set({
      nodes: [...nodes, ...newNodes],
      links: [...links, ...newLinks],
      activeNodeId: id
    });
  },

  processNotes: async (notes) => {
    set({ isProcessing: true });

    const allNodes: ScribeNode[] = [];
    const allLinks: ScribeLink[] = [];
    const entityMap = new Map<string, string>();

    for (let i = 0; i < notes.length; i++) {
      const text = notes[i];
      const sourceId = `source-${i}`;

      allNodes.push({
        id: sourceId,
        type: 'SOURCE',
        label: `Note ${i + 1}`,
        text,
        x: Math.random() * 800,
        y: Math.random() * 600,
        r: 40,
        resonanceScore: 80
      });

      const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) || [text];

      for (let j = 0; j < sentences.length; j++) {
        const sentText = sentences[j].trim();
        if (sentText.length < 5) continue;

        const sentId = `sent-${i}-${j}`;
        allNodes.push({
          id: sentId,
          type: 'SENTENCE',
          label: '',
          text: sentText,
          x: Math.random() * 800,
          y: Math.random() * 600,
          r: 6,
          index: j,
          resonanceScore: 50
        });

        allLinks.push({ source: sourceId, target: sentId, value: 1, type: 'CONTAINS' });

        // Entity extraction (Simulated)
        const words = sentText.split(/\s+/);
        words.forEach(w => {
          const clean = w.replace(/[^a-zA-Z]/g, '');
          if (clean.length > 3 && /^[A-Z]/.test(clean) && !STOP_WORDS.has(clean.toLowerCase())) {
            const label = clean;
            if (!entityMap.has(label)) {
              const entId = `ent-${label}`;
              entityMap.set(label, entId);
              allNodes.push({
                id: entId,
                type: 'ENTITY',
                label,
                text: '',
                x: Math.random() * 800,
                y: Math.random() * 600,
                r: 25,
                width: label.length * 8 + 20,
                resonanceScore: 60
              });
            }
            allLinks.push({ source: sentId, target: entityMap.get(label)!, value: 1, type: 'CONTAINS' });
          }
        });
      }
    }

    set({
      masterNodes: allNodes,
      masterLinks: allLinks,
      nodes: allNodes,
      links: allLinks,
      view: 'CANVAS',
      isProcessing: false
    });

    // Async Embedding Generation
    for (const node of allNodes) {
      if (node.text.length > 10) {
        generateEmbedding(node.text).then(emb => {
          if (emb) {
            node.embedding = emb;
            // Trigger resonance calculation or semantic links here
          }
        });
      }
    }
  }
}));
