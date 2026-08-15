import { GigaWorkbenchSession, fetchOracleWithFallback, safeJsonParse } from './oracleGigaBrain';
import { getAllWorkspaces } from './scribeV2Db';
import { getEffectiveGeminiKey, getActiveBYOKConfig } from '@/lib/byokStore';

export interface SwampPersona {
  id: string;
  name: string;
  role: string;
  bias: string;
  prompt: string;
  critique?: string;
  x?: number;
  y?: number;
}

export interface SwampAnchor {
  name: string;
  weight: number;
  x: number;
  y: number;
}

export interface SwampSession {
  id: string;
  targetNoteId: string;
  packageName: string;
  title: string;
  summary: string;
  personas: SwampPersona[];
  anchors: SwampAnchor[];
  epicenter: {
    label: string;
    description: string;
    x: number;
    y: number;
  };
  timestamp: string;
}

const SYSTEM_PROMPT_CRITIQUE = `You are a Swarm of 30 specialized AI experts tasked with pressure-testing an idea.
You will be provided with:
1. A TARGET NOTE to evaluate.
2. PROJECT CONTEXT (Summaries of other notes and previous Oracle insights).
3. A list of 30 PERSONA definitions.

YOUR TASK:
Generate a concise, high-fidelity critique for EACH of the 30 personas. 
Each critique must be 2-3 sentences max and reflect the specific bias and role of that persona.
Consider how the TARGET NOTE interacts with the PROJECT CONTEXT (contradictions, gaps, or risks).

OUTPUT FORMAT:
Return a JSON array of objects:
[
  { "id": "persona_id", "critique": "The specific expert critique..." }
]`;

const SYSTEM_PROMPT_SPATIAL = `You are a Spatial Intelligence Engine. You are given 30 expert critiques of a document.
YOUR TASK:
1. Spatial Synthesis: Map these 30 personas on a 2D coordinate plane (x, y from -500 to 500).
2. The Force Field: Use 'Semantic Distance'. Place similar concerns near each other. Place fundamental disagreements on opposite sides.
3. Topographic Anchors: Identify the 3 strongest 'Centers of Gravity' (discussed themes). Give them a Name and a Weight (1-10). Assign them coordinates (x, y).
4. The Pulse: Identify the 'Epicenter'—the exact point in the document where the most intense disagreement occurs. Provide a label and a short description.

OUTPUT FORMAT:
Return strictly JSON:
{
  "personas": [ { "id": "persona_id", "x": 123, "y": -45 } ],
  "anchors": [ { "name": "Theme Name", "weight": 8, "x": -200, "y": 100 } ],
  "epicenter": { "label": "The Conflict Point", "description": "Short explanation", "x": 10, "y": 20 }
}`;

async function getProjectContext() {
  const workspaces = await getAllWorkspaces();
  // Aggregate summaries from all workspaces
  const noteSummaries = workspaces.flatMap(ws => 
    ws.blocks.filter(b => b.type === 'dataset' && b.data?.summary).map(b => b.data.summary)
  );
  const oracleInsights = workspaces.flatMap(ws => 
    (ws.oracleSessions || []).map(s => s.summary)
  );
  
  return {
    notes: noteSummaries.slice(0, 20).join('\n---\n'), // Limit for context window
    insights: oracleInsights.slice(0, 10).join('\n---\n')
  };
}

