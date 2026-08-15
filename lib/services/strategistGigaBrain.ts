import { 
  safeJsonParse, 
  fetchOracleWithFallback, 
  PASS_1_PROMPT, 
  GigaMapData, 
  getGigaMapCacheKey, 
  generateHeuristicGigaMap 
} from './oracleGigaBrain';
import { Node as GNode, Link as GLink, getClusterPositions } from '../graphEngine';
import { getEffectiveGeminiKey, getActiveBYOKConfig } from '@/lib/byokStore';

export interface StrategistMapData {
  nodes: GNode[];
  links: GLink[];
}

const STRAT_PASS_1_PROMPT = PASS_1_PROMPT;

const STRAT_PASS_2_PROMPT = `You are a premium Oracle Leaf Node Extractor. Given the document and the structural skeleton (Pillars & Clusters), extract the specific leaf nodes and their systemic cross-connections.

CRITICAL RULES:
1. Granularity is Key: Extract EXACTLY AS MANY critical, high-signal concepts per Cluster as organically exist. If a cluster contains 15 distinct technical concepts, extract all 15. Do not truncate or generalize.
2. Provide a 1-sentence analytical summary for each leaf node.
3. Categorize each leaf node into exactly one of: INSIGHT, FACT, RISK, OPPORTUNITY, PATH, QUESTION, DATA.
4. Identify natural 'crossLinks' connecting nodes across DIFFERENT clusters or pillars. The overall number of links should scale proportionally with the volume of nodes extracted.

You MUST output strictly valid JSON matching this schema:
{
  "leaves": [
    {
      "id": "leaf_123",
      "name": "Specific Concept",
      "category": "INSIGHT/FACT/RISK/OPPORTUNITY/PATH/QUESTION/DATA",
      "summary": "Specific detail or logic here.",
      "clusterId": "cluster_xyz"
    }
  ],
  "crossLinks": [
    {
      "source": "leaf_123",
      "target": "leaf_456",
      "verb": "causes / prevents"
    }
  ]
}`;

