'use client';

import { create } from 'zustand';

export interface APIKey {
  id: string;
  name: string;
  provider: string;
  value: string;
  preferredModel: string;
  baseURL?: string;
  createdAt?: number;
}

export interface UserConfig {
  activeKeyId: string | null;
  keys: APIKey[];
}

export interface ModelEntry {
  id: string;
  name: string;
}

export interface ProviderEntry {
  id: string;
  name: string;
  models: Record<string, ModelEntry>;
  api?: string;
}

export interface ModelsRegistry {
  [providerId: string]: ProviderEntry;
}

const STORAGE_KEY = 'SCRIBE_BYOK_CONFIG';
const CACHE_KEY = 'SCRIBE_MODELS_CACHE';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export const POPULAR_PROVIDERS = [
  { id: 'google', name: 'Google Gemini' },
  { id: 'anthropic', name: 'Anthropic Claude' },
  { id: 'openai', name: 'OpenAI GPT' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'mistral', name: 'Mistral AI' },
  { id: 'nvidia', name: 'NVIDIA NIM' },
  { id: 'groq', name: 'Groq' },
  { id: 'perplexity', name: 'Perplexity' },
  { id: 'cerebras', name: 'Cerebras' },
  { id: 'ollama', name: 'Ollama (Local AI)' },
  { id: 'lmstudio', name: 'LM Studio (Local AI)' },
];

