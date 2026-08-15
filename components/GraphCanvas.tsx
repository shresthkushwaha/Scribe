import Link from 'next/link';
import React, {
    useEffect, useRef, useState, useMemo, useCallback,
} from 'react';
import { 
    ArrowLeft, X, TreeStructure, MagicWand, Sparkle, CircleNotch, 
    ArrowsClockwise, Lightning, Ghost, Quotes, Selection, Warning, Graph, Compass
} from '@phosphor-icons/react';
import { useScribeV2Store } from '@/lib/store/scribeV2Store';
import {
    Node, Link as GraphLink, NodeType, LENS_CONFIGS, INSIGHT_COLORS, getClusterPositions,
    AI_LENS_CONFIGS, convertGeminiToV1, convertSwampToV1
} from '@/lib/graphEngine';
import { summarizeConcepts } from '@/lib/services/scribeV2Brain';
import { generateMutationBox, placeMutationBox } from '@/lib/services/mutationEngine';
import { generateSwampSession, SwampSession } from '@/lib/services/swampBrain';
import { RED_TEAM, BAUHAUS_COUNCIL, MARKET_MOVERS, DEEP_THINKERS } from '@/lib/constants/swampPersonas';
import OracleGigaMap from './OracleGigaMap';
import OatsenGigaMap from './OatsenGigaMap';
import ScribeStrategist from '@/components/v2/ScribeStrategist';
import DecisionCanvas from './DecisionCanvas';
import { 
    synthesizeStrategistInitialMap, 
    routeStrategistMessage, 
    executeStrategistQuery, 
    keywordRoute,
    executeMiniSwarm
} from '@/lib/services/strategistGigaBrain';
import { askWorkbenchOracle, getGigaMapCacheKey, GigaSatellite, GigaWorkbenchSession } from '@/lib/services/oracleGigaBrain';
import { useMapStore } from '@/lib/mapStore';
import GraphChatbot from './GraphChatbot';
import type { ExtractedGraphPayload } from '@/lib/services/chatGraphEngine';

const LENS_ICON_MAP: Record<string, React.ReactNode> = {
    oracle:     <Compass size={14} weight="bold" />,
    swamp:      <Ghost size={14} weight="regular" />,
    strategist: <Lightning size={14} weight="regular" />,
};

const WORKBENCH_SKILLS = [
    { id: 'find-problems', label: 'Audit Risks', icon: <Warning size={14} weight="bold" /> },
    { id: 'generate-ideas', label: 'Innovation Lab', icon: <MagicWand size={14} weight="bold" /> },
    { id: 'scamper', label: 'SCAMPER', icon: <ArrowsClockwise size={14} weight="bold" /> },
    { id: 'first-principles', label: 'First Principles', icon: <TreeStructure size={14} weight="bold" /> },
    { id: 'analogy', label: 'Analogy', icon: <Sparkle size={14} weight="bold" /> },
    { id: 'pre-mortem', label: 'Pre-Mortem', icon: <Ghost size={14} weight="bold" /> },
];

