// lib/graphEngine.ts
// Shared graph processing engine — used by both single-note and multi-note graph pages.

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type NodeType = 'SENTENCE' | 'ENTITY' | 'TRAIT' | 'ANCHOR';

export type Node = {
    id: string;
    type: NodeType;
    label: string;
    text?: string;
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
    value?: number;
    embedding?: number[];
    date?: string;
    insightIndex?: number; // Archipelago: which island (-1 = shared bridge)
    resonanceScore?: number;
    globalDegree?: number; // Added for grading logic
    baseValue?: number;
    multiplier?: number;
    lastCalculated?: number;
};

export type Link = {
    source: string | Node;
    target: string | Node;
    value: number;
    type: 'CONTAINS' | 'DESCRIBES';
};

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const LENS_CONFIGS: Record<string, any> = {
    analyst: { label: '🔍 The Analyst', friction: 0.85, charge: -30, gravity: 0.01, collision: 1, linkDist: 100 },
    weaver: { label: '🔮 The Weaver', friction: 0.85, charge: -30, gravity: 0, collision: 1, linkDist: 100 },
};

export const INSIGHT_COLORS = [
    { fill: 'rgba(100,160,255,0.15)', stroke: 'rgba(100,160,255,0.7)', dot: 'rgb(100,160,255)' },  // blue
    { fill: 'rgba(255,180,80,0.15)', stroke: 'rgba(255,180,80,0.7)', dot: 'rgb(255,180,80)' },   // amber
    { fill: 'rgba(80,220,150,0.15)', stroke: 'rgba(80,220,150,0.7)', dot: 'rgb(80,220,150)' },   // green
    { fill: 'rgba(220,120,255,0.15)', stroke: 'rgba(220,120,255,0.7)', dot: 'rgb(220,120,255)' },  // purple
];

// -----------------------------------------------------------------------------
// Stop words / helpers
// -----------------------------------------------------------------------------

const STOP_WORDS = new Set([
    'the', 'and', 'to', 'of', 'a', 'in', 'was', 'it', 'she', 'her', 'had', 'with', 'for', 'on',
    'that', 'but', 'as', 'at', 'is', 'from', 'by', 'not', 'be', 'this', 'so', 'out', 'up', 'one',
    'very', 'no', 'there', 'all', 'little', 'poor', 'old', 'he', 'him', 'his', 'they', 'them',
    'i', 'my', 'me', 'we', 'our', 'us', 'you', 'your',
]);

const IS_ADJ = (w: string) =>
    /ful$|ous$|ent$|ive$|ing$|ed$|ary$|al$|ic$|ish$|ble$|nt$/.test(w) ||
    ['good', 'bad', 'red', 'blue', 'cold', 'warm', 'hot', 'dark', 'bright', 'large', 'small',
        'rich', 'happy', 'sad', 'mild', 'tall', 'radiant', 'beautiful', 'delicious', 'magnificent',
        'stiff', 'stark', 'frozen', 'rosy', 'smiling', 'anxious', 'calm', 'tired', 'energetic',
    ].includes(w);

const PROJECTS = ['oatsen', 'deck', 'sanctuary', 'scribe', 'focus', 'aura'];
const INTENSE_WORDS = ['love', 'hate', 'great', 'amazing', 'terrible', 'awful', 'perfect', 'critical', 'urgent', 'huge', 'best', 'worst'];

// -----------------------------------------------------------------------------
// Resonance scoring
// -----------------------------------------------------------------------------

export function calculateResonanceScore(node: Node, connections: number) {
    if (node.type !== 'SENTENCE') return { score: 50, base: 50, mult: 1 };
    const text = node.text || '';
    let base = Math.min(10, text.length / 20);
    if (text.includes('```')) base += 5;
    let mult = 1.0;
    const lower = text.toLowerCase();
    if (PROJECTS.some(p => lower.includes(p))) mult = 1.5;
    if (lower.includes('#urgent') || lower.includes('#idea') || lower.includes('!')) mult = 1.2;
    const connectivity = connections * 5;
    const sentiment = INTENSE_WORDS.some(w => lower.includes(w)) ? 10 : 0;
    const total = base * mult + connectivity + sentiment;
    return { score: Math.max(0, Math.min(100, total)), base, mult };
}

// -----------------------------------------------------------------------------
// Per-insight concept extraction (used for Archipelago bridge detection)
// -----------------------------------------------------------------------------

