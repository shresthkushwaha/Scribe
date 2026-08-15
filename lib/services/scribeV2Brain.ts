import { LENS_DICTIONARY } from '../v2/lenses.config';
import { getAllNotes } from '../db';
import { V2Block } from './scribeV2Db';
import { getEffectiveGeminiKey, getActiveBYOKConfig } from '@/lib/byokStore';

export interface GraphData {
  hubs?: Array<{ id: string; name: string; color?: string }>;
  nodes: Array<{ 
    id: string; 
    label: string; 
    summary: string;
    source_snippet: string;
    name?: string; 
    type?: string; 
    hubId?: string;
    role?: string;
  }>;
  edges: Array<{ 
    source: string; 
    target: string; 
    verb?: string; 
    type?: string;
  }>;
}

const BASE_SYSTEM_INSTRUCTION = `You are the 'Oracle Lens' synthesis engine. Your goal is to find the natural architecture hidden in the provided text and represent it as a knowledge graph.

CRITICAL RULES:
1. DISCOVER THEMES: Identify 3-4 natural thematic anchors (hubs) specific to the content (e.g., 'Cognitive Pathways', 'Materiality'). Avoid generic labels.
2. EXTRACT CONCEPTS: Extract 8-12 concrete nodes and link them to these themes.
3. ONE-SHOT PAYLOAD: For every node, include a 'summary' (one-sentence executive summary) and a 'source_snippet' (the exact text evidence).
4. AVOID CATEGORIES: Never use generic labels like 'Feature' or 'Constraint' for node types unless they are the most descriptive words for that specific context.
5. RELATIONSHIPS: Every edge MUST have a descriptive 'verb' (e.g., 'causes', 'prevents', 'requires').`;

/**
 * Fast, simple 53-bit hash for string fingerprinting.
 */
