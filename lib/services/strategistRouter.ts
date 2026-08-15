import { STRATEGIST_SKILLS } from '../skills';
import { fetchOracleWithFallback, safeJsonParse } from './oracleGigaBrain';
import { getEffectiveGeminiKey, getActiveBYOKConfig } from '@/lib/byokStore';

export interface StrategistIntent {
  skillId: string;
  reasoning: string;
  targetNodes: string[];
  parameters?: Record<string, any>;
}

export interface StrategistResponse {
  skillId: string;
  text: string;
  executionData?: any;
}

const META_ROUTER_PROMPT = `You are the Scribe Meta-Router. Your job is to understand the user's intent and select the optimal 'Strategist Skill' from the available library.
You have access to the current WORKSPACE STATE (nodes and connections).

AVAILABLE SKILLS:
${Object.values(STRATEGIST_SKILLS).map(s => `- ${s.id}: ${s.name} - ${s.description}`).join('\n')}

DIRECTIONS:
1. Analyze the USER MESSAGE.
2. Determine which SKILL is most appropriate.
3. Identify which existing NODES or TOPICS are relevant to this intent.
4. Explain WHY you chose this skill in a brief, transparent sentence.

OUTPUT FORMAT (Strict JSON):
{
  "skillId": "the-skill-id",
  "reasoning": "I am applying a '...' audit because...",
  "targetNodes": ["node_id_1", "node_id_2"]
}`;

export async function analyzeStrategistIntent(
  message: string,
  workspaceContext: any
): Promise<StrategistIntent | null> {
  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  
  if (!apiKey) {
    const t = message.toLowerCase();
    let skillId = 'red-team';
    if (t.includes('gap') || t.includes('missing')) skillId = 'gaps-audit';
    else if (t.includes('path') || t.includes('plan')) skillId = 'golden-path';
    else if (t.includes('market') || t.includes('blue ocean')) skillId = 'blue-ocean';
    else if (t.includes('first principle')) skillId = 'first-principles';
    
    return {
      skillId,
      reasoning: `Selected ${skillId.replace('-', ' ')} protocol via workspace heuristics.`,
      targetNodes: (workspaceContext?.blocks || []).slice(0, 3).map((b: any) => b.id)
    };
  }

  const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
  const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
  const fallback = "gemini-2.5-flash";
  const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;

  try {
    const payload = {
      systemInstruction: { parts: [{ text: META_ROUTER_PROMPT }] },
      contents: [{
        role: "user",
        parts: [{
          text: `USER MESSAGE: "${message}"\n\nWORKSPACE CONTEXT:\n${JSON.stringify({
            blocks: (workspaceContext.blocks || []).map((b: any) => ({ id: b.id, name: b.name, type: b.type })),
            connections: workspaceContext.connections
          })}`
        }]
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    };

    const data = await fetchOracleWithFallback(url, payload, primary, fallback);
    const result = safeJsonParse(data.candidates[0].content.parts[0].text);
    return result;
  } catch (err) {
    console.error("Strategist Meta-Router Error:", err);
    return null;
  }
}

export async function executeStrategistSkill(
  skillId: string,
  intent: StrategistIntent,
  workspaceContext: any
): Promise<StrategistResponse | null> {
  const skill = STRATEGIST_SKILLS[skillId];
  if (!skill) return null;

  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  
  if (!apiKey) {
    return {
      skillId,
      text: intent.reasoning,
      executionData: {
        title: skill.name,
        summary: `Heuristic strategic synthesis executed for ${skillId}.`,
        nodes: [
          { name: 'Core Finding', type: 'insight', summary: 'Primary structural anchor.' },
          { name: 'Critical Gap', type: 'risk', summary: 'Unresolved assumption.' }
        ]
      }
    };
  }

  const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
  const primary = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : "gemini-3.1-flash-lite-preview";
  const fallback = "gemini-2.5-flash";
  const url = `${baseURL}/v1beta/models/${primary}:generateContent?key=${apiKey}`;

  try {
    const payload = {
      systemInstruction: { parts: [{ text: skill.systemPrompt }] },
      contents: [{
        role: "user",
        parts: [{
          text: `INTENT REASONING: ${intent.reasoning}\nTARGET NODES: ${intent.targetNodes.join(', ')}\n\nFULL WORKSPACE CONTEXT:\n${JSON.stringify(workspaceContext)}`
        }]
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
    };

    const data = await fetchOracleWithFallback(url, payload, primary, fallback);
    const resultText = data.candidates[0].content.parts[0].text;
    const executionData = safeJsonParse(resultText);

    return {
      skillId,
      text: intent.reasoning,
      executionData
    };
  } catch (err) {
    console.error(`Skill Execution Error (${skillId}):`, err);
    return null;
  }
}