export const FALLBACK_REGISTRY: ModelsRegistry = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    models: {
      'gemini-2.5-flash': { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      'gemini-1.5-pro-latest': { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' },
      'gemini-1.5-flash-latest': { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
      'gemini-3.1-flash-lite-preview': { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
    }
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: {
      'claude-3-5-sonnet-20240620': { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
      'claude-3-opus-20240229': { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      'claude-3-haiku-20240307': { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    }
  },
  openai: {
    id: 'openai',
    name: 'OpenAI GPT',
    models: {
      'gpt-4o': { id: 'gpt-4o', name: 'GPT-4o' },
      'gpt-4o-mini': { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      'gpt-4-turbo': { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    }
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    models: {
      'deepseek-chat': { id: 'deepseek-chat', name: 'DeepSeek V3' },
      'deepseek-reasoner': { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoning)' },
    }
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    models: {
      'mistral-large-latest': { id: 'mistral-large-latest', name: 'Mistral Large' },
      'mistral-small-latest': { id: 'mistral-small-latest', name: 'Mistral Small' },
      'codestral-latest': { id: 'codestral-latest', name: 'Codestral' },
      'open-mixtral-8x22b': { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B' },
    }
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    models: {
      'sonar-pro': { id: 'sonar-pro', name: 'Sonar Pro' },
      'sonar': { id: 'sonar', name: 'Sonar' },
      'sonar-reasoning-pro': { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro' },
      'sonar-reasoning': { id: 'sonar-reasoning', name: 'Sonar Reasoning' },
    }
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    models: {
      'meta/llama-3.3-70b-instruct': { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
      'nvidia/llama-3.1-nemotron-70b-instruct': { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B' },
      'deepseek-ai/deepseek-r1': { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1 (NVIDIA)' },
    }
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    models: {
      'llama-3.3-70b': { id: 'llama-3.3-70b', name: 'Llama 3.3 70B (Fast)' },
      'llama3.1-8b': { id: 'llama3.1-8b', name: 'Llama 3.1 8B (Ultra Fast)' },
    }
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    models: {
      'llama-3.3-70b-versatile': { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      'llama-3.1-8b-instant': { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
      'mixtral-8x7b-32768': { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      'deepseek-r1-distill-llama-70b': { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B' },
    }
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local AI)',
    api: 'http://localhost:11434/v1',
    models: {
      'llama3.2': { id: 'llama3.2', name: 'Llama 3.2' },
      'llama3.1': { id: 'llama3.1', name: 'Llama 3.1' },
      'llama3': { id: 'llama3', name: 'Llama 3' },
      'mistral': { id: 'mistral', name: 'Mistral 7B' },
      'qwen2.5': { id: 'qwen2.5', name: 'Qwen 2.5' },
      'deepseek-r1:7b': { id: 'deepseek-r1:7b', name: 'DeepSeek R1 (7B)' },
      'deepseek-r1:14b': { id: 'deepseek-r1:14b', name: 'DeepSeek R1 (14B)' },
      'gemma2': { id: 'gemma2', name: 'Gemma 2' },
      'phi3': { id: 'phi3', name: 'Phi 3' },
    }
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio (Local AI)',
    api: 'http://localhost:1234/v1',
    models: {
      'local-model': { id: 'local-model', name: 'Currently Loaded Model (Default)' },
    }
  }
};

export async function fetchModels(): Promise<ModelsRegistry> {
  if (typeof window === 'undefined') return FALLBACK_REGISTRY;

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return mergeWithFallback(data);
      }
    } catch {
      // Ignore cache parse errors
    }
  }

  try {
    const response = await fetch('https://models.dev/api.json');
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    return mergeWithFallback(data);
  } catch (error) {
    console.warn('Using fallback models registry:', error);
    return FALLBACK_REGISTRY;
  }
}

function mergeWithFallback(fetched: ModelsRegistry): ModelsRegistry {
  const merged = { ...FALLBACK_REGISTRY };
  
  if (fetched && typeof fetched === 'object') {
    Object.keys(fetched).forEach(providerId => {
      if (fetched[providerId]?.models) {
        if (!merged[providerId]) {
          merged[providerId] = fetched[providerId];
        } else {
          merged[providerId].models = {
            ...merged[providerId].models,
            ...fetched[providerId].models
          };
        }
      }
    });
  }
  
  return merged;
}

export function formatModelsForProvider(registry: ModelsRegistry, providerId: string) {
  const provider = registry[providerId] || FALLBACK_REGISTRY[providerId];
  if (!provider || !provider.models) return [];
  
  return Object.values(provider.models).map(m => ({
    value: m.id,
    label: m.name || m.id
  }));
}

interface BYOKState {
  config: UserConfig;
  isLoaded: boolean;
  load: () => void;
  setConfig: (config: UserConfig) => void;
  addKey: (key: APIKey) => void;
  removeKey: (id: string) => void;
  setActiveKey: (id: string | null) => void;
  updateKeyModel: (keyId: string, model: string) => void;
}

export const useBYOKStore = create<BYOKState>((set, get) => ({
  config: {
    activeKeyId: null,
    keys: [],
  },
  isLoaded: false,

  load: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ config: parsed, isLoaded: true });
        return;
      }
    } catch (e) {
      console.warn('Failed to load BYOK store:', e);
    }
    set({ isLoaded: true });
  },

  setConfig: (config: UserConfig) => {
    set({ config });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  },

  addKey: (key: APIKey) => {
    const { config } = get();
    const updatedKeys = [...config.keys.filter(k => k.id !== key.id), key];
    const newConfig = {
      ...config,
      keys: updatedKeys,
      activeKeyId: key.id, // Auto-activate newly added key
    };
    get().setConfig(newConfig);
  },

  removeKey: (id: string) => {
    const { config } = get();
    const updatedKeys = config.keys.filter(k => k.id !== id);
    const newConfig = {
      ...config,
      keys: updatedKeys,
      activeKeyId: config.activeKeyId === id ? (updatedKeys[0]?.id || null) : config.activeKeyId,
    };
    get().setConfig(newConfig);
  },

  setActiveKey: (id: string | null) => {
    const { config } = get();
    get().setConfig({ ...config, activeKeyId: id });
  },

  updateKeyModel: (keyId: string, model: string) => {
    const { config } = get();
    const updatedKeys = config.keys.map(k => k.id === keyId ? { ...k, preferredModel: model } : k);
    get().setConfig({ ...config, keys: updatedKeys });
  },
}));

/**
 * Universal helper for AI services: retrieves the user's active BYOK key,
 * or falls back to system environment variable.
 */
export function getEffectiveGeminiKey(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: UserConfig = JSON.parse(stored);
        const activeKey = config.keys.find(k => k.id === config.activeKeyId);
        if (activeKey && activeKey.value && activeKey.value !== 'local-no-key') {
          return activeKey.value;
        }
      }
    } catch {
      // Ignore parse error
    }
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
}

/**
 * Retrieves the full active BYOK credentials including custom model & baseURL.
 */
export function getActiveBYOKConfig(): APIKey | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: UserConfig = JSON.parse(stored);
        const activeKey = config.keys.find(k => k.id === config.activeKeyId);
        if (activeKey) return activeKey;
      }
    } catch {
      // Ignore parse error
    }
  }
  return null;
}
