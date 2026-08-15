/**
 * Chat Graph Engine: Handles conversational queries on graph context and transforms
 * chat responses into interactive nodes & connections connected to the main graph.
 */

import { getEffectiveGeminiKey, getActiveBYOKConfig } from '@/lib/byokStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  graphGenerated?: boolean;
}

export interface ExtractedGraphPayload {
  nodes: Array<{
    id: string;
    label: string;
    type?: string;
    summary?: string;
    category?: string;
    color?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    verb?: string;
  }>;
  mainConnections: Array<{
    targetMainNodeId?: string;
    targetMainNodeLabel?: string;
    sourceChatNodeId: string;
    verb: string;
  }>;
}

/**
 * Ask the Graph Chatbot with full context from the active notes and graph nodes.
 */
export async function askGraphChatbot(
  messages: Array<{ role: string; content: string }>,
  graphContext: {
    title: string;
    content: string;
    nodeLabels: string[];
    activeNodeLabel?: string;
  }
): Promise<string> {
  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  const model = byok?.preferredModel || 'gemini-2.5-flash';
  const userQuery = messages[messages.length - 1]?.content || '';

  const systemPrompt = `You are the Scribe Knowledge Graph Intelligence Assistant.
You are embedded directly inside an interactive knowledge graph workspace.

CURRENT GRAPH CONTEXT:
- Document / Topic Title: "${graphContext.title || 'Untitled Knowledge Base'}"
${graphContext.activeNodeLabel ? `- Focused / Selected Node: "${graphContext.activeNodeLabel}"` : ''}
- Existing Key Concepts / Nodes in Graph: ${graphContext.nodeLabels.slice(0, 30).join(', ') || 'None yet'}
- Background Content Excerpt:
${(graphContext.content || '').slice(0, 4000)}

GOAL:
Provide clear, structured, and insightful answers to the user's questions or requests.
Break down complex ideas into actionable concepts, risks, pathways, or implications that could naturally form new nodes in their knowledge graph. Keep the tone sharp, analytical, and constructive.`;

  if (!apiKey) {
    // Helpful local fallback if API key is not configured
    return generateFallbackChatResponse(userQuery, graphContext);
  }

  try {
    const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
    const effectiveModel = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : 'gemini-2.5-flash';
    const url = `${baseURL}/v1beta/models/${effectiveModel}:generateContent?key=${apiKey}`;

    const formattedContents = [
      ...messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: userQuery }] },
    ];

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: formattedContents,
      generationConfig: {
        temperature: 0.3,
        thinkingConfig: { thinkingLevel: 'medium' },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('Gemini chat API call failed, using fallback:', response.status);
      return generateFallbackChatResponse(userQuery, graphContext);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return replyText || generateFallbackChatResponse(userQuery, graphContext);
  } catch (err) {
    console.error('Error calling Gemini chat API:', err);
    return generateFallbackChatResponse(userQuery, graphContext);
  }
}

/**
 * Converts a chatbot text response into structured graph nodes and edges
 * that link to the main graph's existing nodes.
 */
