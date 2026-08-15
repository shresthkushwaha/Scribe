/**
 * lib/services/promptCache.ts
 * Utility to cache SCAMPER prompts in LocalStorage.
 */

const CACHE_KEY_PREFIX = 'SCAMPER_PROMPT_';

export async function cachePrompt(name: string, content: string): Promise<void> {
  localStorage.setItem(`${CACHE_KEY_PREFIX}${name}`, content);
}

export async function getCachedPrompt(name: string): Promise<string | null> {
  return localStorage.getItem(`${CACHE_KEY_PREFIX}${name}`);
}

export function hasCachedPrompt(name: string): boolean {
  return localStorage.getItem(`${CACHE_KEY_PREFIX}${name}`) !== null;
}