export function extractConcepts(text: string): { entities: Set<string>; traits: Set<string> } {
    const entities = new Set<string>();
    const traits = new Set<string>();
    const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) || [text];
    sentences.forEach(sent => {
        const clean = sent.trim().replace(/[*_#-]/g, '');
        clean.split(/[^a-zA-Z0-9À-ÿ]+/).forEach(w => {
            const lower = w.toLowerCase();
            if (lower.length < 3 || STOP_WORDS.has(lower)) return;
            if (/^[A-Z]/.test(w) || ['morning', 'night', 'work', 'home', 'gym', 'feeling'].includes(lower)) {
                entities.add(lower.charAt(0).toUpperCase() + lower.slice(1));
            } else if (IS_ADJ(lower)) {
                traits.add(lower);
            }
        });
    });
    return { entities, traits };
}

// -----------------------------------------------------------------------------
// Full graph builder — takes { dateKey: { journal: string } } map
// -----------------------------------------------------------------------------

export function processJournalData(allData: Record<string, any>): { nodes: Node[]; links: Link[] } {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const entityMap = new Map<string, string>();
    const traitMap = new Map<string, string>();

    let globalSentenceIndex = 0;

    Object.keys(allData).sort().forEach(date => {
        const entry = allData[date];
        if (!entry?.journal) return;

        const blocks = entry.journal
            .split(/\n\s*\n|(?=###)|(?=---)/)
            .map((b: string) => b.trim())
            .filter((b: string) => b.length > 0);

        blocks.forEach((block: string) => {
            const cleanBlock = block.replace(/^###\s*|^---\s*/, '').trim();
            const rawSentences = cleanBlock.match(/[^.!?]+(?:[.!?]+|$)/g) || [cleanBlock];

            rawSentences.forEach((sent: string) => {
                const cleanSent = sent.trim().replace(/[*_#-]/g, '');
                if (cleanSent.length < 3) return;

                const sentId = `sent-${date}-${globalSentenceIndex}`;
                nodes.push({
                    id: sentId, type: 'SENTENCE', label: '', text: cleanSent,
                    x: Math.random() * 800, y: Math.random() * 600, r: 6,
                    index: globalSentenceIndex, date
                });

                cleanSent.split(/[^a-zA-Z0-9À-ÿ]+/).forEach(w => {
                    const clean = w.toLowerCase();
                    if (clean.length < 3 || STOP_WORDS.has(clean)) return;

                    const isEntity = /^[A-Z]/.test(w) || ['morning', 'night', 'work', 'home', 'gym', 'feeling'].includes(clean);
                    if (isEntity) {
                        const label = clean.charAt(0).toUpperCase() + clean.slice(1);
                        const entId = `ent-${label}`;
                        if (!entityMap.has(label)) {
                            entityMap.set(label, entId);
                            nodes.push({
                                id: entId, type: 'ENTITY', label,
                                x: Math.random() * 800, y: Math.random() * 600,
                                r: 30, width: label.length * 10 + 30, height: 36, value: 1
                            });
                        } else {
                            const existing = nodes.find(n => n.id === entityMap.get(label));
                            if (existing && existing.value !== undefined) {
                                existing.value++;
                                existing.r = 30 + existing.value * 2;
                                existing.width = label.length * 10 + 30 + existing.value * 5;
                            }
                        }
                        links.push({ source: sentId, target: entityMap.get(label)!, value: 1, type: 'CONTAINS' });
                    } else if (IS_ADJ(clean)) {
                        const traitId = `trait-${clean}`;
                        if (!traitMap.has(clean)) {
                            traitMap.set(clean, traitId);
                            nodes.push({
                                id: traitId, type: 'TRAIT', label: clean,
                                x: Math.random() * 800, y: Math.random() * 600,
                                r: 15, width: clean.length * 8 + 16, height: 24, value: 1
                            });
                        } else {
                            const existing = nodes.find(n => n.id === traitMap.get(clean));
                            if (existing?.value !== undefined) existing.value++;
                        }
                        links.push({ source: sentId, target: traitId, value: 0.5, type: 'DESCRIBES' });
                    }
                });

                globalSentenceIndex++;
            });
        });
    });

    // Resonance scoring pass
    nodes.forEach(node => {
        const conns = links.filter(l =>
            (typeof l.source === 'string' ? l.source : (l.source as Node).id) === node.id ||
            (typeof l.target === 'string' ? l.target : (l.target as Node).id) === node.id
        ).length;
        const res = calculateResonanceScore(node, conns);
        node.resonanceScore = res.score;
        node.baseValue = res.base;
        node.multiplier = res.mult;
        node.lastCalculated = Date.now();
        if (node.type === 'SENTENCE') {
            node.r = node.resonanceScore < 20 ? 2 : node.resonanceScore > 60 ? 12 : 6;
        }
    });

    return { nodes, links };
}

// -----------------------------------------------------------------------------
// Archipelago layout helpers
// -----------------------------------------------------------------------------

export function getClusterPositions(n: number, baseRadius = 360) {
    const radius = n <= 2 ? baseRadius : baseRadius * (1 + (n - 2) * 0.45);
    if (n === 2) return [{ x: -radius, y: 0 }, { x: radius, y: 0 }];
    return Array.from({ length: n }, (_, i) => ({
        x: radius * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
        y: radius * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
    }));
}

/**
 * Build the Archipelago graph from multiple note bodies.
 * @param notes  Array of { id, title, body } — matched by index to island
 */
export function buildArchipelagoGraph(notes: { id: string; title: string; body: string }[]): {
    nodes: Node[];
    links: Link[];
} {
    const today = new Date().toISOString().split('T')[0];
    const mockData: Record<string, any> = {};
    const dateKeys: string[] = [];

    notes.forEach(({ body }, i) => {
        const key = i === 0 ? today : `${today}--${i}`;
        dateKeys[i] = key;
        mockData[key] = { journal: body, todos: [] };
    });

    const perInsight = notes.map(n => extractConcepts(n.body));

    // Strict threshold: all N must share the concept
    const threshold = notes.length;
    const sharedEntities = new Set<string>();
    const sharedTraits = new Set<string>();
    perInsight.forEach(insight => {
        insight.entities.forEach(e => {
            if (perInsight.filter(o => o.entities.has(e)).length >= threshold) sharedEntities.add(e);
        });
        insight.traits.forEach(t => {
            if (perInsight.filter(o => o.traits.has(t)).length >= threshold) sharedTraits.add(t);
        });
    });

    const graph = processJournalData(mockData);

    const keepIds = new Set<string>();
    graph.nodes.forEach(n => {
        if (n.type === 'SENTENCE') { keepIds.add(n.id); return; }
        if (n.type === 'ENTITY' && sharedEntities.has(n.label)) keepIds.add(n.id);
        if (n.type === 'TRAIT' && sharedTraits.has(n.label)) keepIds.add(n.id);
    });

    const dateToIndex: Record<string, number> = {};
    dateKeys.forEach((key, i) => { dateToIndex[key] = i; });

    const clusterPositions = getClusterPositions(notes.length);

    const filteredNodes: Node[] = graph.nodes
        .filter(n => keepIds.has(n.id))
        .map(n => {
            if (n.type === 'SENTENCE' && n.date && dateToIndex[n.date] !== undefined) {
                const idx = dateToIndex[n.date];
                const cp = clusterPositions[idx];
                return { ...n, insightIndex: idx, x: cp.x + (Math.random() - 0.5) * 120, y: cp.y + (Math.random() - 0.5) * 120 };
            }
            return { ...n, insightIndex: -1, x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 };
        });

    // ANCHOR nodes — use note title as label
    const anchorNodes: Node[] = notes.map(({ title }, i) => {
        const cp = clusterPositions[i];
        const label = title || `Note ${i + 1}`;
        return {
            id: `anchor-${i}`, type: 'ANCHOR' as NodeType, label,
            x: cp.x, y: cp.y, r: 20,
            width: label.length * 9 + 32, height: 36,
            insightIndex: i, fx: cp.x, fy: cp.y,
        };
    });

    const filteredLinks = graph.links.filter(l => {
        const s = typeof l.source === 'string' ? l.source : (l.source as Node).id;
        const t = typeof l.target === 'string' ? l.target : (l.target as Node).id;
        return keepIds.has(s) && keepIds.has(t);
    });

    filteredNodes.forEach(node => {
        if (node.type === 'ENTITY' || node.type === 'TRAIT') {
            node.globalDegree = filteredLinks.filter(l => {
                const s = typeof l.source === 'string' ? l.source : (l.source as Node).id;
                const t = typeof l.target === 'string' ? l.target : (l.target as Node).id;
                return s === node.id || t === node.id;
            }).length;
        }
    });

    return { nodes: [...filteredNodes, ...anchorNodes], links: filteredLinks.map(l => ({ ...l })) };
}