export async function convertChatResponseToGraph(
  chatResponse: string,
  graphContext: {
    title: string;
    existingNodes: Array<{ id: string; label: string }>;
    activeNodeId?: string;
  }
): Promise<ExtractedGraphPayload> {
  const byok = getActiveBYOKConfig();
  const apiKey = (byok?.value && byok.value !== 'local-no-key') ? byok.value : getEffectiveGeminiKey();
  const model = byok?.preferredModel?.startsWith('gemini') ? byok.preferredModel : 'gemini-2.5-flash';

  if (apiKey) {
    try {
      const baseURL = byok?.baseURL || 'https://generativelanguage.googleapis.com';
      const url = `${baseURL}/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const prompt = `Extract all key atomic concepts, sub-points, actionable steps, risks, and insights from this assistant text response (generate 6 to 16 comprehensive nodes to represent the full depth of the response) and structure them as a knowledge graph that connects back to the main document graph.

EXISTING MAIN GRAPH NODES:
${graphContext.existingNodes.slice(0, 30).map((n) => `- [${n.id}] ${n.label}`).join('\n')}

ASSISTANT RESPONSE TO CONVERT:
${chatResponse}

Extract concise, high-signal nodes with a 1-sentence summary, category ('INSIGHT' | 'RISK' | 'OPPORTUNITY' | 'PATH' | 'CONCEPT'), and create logical links between these new nodes AND to at least one relevant existing main graph node.`;

      const responseSchema = {
        type: 'OBJECT',
        properties: {
          nodes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                label: { type: 'STRING' },
                summary: { type: 'STRING' },
                category: { 
                  type: 'STRING', 
                  enum: ['INSIGHT', 'RISK', 'OPPORTUNITY', 'PATH', 'ACTION', 'STRATEGY', 'FRAMEWORK', 'PRINCIPLE', 'SOLUTION', 'CRITIQUE', 'METRIC', 'QUESTION', 'DATA', 'CONCEPT'] 
                },
              },
              required: ['id', 'label', 'summary', 'category'],
            },
          },
          edges: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                source: { type: 'STRING' },
                target: { type: 'STRING' },
                verb: { type: 'STRING' },
              },
              required: ['source', 'target', 'verb'],
            },
          },
          mainConnections: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                sourceChatNodeId: { type: 'STRING' },
                targetMainNodeId: { type: 'STRING' },
                verb: { type: 'STRING' },
              },
              required: ['sourceChatNodeId', 'targetMainNodeId', 'verb'],
            },
          },
        },
        required: ['nodes', 'edges', 'mainConnections'],
      };

      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText) as ExtractedGraphPayload;
          if (parsed.nodes && parsed.nodes.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Gemini structured extraction failed, using heuristic extractor:', e);
    }
  }

  // Robust Heuristic Extractor Fallback
  return fallbackHeuristicExtract(chatResponse, graphContext);
}

function inferCategory(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('risk') || l.includes('vulnerability') || l.includes('flaw') || l.includes('threat') || l.includes('bottleneck')) return 'RISK';
  if (l.includes('mitigat') || l.includes('solution') || l.includes('fix') || l.includes('resolve')) return 'SOLUTION';
  if (l.includes('action') || l.includes('step') || l.includes('task') || l.includes('execute')) return 'ACTION';
  if (l.includes('opportunit') || l.includes('growth') || l.includes('benefit') || l.includes('advantage')) return 'OPPORTUNITY';
  if (l.includes('strateg') || l.includes('plan') || l.includes('anchor') || l.includes('objective') || l.includes('driver')) return 'STRATEGY';
  if (l.includes('framework') || l.includes('model') || l.includes('architect') || l.includes('structure')) return 'FRAMEWORK';
  if (l.includes('path') || l.includes('roadmap') || l.includes('horizon') || l.includes('milestone')) return 'PATH';
  if (l.includes('metric') || l.includes('kpi') || l.includes('measure') || l.includes('benchmark')) return 'METRIC';
  if (l.includes('question') || l.includes('probe') || l.includes('inquiry')) return 'QUESTION';
  if (l.includes('critique') || l.includes('challenge')) return 'CRITIQUE';
  if (l.includes('principle') || l.includes('rule') || l.includes('standard')) return 'PRINCIPLE';
  if (l.includes('implication') || l.includes('consequence') || l.includes('impact')) return 'IMPLICATION';
  return 'INSIGHT';
}

/**
 * Intelligent regex/heuristic extractor that parses headers, bullet points,
 * and key sentences into a connected graph.
 */
function fallbackHeuristicExtract(
  text: string,
  graphContext: {
    title: string;
    existingNodes: Array<{ id: string; label: string }>;
    activeNodeId?: string;
  }
): ExtractedGraphPayload {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const rawItems: Array<{ label: string; summary: string }> = [];

  for (const line of lines) {
    // Match markdown bullets like "- **Concept**: description" or "1. Concept: description"
    const bulletMatch = line.match(/^[-*•\d.]+\s*(?:\*\*([^*]+)\*\*|__([^_]+)__|([^:]+))[:\-–—]\s*(.*)$/);
    if (bulletMatch) {
      const label = (bulletMatch[1] || bulletMatch[2] || bulletMatch[3]).trim().slice(0, 45);
      const summary = bulletMatch[4].trim();
      if (label && label.length > 2) {
        rawItems.push({ label, summary: summary || label });
      }
    } else if (line.startsWith('###') || line.startsWith('##')) {
      const headerText = line.replace(/^#+\s*/, '').trim();
      if (headerText.length > 2) {
        rawItems.push({ label: headerText.slice(0, 45), summary: headerText });
      }
    }
  }

  // If no bullets found, split by sentences
  if (rawItems.length === 0) {
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && s.length < 250)
      .slice(0, 14);

    sentences.forEach((s) => {
      const words = s.split(' ');
      const label = words.slice(0, 4).join(' ');
      rawItems.push({ label, summary: s });
    });
  }

  if (rawItems.length === 0) {
    rawItems.push({
      label: text.slice(0, 35) + '...',
      summary: text.slice(0, 150),
    });
  }

  const selectedItems = rawItems.slice(0, 18);
  
  const nodes = selectedItems.map((item, idx) => ({
    id: `chat-node-${Date.now()}-${idx}`,
    label: item.label,
    summary: item.summary,
    category: inferCategory(item.label),
  }));

  // Inter-node links
  const edges: Array<{ source: string; target: string; verb: string }> = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      source: nodes[i].id,
      target: nodes[i + 1].id,
      verb: i % 3 === 0 ? 'leads to' : i % 3 === 1 ? 'reinforces' : 'mitigates',
    });
  }

  // Connect to main graph
  const mainConnections: Array<{ sourceChatNodeId: string; targetMainNodeId: string; verb: string }> = [];
  const targetMain = graphContext.activeNodeId
    ? graphContext.existingNodes.find((n) => n.id === graphContext.activeNodeId)
    : graphContext.existingNodes[0];

  if (targetMain && nodes.length > 0) {
    mainConnections.push({
      sourceChatNodeId: nodes[0].id,
      targetMainNodeId: targetMain.id,
      verb: 'extends',
    });
    if (nodes.length > 4) {
      mainConnections.push({
        sourceChatNodeId: nodes[Math.floor(nodes.length / 2)].id,
        targetMainNodeId: targetMain.id,
        verb: 'influences',
      });
    }
  }

  return { nodes, edges, mainConnections };
}

function generateFallbackChatResponse(
  query: string,
  graphContext: { title: string; content: string; nodeLabels: string[] }
): string {
  const topic = graphContext.title || 'the current knowledge base';
  return `### Comprehensive Strategic Analysis for ${topic}

Detailed breakdown addressing: *"${query}"*

- **Core Strategic Anchor**: Establish a structured foundational architecture to unify primary pillars and reduce cognitive friction.
- **Primary Leverage Driver**: Target high-resonance concept nodes (${graphContext.nodeLabels.slice(0, 2).join(', ') || 'core principles'}) for exponential capability expansion.
- **Critical Risk & Vulnerability**: Sub-systems may drift into isolated silos without continuous bidirectional synchronization.
- **Mitigation Protocol**: Implement automated cross-validation loops to audit semantic consistency across all sub-branches.
- **Technical Enabler**: Leverage modular interface patterns to accelerate rapid synthesis and deployment.
- **Operational Pathway**: Roll out iterative milestone phases to de-risk progressive integration across downstream modules.
- **Systemic Implication**: Enhanced connectivity yields emergent insights and robust topological coherence.
- **Next Horizon Opportunity**: Extend knowledge boundaries by probing uncharted adjacencies and cross-domain connections.

*Click **"Make Graph"** below to convert all these points into interactive nodes on your Oracle GigaMap.*`;
}