export async function generateSwampSession(
  targetNoteId: string,
  targetNoteContent: string,
  packageName: string,
  personas: SwampPersona[]
): Promise<SwampSession | null> {
  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  if (!apiKey) {
    // Generate heuristic simulated swamp personas when offline/no key
    const mockedPersonas = personas.slice(0, 12).map((p, idx) => ({
      ...p,
      critique: `Adversarial stress-test analysis for ${targetNoteContent.slice(0, 40)}: Questioning core assumptions on scalability and edge resilience.`,
      x: (Math.cos((idx / 12) * 2 * Math.PI) * 400),
      y: (Math.sin((idx / 12) * 2 * Math.PI) * 400),
    }));
    return {
      id: `swamp-${Date.now()}`,
      targetNoteId,
      packageName,
      title: `Swamp Audit: ${packageName.toUpperCase()}`,
      summary: "Heuristic Stress-Test: Key vulnerability lies in systemic interdependencies across conceptual pillars.",
      personas: mockedPersonas,
      anchors: [
        { name: "Resilience", weight: 0.8, x: -200, y: -200 },
        { name: "Velocity", weight: 0.7, x: 200, y: -200 },
        { name: "Feasibility", weight: 0.9, x: 0, y: 250 },
      ],
      epicenter: {
        label: "Strategic Hypothesis",
        description: targetNoteContent.slice(0, 80),
        x: 0,
        y: 0
      },
      timestamp: new Date().toISOString()
    };
  }

  const context = await getProjectContext();
  const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
  const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview"; 
  const fallback = "gemini-2.5-flash"; 
  const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;

  try {
    // Stage 1: The Swarm (using Gemini 3.1 for critiques)
    console.log("🌪️ [Swamp] Stage 1: Generating 30 Expert Critiques...");
    const swarmPayload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_CRITIQUE }] },
      contents: [{
        role: "user",
        parts: [{
          text: `
          TARGET NOTE:
          ${targetNoteContent}
          
          PROJECT CONTEXT:
          Notes: ${context.notes}
          Oracle Insights: ${context.insights}
          
          PERSONAS:
          ${JSON.stringify(personas.map(p => ({ id: p.id, role: p.role, bias: p.bias, prompt: p.prompt })))}
          `
        }]
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
    };

    const swarmData = await fetchOracleWithFallback(url, swarmPayload, primary, fallback);
    
    if (!swarmData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("❌ [Swarm] Stage 1 API Error (Empty response):", swarmData);
      throw new Error(`Stage 1 failed: No candidates returned`);
    }
    const critiques = safeJsonParse(swarmData.candidates[0].content.parts[0].text);

    // Merge critiques back into personas
    const critiquedPersonas = personas.map(p => {
      const c = critiques.find((item: any) => item.id === p.id);
      return { ...p, critique: c?.critique || "Unable to generate critique." };
    });

    // Stage 2: Spatial Synthesis (using Gemini 3.1 Flash Lite)
    console.log("🗺️ [Swamp] Stage 2: Topographic Synthesis & Spatial Mapping...");
    const spatialPayload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_SPATIAL }] },
      contents: [{
        role: "user",
        parts: [{
          text: `Critiques to map:\n${JSON.stringify(critiquedPersonas.map(p => ({ id: p.id, critique: p.critique })))}`
        }]
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    };

    const spatialData = await fetchOracleWithFallback(url, spatialPayload, primary, fallback);

    if (!spatialData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("❌ [Swarm] Stage 2 API Error:", spatialData);
      throw new Error(`Stage 2 failed: No candidates returned`);
    }
    const spatialJson = safeJsonParse(spatialData.candidates[0].content.parts[0].text);

    // Build the final session
    const mappedPersonas = critiquedPersonas.map(p => {
      const coords = spatialJson.personas.find((sj: any) => sj.id === p.id);
      return { ...p, x: coords?.x || 0, y: coords?.y || 0 };
    });

    return {
      id: Math.random().toString(36).substring(2, 11),
      targetNoteId,
      packageName,
      title: `Project Stress-Test: ${packageName}`,
      summary: `A high-fidelity simulation of 30 expert personas reveals an epicenter of friction at '${spatialJson.epicenter.label}'.`,
      personas: mappedPersonas,
      anchors: spatialJson.anchors,
      epicenter: spatialJson.epicenter,
      timestamp: new Date().toISOString()
    };

  } catch (e) {
    console.error("❌ [Swamp] Failure in AI Pipeline:", e);
    return null;
  }
}
