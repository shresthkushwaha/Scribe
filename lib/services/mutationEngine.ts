/**
 * lib/services/mutationEngine.ts
 * Core logic for triggering spatial mutations using Gemini 3.1 Flash Lite.
 * Supports SCAMPER and extensible to other Divergent Thinking techniques.
 */

import { getCachedPrompt, cachePrompt } from './promptCache';
import { findVoidSpace, Point } from '../utils/spatial';
import { getEffectiveGeminiKey, getActiveBYOKConfig } from '@/lib/byokStore';

export const DEFAULT_PROMPTS: Record<string, string> = {
  'scamper-divergence': `---  
name: scamper-divergence  
description: "Generate structural and logical mutations of a concept using the SCAMPER framework."  
---
# SCAMPER Divergence (Structural Mutation)
You are a Divergent Thinking Architect. Your goal is to perform a logical stress test on a concept by applying:
- Substitute (S)
- Combine (C)
- Adapt (A)
- Modify (M)
- Put to another use (P)
- Eliminate (E)
- Reverse (R)

Return a JSON object with a summary, satellites (coords -250 to 250), and a jolt.`,
  'first-principles': `---  
name: first-principles  
description: "Break down a concept into fundamental truths and rebuild from scratch."  
---
# First Principles Deconstruction
You are a First Principles Analyst. Break down the anchor concept into its base components/axioms and propose 5-7 fundamental rebuilds.
Return a JSON object with a summary, satellites (coords -250 to 250), and a jolt.`
};

export function seedPrompts() {
  Object.entries(DEFAULT_PROMPTS).forEach(([key, prompt]) => {
    cachePrompt(key, prompt);
  });
}

export interface MutationResult {
  summary: {
    masterNode: string;
    dqiScore: number;
    mutationTone: string;
  };
  satellites: Array<{
    letter: string; // e.g., 'S', 'C', 'A' range or other identifier
    title: string;
    logic: string;
    coords: Point; // Relative to box center
  }>;
  jolt: string;
}

export async function generateMutationBox(
  technique: string, // e.g., 'scamper-divergence'
  anchorNode: { id: string; label: string; text: string; x: number; y: number },
  occupiedNodes: { x: number; y: number; r: number }[],
  apiKey?: string
): Promise<MutationResult | null> {
  let prompt = await getCachedPrompt(technique);
  if (!prompt) {
    console.log(`ℹ️ [Mutation] Prompt '${technique}' not in cache, seeding defaults...`);
    seedPrompts();
    prompt = await getCachedPrompt(technique);
  }

  if (!prompt) {
    console.error(`❌ [Mutation] Prompt '${technique}' not found after seeding.`);
    return null;
  }

  const byok = getActiveBYOKConfig();
  const effectiveApiKey = apiKey || (byok?.value && byok.value !== 'local-no-key' ? byok.value : getEffectiveGeminiKey());
  if (!effectiveApiKey) {
    console.error('❌ [Mutation] No API key provided.');
    return null;
  }

  const systemInstructions = prompt;
  const userContent = `Anchor Node Context:
ID: ${anchorNode.id}
Label: ${anchorNode.label}
Text: ${anchorNode.text}

Perform a mutation using the '${technique}' technique on this node.
Return the result as a JSON object following this schema:
{
  "summary": { "masterNode": string, "dqiScore": number, "mutationTone": string },
  "satellites": [
    { "letter": string, "title": string, "logic": string, "coords": { "x": number, "y": number } }
  ],
  "jolt": string
}
Note: Coords should be relative to {0,0} within a 500x500 box.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${effectiveApiKey}`;

  const payload = {
    systemInstruction: { parts: [{ text: systemInstructions }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      thinkingConfig: { thinkingLevel: "medium" }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`❌ [Mutation] Gemini API error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textResponse) {
      return JSON.parse(textResponse) as MutationResult;
    }
  } catch (error) {
    console.error(`❌ [Mutation] Failed to generate mutation '${technique}':`, error);
  }

  return null;
}

/**
 * Orchestrates the placement of the mutation box.
 */
export function placeMutationBox(
  anchorPos: Point,
  occupiedNodes: { x: number; y: number; r: number }[],
  dimensions: { width: number; height: number }
): Point {
  return findVoidSpace(occupiedNodes, dimensions, 300, anchorPos);
}