export async function synthesizeStrategistGigaMap(content: string, forceRefresh = false): Promise<GigaMapData | null> {
  console.log("🧠 [Strategist Giga] Starting Two-Pass Systemic Extraction...");
  const cacheKey = `strat_giga_v1_${getGigaMapCacheKey(content)}`;

  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  
  if (!apiKey) {
    console.info("ℹ️ [Strategist Giga] No API key found. Synthesizing instant heuristic topology from document structure.");
    return generateHeuristicGigaMap(content);
  }

  const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
  const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
  const fallback = "gemini-2.5-flash";
  const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;

  try {
    const p1Payload = {
      systemInstruction: { parts: [{ text: STRAT_PASS_1_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: content.slice(0, 15000) }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    };
    
    const p1Data = await fetchOracleWithFallback(url, p1Payload, primary, fallback);
    if (!p1Data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("Pass 1 Empty Response");
    
    const p1Json = safeJsonParse(p1Data.candidates[0].content.parts[0].text);
    const pillars = p1Json.pillars.map((p: any) => ({ id: p.id, name: p.name }));
    const clusters: any[] = [];
    p1Json.pillars.forEach((p: any) => {
      p.clusters.forEach((c: any) => clusters.push({ id: c.id, name: c.name, pillarId: p.id }));
    });

    const skeletonContext = JSON.stringify({ pillars: p1Json.pillars });
    const p2Payload = {
      systemInstruction: { parts: [{ text: STRAT_PASS_2_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: `Document:\n${content.slice(0, 15000)}\n\nSkeleton to populate:\n${skeletonContext}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    };
    
    const p2Data = await fetchOracleWithFallback(url, p2Payload, primary, fallback);
    const p2Json = safeJsonParse(p2Data.candidates[0].content.parts[0].text);

    const finalMap: GigaMapData = {
      pillars,
      clusters,
      leaves: p2Json.leaves,
      crossLinks: p2Json.crossLinks
    };

    localStorage.setItem(cacheKey, JSON.stringify(finalMap));
    return finalMap;
  } catch (err) {
    console.error("❌ [Strategist Giga] Pipeline Exception, falling back to heuristic map:", err);
    return generateHeuristicGigaMap(content);
  }
}

export async function synthesizeStrategistInitialMap(content: string): Promise<StrategistMapData | null> {
  const gigaData = await synthesizeStrategistGigaMap(content);
  if (!gigaData) return null;

  try {
    const nodes: GNode[] = [];
    const links: GLink[] = [];

    const pillarCount = gigaData.pillars.length;
    const pillarPositions = getClusterPositions(pillarCount, 800);
    const getPillarColor = (idx: number) => `hsl(${(idx * 360 / Math.max(1, pillarCount)) % 360}, 75%, 60%)`;

    // Map Pillars
    gigaData.pillars.forEach((p: any, pIdx: number) => {
        const pillarId = p.id;
        const pos = pillarPositions[pIdx] || { x: (pIdx * 300) - 300, y: 0 };
        const pillarColor = getPillarColor(pIdx);
        
        nodes.push({
            id: pillarId,
            type: 'ANCHOR',
            label: p.name.toUpperCase(),
            x: pos.x,
            y: pos.y,
            fx: pos.x,
            fy: pos.y,
            r: 45,
            resonanceScore: 100,
            insightIndex: pIdx,
            color: pillarColor,
        });

        const pClusters = gigaData.clusters.filter(c => c.pillarId === pillarId);
        const clusterCount = pClusters.length;
        const clusterOffsetPositions = getClusterPositions(clusterCount, 250);

        pClusters.forEach((c: any, cIdx: number) => {
            const clusterId = c.id;
            const cPos = clusterOffsetPositions[cIdx] || { x: (cIdx * 120) - 60, y: 150 };
            const cx = pos.x + cPos.x;
            const cy = pos.y + cPos.y;

            nodes.push({
                id: clusterId,
                type: 'ANCHOR',
                label: c.name,
                x: cx,
                y: cy,
                fx: cx,
                fy: cy,
                r: 25,
                resonanceScore: 85,
                insightIndex: pIdx,
                color: pillarColor
            });

            links.push({ source: pillarId, target: clusterId, value: 1, type: 'CONTAINS', color: pillarColor });
        });
    });

    const TYPE_MAP: Record<string, any> = {
        'INSIGHT': 'STRAT_INSIGHT',
        'FACT': 'STRAT_FACT',
        'RISK': 'STRAT_RISK',
        'OPPORTUNITY': 'STRAT_OPPORTUNITY',
        'PATH': 'STRAT_PATH',
        'QUESTION': 'STRAT_QUESTION',
        'DATA': 'STRAT_FACT'
    };

    gigaData.leaves.forEach((leaf: any, leafIdx: number) => {
        const clusterId = leaf.clusterId;
        const clusterNode = nodes.find(n => n.id === clusterId);
        const pIdx = clusterNode?.insightIndex ?? 0;
        const pillarColor = clusterNode?.color || '#666';
        
        const angle = (leafIdx * 137.5) * (Math.PI / 180);
        const dist = 120 + Math.random() * 40;
        const lx = (clusterNode?.x || 0) + Math.cos(angle) * dist;
        const ly = (clusterNode?.y || 0) + Math.sin(angle) * dist;
        
        nodes.push({
            id: leaf.id,
            type: TYPE_MAP[leaf.category || leaf.type] || 'STRAT_INSIGHT',
            label: leaf.name,
            summary: leaf.summary,
            category: leaf.category || 'INSIGHT',
            x: lx,
            y: ly,
            fx: lx,
            fy: ly,
            r: 14,
            resonanceScore: 75,
            insightIndex: pIdx,
            color: pillarColor,
        });

        if (leaf.clusterId) {
            links.push({ source: leaf.clusterId, target: leaf.id, value: 0.8, type: 'CONTAINS', color: pillarColor });
        }
    });

    gigaData.crossLinks?.forEach((cl: any) => {
        const sourceNode = nodes.find(n => n.id === cl.source);
        const targetNode = nodes.find(n => n.id === cl.target);
        const color = sourceNode?.color || targetNode?.color || 'rgba(0,0,0,0.1)';
        links.push({ source: cl.source, target: cl.target, value: 0.5, type: 'DESCRIBES', color });
    });

    return { nodes, links };
  } catch (err) {
    console.error("Strategist Initial Map Error:", err);
    return null;
  }
}

// ── Strategist: Universal Query Engine ──────────────────
export async function executeStrategistQuery(userQuery: string, skillHint: string, content: string, canvasNodes: GNode[]): Promise<{
    sessionTitle: string;
    sessionCategory: string;
    nodes: Array<{
        label: string;
        category: 'CRITIQUE' | 'INSIGHT' | 'FACT' | 'OPPORTUNITY' | 'RISK' | 'PATH' | 'QUESTION' | 'DATA';
        summary: string;
        intensity?: number;
    }>;
    chatSummary: string;
} | null> {
    const byok = getActiveBYOKConfig();
    const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
    
    if (!apiKey) {
      // Return heuristic response when no API key is provided
      const skillName = skillHint.replace('-', ' ').toUpperCase();
      return {
        sessionTitle: `${skillName}: Strategy Vector`,
        sessionCategory: 'exploratory',
        nodes: [
          { label: 'Core Mechanism', category: 'INSIGHT', summary: `Systemic leverage derived from ${userQuery.slice(0, 40)}.`, intensity: 0.8 },
          { label: 'Strategic Risk', category: 'RISK', summary: 'Execution barrier to watch during rollout.', intensity: 0.9 },
          { label: 'Unexplored Opportunity', category: 'OPPORTUNITY', summary: 'Adjacent high-impact expansion avenue.', intensity: 0.75 },
          { label: 'Immediate Action Path', category: 'PATH', summary: 'Concrete next step to validate assumptions.', intensity: 0.85 }
        ],
        chatSummary: `Synthesized 4 strategic vectors for ${skillHint} based on your workspace context.`
      };
    }

    const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
    const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
    const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;
    const canvasContext = canvasNodes.slice(0, 30).map(n => `- [${n.type}] ${n.label}: ${(n.summary || '').slice(0, 80)}`).join('\n');

    const systemInstruction = `You are SCRIBE STRATEGIST — an elite strategic intelligence engine.
CORE DIRECTIVE:
- You will receive a PROTOCOL with a specific INSTRUCTION. Follow it STRICTLY and COMPLETELY.
- If the INSTRUCTION says only generate PATH nodes, generate ONLY PATH category nodes.
- If the INSTRUCTION says only generate CRITIQUE/RISK, generate ONLY those categories.
- Each node must be SPECIFIC, NAMED, and ACTIONABLE — never generic.
- Provide substantive insight: real mechanisms, named steps, concrete actions.

NODE CATEGORIES: CRITIQUE, INSIGHT, FACT, OPPORTUNITY, RISK, PATH, QUESTION, DATA.
ACTIVE PROTOCOL: ${skillHint}

OUTPUT SCHEMA (strict JSON):
{
  "sessionTitle": string,
  "sessionCategory": "adversarial|exploratory|risk|synthesis|research|path",
  "nodes": [{ "label": string, "category": string, "summary": string, "intensity": number }],
  "chatSummary": string
}`;

    const userMessage = `USER QUERY: "${userQuery}"\n\nSOURCE CONTENT:\n${content.slice(0, 10000)}\n\nCANVAS CONTEXT:\n${canvasContext}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.75 }
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? safeJsonParse(text) : null;
    } catch (e) { return null; }
}

// ── Strategist: Route user message to a skill ─────────────────────────────
export async function routeStrategistMessage(message: string, canvasNodes: GNode[]): Promise<{ skillId: string; reasoning: string } | null> {
    const byok = getActiveBYOKConfig();
    const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
    
    if (!apiKey) {
      const routed = keywordRoute(message) || 'red-team';
      return { skillId: routed, reasoning: `Routing to ${routed.replace('-', ' ')} via workspace heuristics.` };
    }

    const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
    const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
    const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;
    
    const { STRATEGIST_SKILLS } = await import('@/lib/skills');
    const skillList = Object.values(STRATEGIST_SKILLS).map(s => `- ${s.id}: ${s.name} – ${s.description}`).join('\n');

    const systemPrompt = `You are the Scribe Strategic Router. Select the best skill.
AVAILABLE SKILLS:
${skillList}
OUTPUT (JSON): {"skillId": string, "reasoning": string}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts: [{ text: `USER: "${message}"` }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
            })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? safeJsonParse(text) : null;
    } catch (e) { return null; }
}

// ── Strategist: Keyword fallbacks ────────────────────────────
export function keywordRoute(text: string): string | null {
    const t = text.toLowerCase();
    if (t.includes('red team') || t.includes('adversar') || t.includes('critic')) return 'red-team';
    if (t.includes('gap') || t.includes('missing') || t.includes('audit')) return 'gaps-audit';
    if (t.includes('golden path') || t.includes('trajectory') || t.includes('roadmap')) return 'golden-path';
    if (t.includes('fmea') || t.includes('failure') || t.includes('risk')) return 'fmea';
    if (t.includes('blue ocean') || t.includes('market')) return 'blue-ocean';
    if (t.includes('first principles') || t.includes('axiom')) return 'first-principles';
    return null;
}

// ── Strategist: executeMiniSwarm ─────────────────────────────
export async function executeMiniSwarm(
    node: { id: string; label: string; text?: string },
    personaPackage: any[],
    content: string
): Promise<{ title: string; summary: string; nodes: any[] } | null> {
    const byok = getActiveBYOKConfig();
    const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
    if (!apiKey) return null;

    const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
    const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
    const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;
    
    const selected = [...personaPackage].sort(() => 0.5 - Math.random()).slice(0, 4);
    const personaContext = selected.map(p => `- ${p.name} (${p.role}): ${p.prompt}`).join('\n');

    const systemInstruction = `You are a specialized Swarm Persona Engine. 
Evaluate the specific node provided from the perspectives of the 4 personas listed.
Generate ONE highly specific critique/insight per persona.

OUTPUT SCHEMA:
{
  "title": string,
  "summary": string,
  "nodes": [{ "label": string, "category": "CRITIQUE|INSIGHT|RISK|OPPORTUNITY", "summary": string, "persona": string }]
}`;

    const userMessage = `NODE TO EVALUATE: "${node.label}"\nCONTEXT: "${(node.text || '').slice(0, 500)}"\n\nPERSONAS:\n${personaContext}\n\nFULL DOCUMENT CONTEXT:\n${content.slice(0, 5000)}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? safeJsonParse(text) : null;
    } catch (e) { return null; }
}
