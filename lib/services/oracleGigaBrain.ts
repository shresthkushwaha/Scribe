import { getEffectiveGeminiKey, getActiveBYOKConfig } from '@/lib/byokStore';

export interface GigaSatellite {
  id: string;
  name: string;
  type: string;
  summary: string;
  category?: string;
  parentId?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GigaWorkbenchSession {
  id: string;
  type: 'find-problems' | 'generate-ideas' | 'summarize-branch' | 'find-connection' | 'scamper' | 'first-principles' | 'analogy' | 'pre-mortem';
  title: string;
  nodes: GigaSatellite[];
  summary: string;
  timestamp: string;
  targetNodeIds: string[]; // Which nodes were used to trigger this
  noteId?: string; // Optional specific note link
  contextKey?: string; // Hash of source content for multi-graph isolation
}

export interface GigaGhostLink {
  source: string; // Usually a satellite ID
  target: string; // A leaf, cluster, or pillar ID
  reason: string;
}

export function safeJsonParse(text: string): any {
  let cleaned = text;
  try {
    // 1. Strip markdown code blocks if present
    cleaned = cleaned.replace(/```(?:json)?\n?([\s\S]*?)```/g, '$1').trim();
    
    // 2. Locate the first '{' and last '}' to isolate the JSON object
    // This handles any conversation or extra text the LLM might have included
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found in response");
    }
    
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    
    // 3. Remove trailing commas within arrays and objects
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    
    // 4. Escape unescaped newlines inside string values
    cleaned = cleaned.replace(/\n(?=(?:[^"]*"[^"]*")*[^"]*"[^"]*$)/g, "\\n");
    
    return JSON.parse(cleaned);
  } catch (e: any) {
    console.error("❌ [Oracle Giga] JSON Parsing Failed:", e.message);
    console.error("Context [starts at 3527]:", cleaned.slice(3500, 3600));
    throw e;
  }
}

export interface GigaMapData {
  pillars: { id: string; name: string }[];
  clusters: { id: string; name: string; pillarId: string }[];
  leaves: { id: string; name: string; type: string; summary: string; clusterId: string }[];
  crossLinks: { source: string; target: string; verb: string }[];
  satellites?: GigaSatellite[];
  ghostLinks?: GigaGhostLink[];
  sessions?: GigaWorkbenchSession[];
}

export function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function getGigaMapCacheKey(content: string) {
  return `oracle_giga_v5_${cyrb53(content)}`;
}

export const PASS_1_PROMPT = `You are the Oracle Systemic Mapper, an elite architectural extraction engine for a premium intelligence tool. Your singular goal is to dissect this document into its absolute most granular, elemental 'Core Pillars' and 'Systemic Clusters'.

CRITICAL INSTRUCTION: DO NOT OVER-SUMMARIZE.
Basic AI systems compress documents into 3 or 4 broad macro-categories. You are a premium tool. You must unpack the true, sprawling complexity of the document natively.

Follow this reasoning strategy:
1. Mentally isolate EVERY distinct topic, phase, methodology, argument, or entity introduced in the text.
2. Form a unique 'Core Pillar' for EACH distinct logical branch you found. If the document covers 12 distinct methodologies or operational phases, you must generate 12 Pillars. Do not merge them.
3. For each isolated Pillar, explicitly identify its 'Systemic Clusters' (e.g., Rules, Needs, Causes, Consequences, Attributes). Allow the document's native depth to organically dictate the massive scale of the map.

You MUST output strictly valid JSON matching this schema:
{
  "pillars": [
    {
      "id": "pillar_abc",
      "name": "PILLAR NAME (Uppercase)",
      "clusters": [
        { "id": "cluster_xyz", "name": "Cluster Name" }
      ]
    }
  ]
}`;

export const PASS_2_PROMPT = `You are a premium Oracle Leaf Node Extractor. Given the document and the structural skeleton (Pillars & Clusters), extract the specific leaf nodes and their systemic cross-connections.

CRITICAL RULES:
1. Granularity is Key: Extract EXACTLY AS MANY critical, high-signal concepts per Cluster as organically exist. If a cluster contains 15 distinct technical concepts, extract all 15. Do not truncate or generalize.
2. Provide a 1-sentence analytical summary for each leaf node.
3. Identify natural 'crossLinks' connecting nodes across DIFFERENT clusters or pillars. The overall number of links should scale proportionally with the volume of nodes extracted.

You MUST output strictly valid JSON matching this schema:
{
  "leaves": [
    {
      "id": "leaf_123",
      "name": "Specific Concept",
      "type": "Action/Entity/Status",
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

export async function fetchOracleWithFallback(url: string, body: any, primaryModel: string, fallbackModel: string): Promise<any> {
  try {
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    if (res.ok) return await res.json();
    
    if (res.status === 503 || res.status === 429 || res.status === 404 || res.status === 400) {
      console.warn(`🕒 [Oracle Giga] Primary (${primaryModel}) issue (${res.status}), trying fallback (${fallbackModel})...`);
      
      const fallbackUrl = url.replace(primaryModel, fallbackModel);
      
      const safePayload = body;

      const fallbackRes = await fetch(fallbackUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safePayload)
      });
      
      if (fallbackRes.ok) return await fallbackRes.json();
      
      const fbErrText = await fallbackRes.text();
      console.error(`❌ [Oracle Giga] Fallback (${fallbackModel}) also failed:`, fallbackRes.status, fbErrText);
      throw new Error(`Fallback Failed: ${fallbackRes.status}`);
    }
    
    const errText = await res.text();
    throw new Error(`Primary Failed: ${res.status} ${errText}`);
  } catch (err) {
    throw err;
  }
}

export async function synthesizeOracleGigaMap(content: string, forceRefresh = false): Promise<GigaMapData | null> {
  console.log("🧠 [Oracle Giga] Starting Two-Pass Systemic Extraction...");
  const cacheKey = getGigaMapCacheKey(content);

  if (!forceRefresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  if (!apiKey) {
    console.info("ℹ️ [Oracle Giga] No API key found. Synthesizing instant heuristic topology from document structure.");
    return generateHeuristicGigaMap(content);
  }

  const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
  const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
  const fallback = "gemini-2.0-flash";
  const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;

  try {
    const p1Payload = {
      systemInstruction: { parts: [{ text: PASS_1_PROMPT }] },
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
      systemInstruction: { parts: [{ text: PASS_2_PROMPT }] },
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
    console.error("❌ [Oracle Giga] Pipeline Exception, falling back to heuristic map:", err);
    return generateHeuristicGigaMap(content);
  }
}

export function generateHeuristicGigaMap(content: string): GigaMapData {
  if (!content || !content.trim()) {
    return {
      pillars: [{ id: "p1", name: "Overview" }],
      clusters: [{ id: "c1", name: "Core Concepts", pillarId: "p1" }],
      leaves: [{ id: "l1", name: "Start typing to generate nodes", type: "INSIGHT", summary: "Add notes or headers to see the knowledge map expand.", clusterId: "c1" }],
      crossLinks: []
    };
  }

  const lines = content.split('\n');
  const pillars: { id: string; name: string }[] = [];
  const clusters: { id: string; name: string; pillarId: string }[] = [];
  const leaves: { id: string; name: string; type: string; summary: string; clusterId: string }[] = [];
  const crossLinks: { source: string; target: string; verb: string }[] = [];

  let currentPillarId = "p1";
  let currentClusterId = "c1";
  let pCount = 0;
  let cCount = 0;
  let lCount = 0;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
      pCount++;
      const name = trimmed.replace(/^#+\s*/, '').slice(0, 30);
      currentPillarId = `p_${pCount}`;
      pillars.push({ id: currentPillarId, name });
      
      cCount++;
      currentClusterId = `c_${cCount}`;
      clusters.push({ id: currentClusterId, name: 'Key Directives', pillarId: currentPillarId });
    }
    else if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
      if (pillars.length === 0) {
        pCount++;
        currentPillarId = `p_${pCount}`;
        pillars.push({ id: currentPillarId, name: "Core Architecture" });
      }
      cCount++;
      const name = trimmed.replace(/^#+\s*/, '').slice(0, 30);
      currentClusterId = `c_${cCount}`;
      clusters.push({ id: currentClusterId, name, pillarId: currentPillarId });
    }
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.includes('**')) {
      if (pillars.length === 0) {
        pCount++;
        currentPillarId = `p_${pCount}`;
        pillars.push({ id: currentPillarId, name: "Key Topics" });
      }
      if (clusters.length === 0) {
        cCount++;
        currentClusterId = `c_${cCount}`;
        clusters.push({ id: currentClusterId, name: "Primary Focus", pillarId: currentPillarId });
      }
      lCount++;
      const cleanText = trimmed.replace(/^[-*0-9.]+\s*/, '').replace(/[*_`]/g, '');
      const boldMatch = trimmed.match(/\*\*(.*?)\*\*/);
      const name = boldMatch ? boldMatch[1].slice(0, 28) : cleanText.slice(0, 28);
      const summary = cleanText.length > 28 ? cleanText : `${name} referenced in note.`;
      
      const leafId = `l_${lCount}`;
      leaves.push({
        id: leafId,
        name: name || `Insight ${lCount}`,
        type: 'INSIGHT',
        summary,
        clusterId: currentClusterId
      });
    }
  }

  if (pillars.length === 0 || leaves.length === 0) {
    const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (paragraphs.length > 0) {
      paragraphs.slice(0, 5).forEach((para, idx) => {
        const pId = `p_${idx + 1}`;
        const sentences = para.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
        const title = sentences[0]?.slice(0, 24) || `Section ${idx + 1}`;
        
        pillars.push({ id: pId, name: title });
        const cId = `c_${idx + 1}`;
        clusters.push({ id: cId, name: 'Synthesis', pillarId: pId });
        
        sentences.slice(0, 4).forEach((sent) => {
          lCount++;
          leaves.push({
            id: `l_${lCount}`,
            name: sent.slice(0, 24),
            type: 'INSIGHT',
            summary: sent,
            clusterId: cId
          });
        });
      });
    }
  }

  if (pillars.length === 0) {
    pillars.push({ id: "p1", name: "Core Ideas" });
  }
  if (clusters.length === 0) {
    clusters.push({ id: "c1", name: "Primary Observations", pillarId: pillars[0].id });
  }
  if (leaves.length === 0) {
    leaves.push({
      id: "l1",
      name: content.slice(0, 24) || "Insight Node",
      type: "INSIGHT",
      summary: content.slice(0, 100) || "Conceptual anchor from note.",
      clusterId: clusters[0].id
    });
  }

  if (leaves.length > 1) {
    for (let i = 0; i < leaves.length - 1; i++) {
      if (leaves[i].clusterId !== leaves[i + 1].clusterId || i % 2 === 0) {
        crossLinks.push({
          source: leaves[i].id,
          target: leaves[i + 1].id,
          verb: i % 3 === 0 ? "influences" : i % 3 === 1 ? "derives from" : "reinforces"
        });
      }
    }
  }

  return { pillars, clusters, leaves, crossLinks };
}

export async function askWorkbenchOracle(
  action: 'find-problems' | 'generate-ideas' | 'summarize-branch' | 'find-connection' | 'scamper' | 'first-principles' | 'analogy' | 'pre-mortem',
  selectedNodesInfo: any[],
  documentContext: string
): Promise<GigaWorkbenchSession | null> {
  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  if (!apiKey) return null;

  const nodeContext = JSON.stringify(selectedNodesInfo, null, 2);

  let prompt = '';
  if (action === 'find-connection') {
    prompt = `You are a systemic analyst. Analyze these specific nodes: ${nodeContext}. 
      Find deep, non-obvious relationships or friction points between them.
      Output strictly JSON: { "title": "Connection Analysis", "summary": "1-2 sentence overview", "nodes": [{ "id": "uuid", "name": "Phrase", "type": "connection", "summary": "Full detail" }] }`;
  } else if (action === 'find-problems') {
    prompt = `You are a critical strategist. Analyze this node: ${nodeContext}. 
      Identify 4-5 systemic problems or catastrophic risks.
      Output strictly JSON: { "title": "Systemic Risks", "summary": "1-2 sentence overview", "nodes": [{ "id": "uuid", "name": "Risk Name", "type": "problem", "summary": "Full detail" }] }`;
  } else if (action === 'generate-ideas') {
    prompt = `You are an innovation architect. Analyze this node: ${nodeContext}. 
      Generate 5 radical, divergent ideas.
      Output strictly JSON: { "title": "Innovation Lab", "summary": "1-2 sentence overview", "nodes": [{ "id": "uuid", "name": "Idea Name", "type": "idea", "summary": "Full detail" }] }`;
  } else if (action === 'scamper') {
    prompt = `You are a creative mastermind. Perform a FULL SCAMPER mutation on: ${nodeContext}. 
      You MUST generate a 3-level hierarchy for EACH of the 7 SCAMPER techniques.
      Level 1: The Hub (scamper:TITLE)
      Level 2: The Technique Node (e.g., "Adapt")
      Level 3: The Description Node (The specific mutation insight)
      
      IMPORTANT: Ensure the output is STRICTLY valid JSON. No trailing commas. Escape all quotes and newlines within strings.
      
      Output strictly JSON: { 
        "title": "SCAMPER: ${selectedNodesInfo[0]?.name || 'Concept'}", 
        "summary": "Synthesize how these 7 mutations fundamentally re-architect the concept.", 
        "nodes": [
          { "id": "t1", "name": "Substitute", "type": "idea", "summary": "Substitution" },
          { "id": "d1", "name": "DESC: [Specific substitution idea]", "type": "summary", "summary": "Full detail", "parentId": "t1" },
          { "id": "t2", "name": "Combine", "type": "idea", "summary": "Combination" },
          { "id": "d2", "name": "DESC: [Specific combination idea]", "type": "summary", "summary": "Full detail", "parentId": "t2" },
          { "id": "t3", "name": "Adapt", "type": "idea", "summary": "Adaptation" },
          { "id": "d3", "name": "DESC: [Specific adaptation idea]", "type": "summary", "summary": "Full detail", "parentId": "t3" },
          { "id": "t4", "name": "Modify", "type": "idea", "summary": "Modification" },
          { "id": "d4", "name": "DESC: [Specific modification idea]", "type": "summary", "summary": "Full detail", "parentId": "t4" },
          { "id": "t5", "name": "Put to other uses", "type": "idea", "summary": "Alternative Use" },
          { "id": "d5", "name": "DESC: [Specific alternative use idea]", "type": "summary", "summary": "Full detail", "parentId": "t5" },
          { "id": "t6", "name": "Eliminate", "type": "idea", "summary": "Elimination" },
          { "id": "d6", "name": "DESC: [Specific elimination idea]", "type": "summary", "summary": "Full detail", "parentId": "t6" },
          { "id": "t7", "name": "Reverse", "type": "idea", "summary": "Reversion" },
          { "id": "d7", "name": "DESC: [Specific reversal idea]", "type": "summary", "summary": "Full detail", "parentId": "t7" }
        ] 
      }`;
  } else if (action === 'first-principles') {
    prompt = `You are a philosophical engineer. Deconstruct this concept into its First Principles: ${nodeContext}.
      Identify 4 core, irreducible truths.
      Output strictly JSON: { "title": "First Principles", "summary": "How these truths form the absolute foundation of the concept.", "nodes": [{ "id": "uuid", "name": "Irreducible Truth", "type": "summary", "summary": "Explain why this is fundamental." }] }`;
  } else if (action === 'analogy') {
    prompt = `You are a cross-domain thinker. Find 4 powerful analogies from unrelated fields (Biolody, Physics, Music, Warfare, Architecture) for: ${nodeContext}.
      Output strictly JSON: { "title": "Analogical Mapping", "summary": "How these cross-domain patterns reveal new strategies.", "nodes": [{ "id": "uuid", "name": "Analogy", "type": "idea", "summary": "Explain the insight." }] }`;
  } else if (action === 'pre-mortem') {
    prompt = `You are a visionary defeatist. Assume this FAILED in 2 years. Identify 3 distinct failure vectors for: ${nodeContext}.
      Output strictly JSON: { "title": "Pre-Mortem Analysis", "summary": "The singular thesis on why this was doomed.", "nodes": [{ "id": "uuid", "name": "Failure Vector", "type": "problem", "summary": "Detailed failure case." }] }`;
  } else if (action === 'summarize-branch') {
    prompt = `You are a synthesizer. Condense this branch: ${nodeContext}. 
      Output strictly JSON: { "title": "Strategic Thesis", "summary": "The overall conclusion.", "nodes": [{ "id": "uuid", "name": "Key Insight", "type": "summary", "summary": "Specific actionable takeaway." }] }`;
  }

  const primary = "gemini-3.1-flash-lite-preview";
  const fallback = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${primary}:generateContent?key=${apiKey}`;

  try {
    const payload = {
      systemInstruction: { parts: [{ text: prompt }] },
      contents: [{ role: "user", parts: [{ text: `Context:\n${documentContext.substring(0, 15000)}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
    };
    
    const data = await fetchOracleWithFallback(url, payload, primary, fallback);
    const result = safeJsonParse(data.candidates[0].content.parts[0].text);
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: action,
      title: result.title,
      nodes: result.nodes,
      summary: result.summary,
      timestamp: new Date().toISOString(),
      targetNodeIds: selectedNodesInfo.map(n => n.id)
    };
  } catch (e) {
    console.error("Workbench Oracle Error:", e);
    return null;
  }
}