const WORKBENCH_PERSONAS = [
    { id: 'RED_TEAM', label: 'Red Team', color: '#ef4444', pkg: RED_TEAM },
    { id: 'BAUHAUS_COUNCIL', label: 'Bauhaus Council', color: '#06b6d4', pkg: BAUHAUS_COUNCIL },
    { id: 'MARKET_MOVERS', label: 'Market Movers', color: '#f59e0b', pkg: MARKET_MOVERS },
    { id: 'DEEP_THINKERS', label: 'Deep Thinkers', color: '#8b5cf6', pkg: DEEP_THINKERS },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    nodes: Node[];
    links: GraphLink[];
    title?: string;
    backHref?: string;
    isArchipelago?: boolean;
    sourceContent?: string;
    noteId?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GraphCanvas({
    nodes: propNodes,
    links: propLinks,
    title,
    backHref = '/',
    isArchipelago = false,
    sourceContent = "",
    noteId,
}: Props) {
    const { addOracleSession } = useScribeV2Store();
    const [activeAiLens, setActiveAiLens] = useState<string | null>('oracle');
    const [aiGraphData, setAiGraphData] = useState<{ nodes: Node[]; links: GraphLink[] } | null>(null);
    const [swampSessions, setSwampSessions] = useState<SwampSession[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<string>('red-team');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    // const [lens, setLens] = useState<string>('weaver'); // Removed legacy lens
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMutating, setIsMutating] = useState(false);
    const [strategistMessages, setStrategistMessages] = useState<any[]>([]);
    const [isStrategistExecuting, setIsStrategistExecuting] = useState(false);

    // Persistence: Load history on mount
    useEffect(() => {
        const key = `strategist-history-${noteId || 'multi'}`;
        const cached = localStorage.getItem(key);
        if (cached) {
            try { setStrategistMessages(JSON.parse(cached)); } catch (e) {}
        }
    }, [noteId]);

    // Persistence: Save history on change
    useEffect(() => {
        const key = `strategist-history-${noteId || 'multi'}`;
        localStorage.setItem(key, JSON.stringify(strategistMessages));
    }, [strategistMessages, noteId]);

    // Persistence: Load strategist graph on mount
    useEffect(() => {
        const key = `strategist-graph-${noteId || 'multi'}`;
        const cached = localStorage.getItem(key);
        if (cached && activeAiLens === 'strategist') {
            try { setAiGraphData(JSON.parse(cached)); } catch (e) {}
        }
    }, [noteId, activeAiLens]);

    const { recordMap } = useMapStore();

    // Persistence: Save strategist graph on change
    useEffect(() => {
        if (activeAiLens === 'strategist' && aiGraphData) {
            const key = `strategist-graph-${noteId || 'multi'}`;
            localStorage.setItem(key, JSON.stringify(aiGraphData));
        }
    }, [aiGraphData, noteId, activeAiLens]);

    // Persistence: Record map snapshot in MapStore
    useEffect(() => {
        if (!activeAiLens || !aiGraphData?.nodes?.length) return;
        const lensTitle = activeAiLens.charAt(0).toUpperCase() + activeAiLens.slice(1);
        recordMap({
            id: `ai-${activeAiLens}-${noteId || 'multi'}`,
            title: `${lensTitle} Map: ${title || 'Untitled'}`,
            type: (activeAiLens as any) || 'custom',
            noteIds: noteId ? [noteId] : [],
            noteTitles: [title || 'Untitled'],
            nodeCount: aiGraphData.nodes.length,
            linkCount: aiGraphData.links?.length || 0,
            previewExcerpt: `AI generated ${lensTitle} synthesis map with ${aiGraphData.nodes.length} nodes.`,
            href: noteId ? `/graph/${noteId}` : `/graph/multi`,
        });
    }, [activeAiLens, aiGraphData, noteId, title, recordMap]);

    // ── Chatbot: Inject generated nodes and connections from AI response ──
    const handleInjectChatGraph = (payload: ExtractedGraphPayload, userPrompt?: string) => {
        if (!payload.nodes?.length) return;

        // Clean and format user question for session heading with ellipsis if long
        const rawQuestion = (userPrompt || 'Chat Insights').replace(/\n+/g, ' ').trim();
        const formattedTitle = rawQuestion.length > 40 ? rawQuestion.slice(0, 37) + '...' : rawQuestion;

        const currentN = (aiGraphData?.nodes && aiGraphData.nodes.length > 0) ? aiGraphData.nodes : propNodes;
        const currentL = (aiGraphData?.links && aiGraphData.links.length > 0) ? aiGraphData.links : propLinks;

        const anchorNode = activeNode || currentN.find(n => n.type === 'EPICENTER' || n.type === 'ENTITY') || currentN[0];
        const anchorX = anchorNode?.x ?? 0;
        const anchorY = anchorNode?.y ?? 0;

        const newNodes: Node[] = payload.nodes.map((n, i) => {
            const angle = (i / payload.nodes.length) * 2 * Math.PI;
            const distance = 200 + (i % 2) * 60;
            return {
                id: n.id,
                label: n.label,
                type: (n.category === 'RISK' ? 'STRAT_RISK' : n.category === 'OPPORTUNITY' ? 'STRAT_OPPORTUNITY' : n.category === 'PATH' ? 'STRAT_PATH' : 'STRAT_INSIGHT') as NodeType,
                summary: n.summary || n.label,
                text: n.summary || n.label,
                x: anchorX + Math.cos(angle) * distance,
                y: anchorY + Math.sin(angle) * distance,
                r: 18,
                category: n.category || 'INSIGHT',
                data: { 
                    isLatest: true, 
                    category: n.category || 'INSIGHT', 
                    label: n.label, 
                    summary: n.summary || n.label 
                },
            };
        });

        const newLinks: GraphLink[] = [];

        // Internal edges between chat nodes
        payload.edges?.forEach(e => {
            newLinks.push({
                source: e.source,
                target: e.target,
                value: 1.5,
                type: 'SYNTHESIS',
            });
        });

        // Main connections to existing nodes
        payload.mainConnections?.forEach(mc => {
            const targetId = mc.targetMainNodeId || anchorNode?.id;
            if (targetId) {
                newLinks.push({
                    source: mc.sourceChatNodeId,
                    target: targetId,
                    value: 2,
                    type: 'CONTAINS',
                });
            }
        });

        // Fallback: If no explicit main connections, link first node directly to anchor
        if ((!payload.mainConnections || payload.mainConnections.length === 0) && anchorNode && newNodes.length > 0) {
            newLinks.push({
                source: newNodes[0].id,
                target: anchorNode.id,
                value: 2,
                type: 'CONTAINS',
            });
        }

        const combinedNodes = [...currentN, ...newNodes];
        const combinedLinks = [...currentL, ...newLinks];

        // Inject directly into Oatsen GigaMap session state
        const currentContextKey = getGigaMapCacheKey(sourceContent).toString();
        const satellites: GigaSatellite[] = payload.nodes.map((n, idx) => ({
            id: n.id || `sat-${Date.now()}-${idx}`,
            name: n.label,
            type: n.category || 'INSIGHT',
            category: n.category || 'INSIGHT',
            summary: n.summary || n.label,
        }));

        const targetId = payload.mainConnections?.[0]?.targetMainNodeId || activeNode?.id || (aiGraphData?.nodes?.[0]?.id) || 'pillar-0';

        const newSession: GigaWorkbenchSession = {
            id: `session-chat-${Date.now()}`,
            type: 'generate-ideas',
            title: formattedTitle,
            nodes: satellites,
            summary: payload.nodes.map(n => n.label).join(', '),
            timestamp: new Date().toISOString(),
            targetNodeIds: [targetId],
            noteId: noteId,
            contextKey: currentContextKey,
        };

        addOracleSession(newSession);

        setAiGraphData({
            nodes: combinedNodes,
            links: combinedLinks,
        });

        // Ensure we stay in Oracle mode
        if (activeAiLens !== 'oracle') {
            setActiveAiLens('oracle');
        }

        recordMap({
            id: noteId ? `note-${noteId}` : `custom-graph-${Date.now()}`,
            title: title ? `${title} (${formattedTitle})` : formattedTitle,
            type: 'oracle',
            noteIds: noteId ? [noteId] : [],
            noteTitles: [title || 'Untitled'],
            nodeCount: combinedNodes.length,
            linkCount: combinedLinks.length,
            previewExcerpt: `Oracle graph extended with ${newNodes.length} nodes for: "${formattedTitle}"`,
            href: noteId ? `/graph/${noteId}` : `/graph/multi`,
        });
    };

    // Derived logic driver
    const effLens = (activeAiLens === 'oracle' || activeAiLens === 'strategist') ? activeAiLens : 'oracle';
    const effArch = true;

    // Derived Display Data
    const displayNodes = useMemo(() => {
        if (aiGraphData?.nodes && aiGraphData.nodes.length > 0) {
            return aiGraphData.nodes;
        }
        return propNodes;
    }, [aiGraphData, propNodes]);

    const displayLinks = useMemo(() => {
        if (aiGraphData?.links && aiGraphData.links.length > 0) {
            return aiGraphData.links;
        }
        return propLinks;
    }, [aiGraphData, propLinks]);

    const exportGraphToMarkdown = useCallback(() => {
        let md = `# Map Export\n\n`;
        const nodes = aiGraphData?.nodes || displayNodes || [];
        nodes.forEach(n => {
            md += `### ${n.label || n.name}\n`;
            if (n.summary) md += `${n.summary}\n`;
            md += `\n`;
        });
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scribe_export_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [aiGraphData, displayNodes]);

    // ── Auto-Trigger Strategist ──────────────────────────────────────────────
    useEffect(() => {
        if (activeAiLens === 'strategist' && !aiGraphData && !isSynthesizing && sourceContent) {
            handleTriggerAi('strategist');
        }
    }, [activeAiLens, aiGraphData, isSynthesizing, sourceContent]);

    useEffect(() => {
        if (activeAiLens && activeAiLens !== 'oracle' && activeAiLens !== 'swamp' && activeAiLens !== 'strategist') {
            setAiGraphData(null);
        }
    }, [activeAiLens]);

    // ── AI Synthesis ──────────────────────────────────────────────────────────
    const handleTriggerAi = useCallback(async (lensKey: string, force = false, overridePackage?: string) => {
        if (!force && activeAiLens === lensKey && !overridePackage && lensKey !== 'strategist') {
            setActiveAiLens(null);
            setAiGraphData(null);
            return;
        }

        setIsSynthesizing(true);
        setActiveAiLens(lensKey);

        try {
            if (lensKey === 'strategist' || lensKey === 'oracle') {
                // GigaMap (Oracle/Strategist) handles its own synthesis internally.
                // We just mark it as synthesizing until the data comes back via onDataGenerated.
                setIsSynthesizing(true);
                return;
            } else if (lensKey === 'swamp') {
                const pkgId = overridePackage || selectedPackage;
                setSelectedPackage(pkgId);

                const cacheKey = `swamp-cache-${noteId || 'multi'}-${pkgId}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached && !force) {
                    try {
                        const session = JSON.parse(cached);
                        setSwampSessions(prev => [...prev, session]);
                        const converted = convertSwampToV1(session);
                        setAiGraphData(prev => ({
                            nodes: [...(prev?.nodes || []), ...converted.nodes],
                            links: [...(prev?.links || []), ...converted.links]
                        }));
                        setIsSynthesizing(false);
                        return;
                    } catch (e) {
                        localStorage.removeItem(cacheKey);
                    }
                }

                let selectedPersonas = RED_TEAM;
                if (pkgId === 'bauhaus') selectedPersonas = BAUHAUS_COUNCIL;
                if (pkgId === 'market-movers') selectedPersonas = MARKET_MOVERS;
                if (pkgId === 'deep-thinkers') selectedPersonas = DEEP_THINKERS;

                const session = await generateSwampSession(noteId || "multi", sourceContent, pkgId, selectedPersonas);
                if (session) {
                    localStorage.setItem(cacheKey, JSON.stringify(session));
                    setSwampSessions(prev => [...prev, session]);
                    const converted = convertSwampToV1(session);
                    setAiGraphData(prev => ({
                        nodes: [...(prev?.nodes || []), ...converted.nodes],
                        links: [...(prev?.links || []), ...converted.links]
                    }));
                }
            } else {
                const config = AI_LENS_CONFIGS[lensKey];
                if (config) {
                    const result = await summarizeConcepts(sourceContent, config.systemPrompt, force);
                    if (result) {
                        const converted = convertGeminiToV1(result);
                        setAiGraphData(converted);
                    }
                }
            }
        } catch (err) {
            console.error("AI Synthesis Error:", err);
        } finally {
            setIsSynthesizing(false);
        }
    }, [activeAiLens, sourceContent, noteId, swampSessions, selectedPackage]);

    // ── Strategist: Universal node injection with Spatial Sections ──────────────────
    const processMutationResult = (result: any, baseNodes: Node[], prompt: string) => {
        if (!result?.nodes?.length) return;

        const coolingDownNodes = baseNodes.map(n => ({
            ...n,
            data: { ...n.data, isLatest: false }
        }));

        const newNodes: Node[] = [];
        const newLinks: GraphLink[] = [];
        let counter = 0;
        const generateId = () => `strat-node-${Date.now()}-${counter++}`;

        const epicenter = coolingDownNodes.find(n => n.type === 'EPICENTER') || coolingDownNodes[0];
        const cx = epicenter?.x || 0;
        const cy = epicenter?.y || 0;

        const mapBounds = coolingDownNodes.reduce((acc, n) => {
            const dx = n.x - cx;
            const dy = n.y - cy;
            return Math.max(acc, Math.sqrt(dx*dx + dy*dy));
        }, 600);

        let buckets = { top: 0, center: 0, bottom: 0 };
        result.nodes.forEach((n: any) => {
            const cat = n.category || 'INSIGHT';
            if (['RISK', 'CRITIQUE', 'OPPORTUNITY'].includes(cat)) buckets.top++;
            else if (['PATH'].includes(cat)) buckets.bottom++;
            else buckets.center++;
        });

        const activeBuckets = (buckets.top > 0 ? 1 : 0) + (buckets.center > 0 ? 1 : 0) + (buckets.bottom > 0 ? 1 : 0);
        const maxBucketSize = Math.max(buckets.top, buckets.center, buckets.bottom, 1);
        const nodeSpacingX = 300; 
        const rowHeight = 220;

        const sectionWidth = (maxBucketSize > 0 ? (maxBucketSize - 1) * nodeSpacingX : 0) + 280;
        const sectionHeight = (activeBuckets > 0 ? (activeBuckets - 1) * rowHeight : 0) + 320; 

        const jitter = ((Date.now() % 1000) / 1000 - 0.5) * (Math.PI / 4);
        const finalAngle = (Math.PI / 2) + jitter; 
        const orbitRadius = mapBounds + 850;

        const sectionId = `section-${Date.now()}`;
        const sectionPos = {
            x: cx + Math.cos(finalAngle) * orbitRadius - (sectionWidth / 2),
            y: cy + Math.sin(finalAngle) * (orbitRadius + 100) - (sectionHeight / 2)
        };

        if (sectionPos.y < (cy + mapBounds)) {
            sectionPos.y = cy + mapBounds + 200;
        }

        newNodes.push({
            id: sectionId,
            type: 'SECTION_GROUP' as any,
            label: prompt.slice(0, 80) + (prompt.length > 80 ? '...' : ''),
            x: sectionPos.x,
            y: sectionPos.y,
            width: sectionWidth,
            height: sectionHeight,
            style: { width: sectionWidth, height: sectionHeight },
            data: { isLatest: true }
        } as any);

        const CONFIG: Record<string, any> = {
            'RISK': { type: 'STRAT_RISK', r: 45 },
            'CRITIQUE': { type: 'STRAT_CRITIQUE', r: 45 },
            'PATH': { type: 'STRAT_PATH', r: 50 },
            'INSIGHT': { type: 'STRAT_INSIGHT', r: 48 }
        };

        const sessionLabel = result.sessionTitle || result.title || 'Strategic Analysis';
        let counts = { top: 0, center: 0, bottom: 0 };

        const findContextNode = (label: string, category: string) => {
            const terms = label.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3);
            const targets = category === 'RISK' ? ['ENTITY', 'STRAT_FACT'] : 
                          category === 'OPPORTUNITY' ? ['STRAT_INSIGHT', 'ANCHOR'] :
                          ['EPICENTER', 'ANCHOR', 'SENTENCE'];
            
            let best = epicenter;
            let maxScore = -1;
            coolingDownNodes.forEach(n => {
                if (n.type === 'SECTION_GROUP' || n.id.startsWith('strat-node')) return;
                let score = targets.includes(n.type) ? 30 : 0;
                const nLabel = (n.label || n.text || "").toLowerCase();
                terms.forEach(t => { if (nLabel.includes(t)) score += 100; });
                if (score > maxScore) { maxScore = score; best = n; }
            });
            return best;
        };

        const nodesWithIds = result.nodes.map((nodeData: any, i: number) => ({
            ...nodeData,
            id: `strat-node-${Date.now()}-${i}`
        }));

        nodesWithIds.forEach((nodeData: any, i: number) => {
            const id = nodeData.id;
            const cat = nodeData.category || 'INSIGHT';
            const cfg = CONFIG[cat] || CONFIG['INSIGHT'];
            
            let bucket: 'top'|'center'|'bottom' = 'center';
            if (['RISK', 'CRITIQUE', 'OPPORTUNITY'].includes(cat)) bucket = 'top';
            else if (['PATH'].includes(cat)) bucket = 'bottom';

            const totalInBucket = buckets[bucket];
            const idxInBucket = counts[bucket]++;
            
            let rowYFactor = 0.5;
            if (activeBuckets === 3) {
                rowYFactor = bucket === 'top' ? 0.25 : bucket === 'bottom' ? 0.75 : 0.5;
            } else if (activeBuckets === 2) {
                if (buckets.top && buckets.center) rowYFactor = bucket === 'top' ? 0.3 : 0.7;
                else if (buckets.top && buckets.bottom) rowYFactor = bucket === 'top' ? 0.3 : 0.7;
                else rowYFactor = bucket === 'center' ? 0.3 : 0.7;
            }

            const bucketWidth = (totalInBucket - 1) * nodeSpacingX;
            const startX = (sectionWidth / 2) - (bucketWidth / 2);
            const targetX = startX + (idxInBucket * nodeSpacingX);

            newNodes.push({
                id,
                parentId: sectionId,
                type: cfg.type as any,
                label: nodeData.label || `Node ${i + 1}`,
                summary: nodeData.summary || '',
                persona: nodeData.persona,
                category: nodeData.category,
                sessionTitle: sessionLabel,
                sessionCategory: result.sessionCategory,
                intensity: nodeData.intensity ?? 0.7,
                x: targetX,
                y: sectionHeight * rowYFactor - 40,
                r: cfg.r,
                resonanceScore: 80,
                extent: 'parent',
                data: { isLatest: true }
            } as any);

            const relevantNode = findContextNode(nodeData.label || '', cat);
            if (relevantNode?.id) {
                newLinks.push({ source: id, target: relevantNode.id, value: 0.5, type: 'STRAT_LINK_SUBTLE' as any });
            }
        });

        const activeRes = coolingDownNodes.find(n => n.id === activeId);
        if (activeRes?.id) {
            newLinks.push({ source: sectionId, target: activeRes.id, value: 1.0, type: 'STRAT_LINK' as any });
        } else if (epicenter?.id) {
            newLinks.push({ source: sectionId, target: epicenter.id, value: 1.0, type: 'STRAT_LINK' as any });
        }

        const sessionTitle = result.sessionTitle || prompt;
        const session: any = {
            id: `strat-ui-${Date.now()}`,
            type: 'analyze',
            title: sessionTitle,
            summary: result.chatSummary || prompt,
            timestamp: new Date().toISOString(),
            targetNodeIds: activeId ? [activeId] : (epicenter?.id ? [epicenter.id] : []),
            nodes: nodesWithIds.map((n: any) => ({
                id: n.id,
                name: n.label,
                type: (n.category || 'INSIGHT').toLowerCase(),
                summary: n.summary
            }))
        };
        addOracleSession(session);

        setAiGraphData(prev => ({
            nodes: [...coolingDownNodes, ...newNodes],
            links: [...(prev?.links || []), ...newLinks]
        }));
    };

    const handleStrategistMutate = (result: any, baseNodes: Node[], prompt: string) => {
        processMutationResult(result, baseNodes, prompt);
    };

    const handleStrategistSend = useCallback(async (text: string) => {
        if (isStrategistExecuting) return;
        setIsStrategistExecuting(true);
        const userMsg = { role: 'user', text, timestamp: Date.now() };
        setStrategistMessages(prev => [...prev, userMsg]);

        try {
            const currentNodes = displayNodes;
            const keywordSkillId = keywordRoute(text);
            let intent = keywordSkillId 
                ? { skillId: keywordSkillId, reasoning: `Applying ${keywordSkillId.replace('-', ' ')} per your request.` }
                : await routeStrategistMessage(text, currentNodes);

            if (!intent) intent = { skillId: 'red-team', reasoning: 'Strategic Audit sequence initiated.' };

            setStrategistMessages(prev => [...prev, {
                role: 'assistant',
                text: intent!.reasoning,
                skillId: intent!.skillId,
                type: 'logic-transparent',
                timestamp: Date.now()
            }]);

            const result = await executeStrategistQuery(text, intent.skillId, sourceContent, currentNodes);
            if (result) {
                setStrategistMessages(prev => [...prev, {
                    role: 'assistant',
                    text: result.chatSummary,
                    sessionTitle: result.sessionTitle,
                    sessionCategory: result.sessionCategory,
                    nodeCount: result.nodes.length,
                    timestamp: Date.now()
                }]);
                handleStrategistMutate(result, currentNodes, text);
            }
        } catch (err) {
            console.error("[Strategist] Send Error:", err);
        } finally {
            setIsStrategistExecuting(false);
        }
    }, [isStrategistExecuting, sourceContent, displayNodes, handleStrategistMutate]);

    const activeNode = displayNodes.find(n => n.id === activeId) ?? null;

    const handleNodeClick = useCallback((nodeId: string | null) => {
        setActiveId(nodeId === activeId ? null : nodeId);
    }, [activeId]);

    const handleMutation = useCallback(async (technique: string = 'scamper-divergence') => {
        if (!activeNode) return;
        setIsMutating(true);
        const result = await generateMutationBox(technique, { 
            id: activeNode.id, label: activeNode.label, 
            text: activeNode.summary || activeNode.text || activeNode.label, 
            x: activeNode.x ?? 0, y: activeNode.y ?? 0 
        }, []);

        if (result && activeAiLens) {
            const mutNodesWithIds = result.satellites.map((s: any, i: number) => ({
                ...s,
                id: `mut-${Date.now()}-${i}`
            }));

            const newNodes: Node[] = mutNodesWithIds.map(s => ({
                id: s.id, type: 'ENTITY', label: s.title, summary: s.logic,
                x: (activeNode.x ?? 0) + s.coords.x, y: (activeNode.y ?? 0) + s.coords.y,
                r: 12, resonanceScore: 80, insightIndex: activeNode.insightIndex,
                data: { isLatest: true }
            }));

            const mutSession: any = {
                id: `mut-ui-${Date.now()}`,
                type: technique,
                title: technique,
                summary: "Mutation Logic applied",
                timestamp: new Date().toISOString(),
                targetNodeIds: [activeNode.id],
                nodes: mutNodesWithIds.map((s: any) => ({
                    id: s.id,
                    name: s.title,
                    type: 'insight',
                    summary: s.logic
                }))
            };
            addOracleSession(mutSession);

            setAiGraphData(prev => {
                const cooled = (prev?.nodes || []).map(n => ({ ...n, data: { ...n.data, isLatest: false } }));
                const newLinks: GraphLink[] = newNodes.map(n => ({ source: activeNode.id, target: n.id, value: 1, type: 'STRAT_LINK' as any }));
                return {
                    nodes: [...cooled, ...newNodes],
                    links: [...(prev?.links || []), ...newLinks]
                };
            });
        }
        setIsMutating(false);
    }, [activeNode, activeAiLens]);

    const handleSkillTrigger = useCallback(async (skillId: string) => {
        if (!activeNode) return;
        setIsMutating(true);
        try {
            const result = await askWorkbenchOracle(skillId as any, [{
                id: activeNode.id,
                name: activeNode.label,
                type: activeNode.type,
                summary: activeNode.summary || activeNode.text || activeNode.label
            }], sourceContent || "");

            if (result && result.nodes) {
                const prompt = `Advanced Skill: ${WORKBENCH_SKILLS.find(s=>s.id === skillId)?.label || skillId}`;
                processMutationResult(result, displayNodes, prompt);
            }
        } catch (e) {}
        setIsMutating(false);
    }, [activeNode, sourceContent, displayNodes]);

    const handlePersonaTrigger = useCallback(async (pkgId: string, pkg: any[]) => {
        if (!activeNode) return;
        setIsMutating(true);
        try {
            const result = await executeMiniSwarm({
                id: activeNode.id,
                label: activeNode.label,
                text: activeNode.summary || activeNode.text || activeNode.label
            }, pkg, sourceContent || "");

            if (result && result.nodes) {
                const prompt = `Swarm Critique: ${pkgId.replace('_', ' ')}`;
                processMutationResult(result, displayNodes, prompt);
            }
        } catch (e) {}
        setIsMutating(false);
    }, [activeNode, sourceContent, displayNodes]);

    return (
        <div className="fixed! inset-0! w-screen! h-screen! overflow-hidden z-2000 graph-page" style={{ background: 'var(--tactical-bg)' }}>
            <div className="absolute top-4 left-4 right-4 z-1000 h-14 flex items-center gap-3 px-6 rounded-2xl tactical-glass transition-all duration-500 border border-white/20 shadow-2xl">
                {backHref && (
                    <Link href={backHref} className="graph-back-btn flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest mr-2 shrink-0">
                        <ArrowLeft size={16} weight="bold" /> Back
                    </Link>
                )}
                <div className="w-px h-4 bg-white/20 mx-1 shrink-0" />
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 shrink-0 ml-auto">
                    {activeAiLens && (
                        <button 
                            onClick={() => handleTriggerAi(activeAiLens, true)} 
                            disabled={isSynthesizing}
                            className="flex items-center gap-2 text-[11px] px-4 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all mr-4 shadow-sm"
                            title="Force AI Regeneration"
                        >
                            <ArrowsClockwise size={14} weight="bold" className={isSynthesizing ? 'animate-spin' : ''} />
                            <span>Regenerate</span>
                        </button>
                    )}
                    {Object.entries(AI_LENS_CONFIGS).map(([key, cfg]) => {
                        const isActive = activeAiLens === key;
                        return (
                            <button key={key} onClick={() => handleTriggerAi(key)} disabled={isSynthesizing && !isActive}
                                className={`flex items-center gap-2 text-[11px] px-4 py-1.5 rounded-full border transition-all duration-500 font-bold uppercase tracking-tighter
                                    ${isActive ? 'bg-black text-white border-black shadow-xl scale-105' : 'bg-white/50 border-white/40 text-black shadow-sm hover:bg-white'}`}>
                                {isSynthesizing && isActive ? (
                                    <CircleNotch size={14} weight="bold" className="animate-spin" />
                                ) : isActive ? (
                                    LENS_ICON_MAP[key] ?? <Sparkle size={14} weight="fill" />
                                ) : (
                                    LENS_ICON_MAP[key] ?? <Sparkle size={14} weight="regular" />
                                )}
                                <span className="inline">{cfg.label}</span>
                            </button>
                        );
                    })}
                    <div className="w-px h-4 bg-white/20 mx-1 shrink-0" />
                    <button onClick={exportGraphToMarkdown} className="flex items-center gap-2 text-[11px] px-4 py-1.5 rounded-full border border-white/20 bg-white/50 hover:bg-black hover:text-white transition-all text-black font-bold uppercase tracking-tighter shadow-sm">
                        Export MD
                    </button>
                </div>
            </div>

            <div className="w-full h-full relative z-0">
                {activeAiLens === 'oracle' ? (
                    <OatsenGigaMap
                        sourceContent={sourceContent ?? ''}
                        onClose={() => setActiveAiLens(null)}
                        noteId={noteId}
                        onDataGenerated={(data) => {
                            const pNodes = data.pillars.map(p => ({ id: p.id, label: p.name, type: 'ENTITY' as any, x: 0, y: 0, r: 20, summary: p.name }));
                            const cNodes = data.clusters.map(c => ({ id: c.id, label: c.name, type: 'ENTITY' as any, x: 0, y: 0, r: 15, summary: c.name }));
                            const lNodes = data.leaves.map(l => ({ id: l.id, label: l.name, type: 'ENTITY' as any, x: 0, y: 0, r: 10, summary: l.summary || l.name }));
                            setAiGraphData({ nodes: [...pNodes, ...cNodes, ...lNodes], links: [] });
                            setIsSynthesizing(false);
                        }}
                    />
                ) : activeAiLens === 'strategist' ? (
                    <OracleGigaMap 
                        sourceContent={sourceContent ?? ''} 
                        onClose={() => setActiveAiLens(null)} 
                        noteId={noteId} 
                        mode={activeAiLens} 
                        onNodeSelect={(nodeId) => setActiveId(nodeId)}
                        onDataGenerated={(data) => {
                            console.log("[GraphCanvas] GigaMap Data Received:", data.pillars.length, "pillars");
                            // Map GigaMapData to our GraphCanvas internal Node/Link format
                            const pNodes = data.pillars.map(p => ({ 
                                id: p.id, label: p.name, type: 'ENTITY' as NodeType, 
                                x: 0, y: 0, r: 20, 
                                summary: p.name 
                            }));
                            const cNodes = data.clusters.map(c => ({ 
                                id: c.id, label: c.name, type: 'ENTITY' as NodeType, 
                                x: 0, y: 0, r: 15, 
                                summary: c.name 
                            }));
                            const lNodes = data.leaves.map(l => ({ 
                                id: l.id, label: l.name, type: 'ENTITY' as NodeType, 
                                x: 0, y: 0, r: 10, 
                                summary: l.summary || l.name 
                            }));

                            const allNodes: Node[] = [...pNodes, ...cNodes, ...lNodes];
                            const allLinks: GraphLink[] = (data.crossLinks || []).map(cl => ({ 
                                source: cl.source, target: cl.target, value: 1, 
                                type: 'STRAT_LINK' as const 
                            }));
                            
                            console.log("[GraphCanvas] Synced nodes for workbench:", allNodes.length);
                            setAiGraphData({ nodes: allNodes, links: allLinks });
                            setIsSynthesizing(false);
                        }}
                    />
                ) : (
                    <DecisionCanvas nodes={displayNodes} links={displayLinks} onNodeSelect={(nodeId) => handleNodeClick(nodeId)} lens={effLens as any} />
                )}
            </div>

            {activeNode && (
                <div className="fixed top-20 right-6 w-[360px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden z-50 tactical-glass rounded-3xl animate-in slide-in-from-right-8 duration-500 shadow-2xl border border-white/30">
                    <div className="flex items-center justify-between px-6 pt-6 pb-2">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-black opacity-80">{activeNode.type}</span>
                        <button onClick={() => setActiveId(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><X size={18} weight="bold" /></button>
                    </div>
                    <div className="overflow-y-auto flex-1 px-6 pb-8">
                        <h3 className="text-black text-lg font-mono font-black mb-4 uppercase tracking-tight">{activeNode.label}</h3>
                        <p className="text-gray-800 text-[14px] leading-relaxed pl-4 border-l-[3px] border-black/20 italic">{activeNode.summary || activeNode.text}</p>
                        
                        {activeAiLens === 'strategist' && (
                            <div className="mt-8 pt-6 border-t border-black/10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <section>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Sparkle size={14} className="text-amber-500" /> Advanced Skills
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {WORKBENCH_SKILLS.map(skill => (
                                            <button 
                                                key={skill.id}
                                                onClick={() => handleSkillTrigger(skill.id)}
                                                disabled={isMutating}
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-black/10 bg-black/5 hover:bg-black hover:text-white transition-all text-left group disabled:opacity-50"
                                            >
                                                <span className="text-gray-500 group-hover:text-amber-400 transition-colors">{skill.icon}</span>
                                                <span className="text-[10px] font-black uppercase tracking-tight">{skill.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TreeStructure size={14} className="text-indigo-500" /> Swarm Personas
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {WORKBENCH_PERSONAS.map(p => (
                                            <button 
                                                key={p.id}
                                                onClick={() => handlePersonaTrigger(p.id, p.pkg)}
                                                disabled={isMutating}
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-black/10 bg-black/5 hover:bg-black hover:text-white transition-all text-left group disabled:opacity-50"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                <span className="text-[10px] font-black uppercase tracking-tight">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <button onClick={() => handleMutation()} disabled={isMutating} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-black text-white font-black text-[11px] tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl">
                                    {isMutating ? <CircleNotch size={18} className="animate-spin" /> : <Lightning size={18} weight="fill" className="text-amber-400" />} Evolve Component
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeAiLens === 'strategist' && (
                <ScribeStrategist messages={strategistMessages} isExecuting={isStrategistExecuting} onSendMessage={handleStrategistSend} onClose={() => setActiveAiLens(null)} />
            )}

            {/* AI Graph Chatbot with Make Graph node generation */}
            <GraphChatbot
                title={title || 'Knowledge Graph'}
                sourceContent={sourceContent}
                existingNodes={displayNodes}
                activeNode={activeNode ? { id: activeNode.id, label: activeNode.label } : null}
                onInjectGraphData={handleInjectChatGraph}
            />
        </div>
    );
}