function cyrb53(str: string, seed = 0) {
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

function getCacheKey(userPrompt: string, systemPrompt: string): string {
    const combined = `${systemPrompt}|${userPrompt}`;
    return `scribe_graph_${cyrb53(combined)}`;
}

export async function synthesizeLens(block: V2Block, inputBlocks: V2Block[], forceRefresh = false): Promise<GraphData | null> {
  if (!block.configId) return null;
  const lens = LENS_DICTIONARY[block.configId];
  if (!lens) return null;

  console.log(`🧠 [Brain] Starting synthesis for lens: ${lens.name}`);

  let aggregateContent = "";
  for (const input of inputBlocks) {
    if (input.name === 'Local Store') {
      const notes = await getAllNotes();
      aggregateContent += `[SOURCE: LOCAL_DB]\n${notes.map(n => n.body).join('\n---\n')}\n\n`;
    } else if (input.name === 'External Injector') {
      aggregateContent += `[SOURCE: EXTERNAL_FILE]\n${input.data?.rawContent || "No external content loaded."}\n\n`;
    } else if (input.data) {
      aggregateContent += `[SOURCE: PREVIOUS_LENS]\n${JSON.stringify(input.data)}\n\n`;
    }
  }

  const systemPrompt = `${BASE_SYSTEM_INSTRUCTION}\n\nSpecific Lens Context: ${lens.systemPrompt}`;
  const userPrompt = `Synthesize the following aggregated data sources:\n\n${aggregateContent}`;

  return callGeminiAutonomousSynthesis(userPrompt, systemPrompt, forceRefresh);
}

/**
 * Generic synthesis for V1 Graph integration.
 */
export async function summarizeConcepts(content: string, systemPrompt: string, forceRefresh = false): Promise<GraphData | null> {
  console.log("🧠 [Brain] Starting generic concept synthesis...");
  
  const unifiedSystemPrompt = `${BASE_SYSTEM_INSTRUCTION}\n\n${systemPrompt}`;
  const userPrompt = `Source Data:\n${content}`;

  return callGeminiAutonomousSynthesis(userPrompt, unifiedSystemPrompt, forceRefresh);
}

/**
 * Internal helper for Gemini 3.1 Flash Lite Autonomous Synthesis.
 */
async function callGeminiAutonomousSynthesis(userPrompt: string, systemPrompt: string, forceRefresh = false): Promise<GraphData | null> {
  try {
    const cacheKey = getCacheKey(userPrompt, systemPrompt);

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          console.log("💎 [Brain] Cache Hit! Serving existing graph.");
          return parsed;
        } catch (e) {
          console.warn("⚠️ [Brain] Failed to parse cached graph. Regenerating...");
        }
      }
    }

    const byok = getActiveBYOKConfig();
    const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
    if (!apiKey) {
      console.warn("⚠️ [Brain] No Gemini API key found. Falling back to mock data.");
      return generateMockGraph();
    }

    const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
    const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
    const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        hubs: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              name: { type: "STRING" }
            },
            required: ["id", "name"]
          }
        },
        nodes: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              label: { type: "STRING" },
              summary: { type: "STRING" },
              source_snippet: { type: "STRING" },
              hubId: { type: "STRING" },
              type: { type: "STRING" }
            },
            required: ["id", "label", "summary", "source_snippet", "hubId"]
          }
        },
        edges: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              source: { type: "STRING" },
              target: { type: "STRING" },
              verb: { type: "STRING" }
            },
            required: ["source", "target", "verb"]
          }
        }
      },
      required: ["hubs", "nodes", "edges"]
    };

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: "medium" }
      }
    };

    let response: Response | undefined;
    const maxRetries = 2; // Total 3 attempts
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) break;

        // Retry on 503 (High Demand) or 429 (Rate Limit)
        if (i < maxRetries && (response.status === 503 || response.status === 429)) {
          const waitTime = Math.pow(2, i + 1) * 1000;
          console.warn(`⚠️ [Brain] Gemini API busy (${response.status}). Retrying in ${waitTime}ms (Attempt ${i + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        const errorBody = await response.text();
        console.error(`❌ [Brain] Gemini API error (${response.status}):`, errorBody);
        return generateMockGraph();
      } catch (e) {
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        console.error("❌ [Brain] Network error during synthesis:", e);
        return generateMockGraph();
      }
    }

    if (!response || !response.ok) return generateMockGraph();

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textResponse) {
      const parsed = JSON.parse(textResponse) as GraphData;
      console.log("✅ [Brain] Synthesis successful. Nodes:", parsed.nodes?.length);
      
      // Save to cache
      const cacheKey = getCacheKey(userPrompt, systemPrompt);
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
      
      return parsed;
    }
  } catch (error) {
    console.error("❌ [Brain] Autonomous synthesis failed:", error);
  }

  return generateMockGraph();
}

function generateMockGraph(): GraphData {
  return {
    hubs: [
      { id: 'hub-1', name: 'Strategic Goals', color: '#ff4d00' },
      { id: 'hub-2', name: 'Technical Debt', color: '#00e5ff' }
    ],
    nodes: [
      { id: 'n-1', label: 'Migrate to V2', summary: 'Transition core logic to Scribe V2 architecture.', source_snippet: 'We need to move to V2.', hubId: 'hub-1', type: 'Strategy' },
      { id: 'n-2', label: 'ZUI Performance', summary: 'Optimize zoomable interface for large graphs.', source_snippet: 'Performance is key for ZUI.', hubId: 'hub-1', type: 'Optimization' },
      { id: 'n-3', label: 'Legacy D3 Bloat', summary: 'Reduce overhead from old d3-force implementations.', source_snippet: 'Remove old D3 code.', hubId: 'hub-2', type: 'Legacy' }
    ],
    edges: [
      { source: 'n-1', target: 'n-2', verb: 'enables' },
      { source: 'n-3', target: 'n-1', verb: 'impedes' }
    ]
  };
}
