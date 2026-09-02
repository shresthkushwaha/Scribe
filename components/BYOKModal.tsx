'use client';

import React, { useEffect, useState } from 'react';
import { 
    useBYOKStore, 
    APIKey, 
    POPULAR_PROVIDERS, 
    fetchModels, 
    ModelsRegistry, 
    formatModelsForProvider 
} from '@/lib/byokStore';
import { 
    Key, 
    Plus, 
    Trash, 
    Check, 
    X, 
    Sparkle, 
    Cpu, 
    Cloud, 
    ShieldCheck, 
    CaretDown,
    ArrowUpRight
} from '@phosphor-icons/react';

interface BYOKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BYOKModal({ isOpen, onClose }: BYOKModalProps) {
  const { config, setConfig, addKey, removeKey, setActiveKey, updateKeyModel, load } = useBYOKStore();
  const [registry, setRegistry] = useState<ModelsRegistry>({});
  const [loading, setLoading] = useState(true);
  const [selectedRegProvider, setSelectedRegProvider] = useState<string>('google');

  // Input states
  const [keyValue, setKeyValue] = useState('');
  const [selectedModelOption, setSelectedModelOption] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');
  const [customBaseURL, setCustomBaseURL] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isOpen) {
      loadModelsRegistry();
    }
  }, [isOpen]);

  const loadModelsRegistry = async () => {
    setLoading(true);
    const data = await fetchModels();
    setRegistry(data);
    setLoading(false);
  };

  const getProviderName = (id: string) => {
    return registry[id]?.name || POPULAR_PROVIDERS.find(p => p.id === id)?.name || id.toUpperCase();
  };

  const availableProviders = Object.keys(registry).length > 0 
    ? Object.keys(registry).sort((a, b) => getProviderName(a).localeCompare(getProviderName(b)))
    : POPULAR_PROVIDERS.map(p => p.id);

  const modelsForNewKey = formatModelsForProvider(registry, selectedRegProvider);

  // Update default model selection when provider changes
  useEffect(() => {
    if (modelsForNewKey.length > 0) {
      setSelectedModelOption(modelsForNewKey[0]?.value || '');
      setCustomModelInput('');
    }
    if (selectedRegProvider === 'ollama') {
      setKeyValue('http://localhost:11434/v1');
    } else if (selectedRegProvider === 'lmstudio') {
      setKeyValue('http://localhost:1234/v1');
    } else {
      setKeyValue('');
    }
  }, [selectedRegProvider]);

  if (!isOpen) return null;

  const handleAddKey = () => {
    const p = selectedRegProvider;
    const isLocal = p === 'ollama' || p === 'lmstudio';
    const v = keyValue.trim();
    const m = (selectedModelOption === 'custom' ? customModelInput.trim() : selectedModelOption.trim()) || modelsForNewKey[0]?.value || 'gemini-2.5-flash';
    const b = customBaseURL.trim();

    if (!v && !isLocal) {
      setFeedbackMsg('Please paste a valid API key.');
      return;
    }

    const newKey: APIKey = {
      id: `byok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: getProviderName(p),
      provider: p,
      value: isLocal ? (v || 'http://localhost:11434/v1') : v,
      preferredModel: m,
      baseURL: isLocal ? v : (b || registry[p]?.api),
      createdAt: Date.now(),
    };

    addKey(newKey);
    setKeyValue('');
    setCustomBaseURL('');
    setFeedbackMsg(`✓ Added ${getProviderName(p)} as active credential`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] rounded-t-[28px] md:rounded-[28px] w-full max-w-2xl shadow-[0_24px_64px_rgba(0,0,0,0.3)] border border-[var(--border-soft)] overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-300 flex flex-col max-h-[90vh] h-[90vh] md:h-auto">
        
        {/* Header */}
        <header className="px-6 md:px-8 py-5 border-b border-[var(--border-soft)] flex justify-between items-center bg-[var(--bg-app)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Key size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[var(--ink)] font-sans tracking-tight">
                API Configuration & BYOK
              </h2>
              <p className="text-[11px] font-semibold text-[var(--ink-dim)] uppercase tracking-wider mt-0.5">
                {loading ? 'Fetching models registry...' : 'Bring Your Own Key & Custom AI Models'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-[var(--bg-muted)] text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8 no-scrollbar flex-1">
          
          {/* Section 1: Active Credentials */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-[var(--ink-dim)] uppercase tracking-[0.12em]">
                Active Credentials ({config.keys.length})
              </h3>
              <span className="text-[11px] text-[var(--ink-dim)]">
                Stored locally in browser
              </span>
            </div>

            <div className="space-y-3">
              {config.keys.map(key => {
                const isActive = config.activeKeyId === key.id;
                const models = formatModelsForProvider(registry, key.provider);

                return (
                  <div 
                    key={key.id} 
                    className={`p-4 md:p-5 border rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-indigo-500/5 border-indigo-500/40 shadow-xs' 
                        : 'bg-[var(--bg-muted)]/50 border-[var(--border-soft)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[14px] font-bold text-[var(--ink)]">
                          {getProviderName(key.provider)}
                        </span>
                        {isActive && (
                          <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Check size={10} weight="bold" />
                            In Use
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setActiveKey(key.id)}
                          disabled={isActive}
                          className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                            isActive 
                              ? 'bg-indigo-500/15 text-indigo-400 cursor-default' 
                              : 'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg-card)] shadow-xs'
                          }`}
                        >
                          {isActive ? 'Active' : 'Use This'}
                        </button>
                        <button 
                          onClick={() => removeKey(key.id)}
                          className="p-1.5 rounded-full hover:bg-red-500/10 text-[var(--ink-dim)] hover:text-red-500 transition-colors"
                          title="Remove credential"
                        >
                          <Trash size={16} weight="regular" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-soft)]">
                      <div>
                        <label className="text-[9px] font-bold text-[var(--ink-dim)] uppercase tracking-wider block mb-1">
                          API Key
                        </label>
                        <div className="text-[12px] font-mono text-[var(--ink-dim)]">
                          {key.value.startsWith('http') ? key.value : `••••••••${key.value.slice(-4)}`}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-[var(--ink-dim)] uppercase tracking-wider block mb-1">
                          Preferred Model
                        </label>
                        <select 
                          value={key.preferredModel}
                          onChange={(e) => updateKeyModel(key.id, e.target.value)}
                          style={{ colorScheme: 'dark' }}
                          className="w-full bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[var(--ink)] focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          {models.length > 0 ? (
                            models.map(m => (
                              <option key={m.value} value={m.value} className="bg-[#14151a] text-white">
                                {m.label}
                              </option>
                            ))
                          ) : (
                            <option value={key.preferredModel} className="bg-[#14151a] text-white">
                              {key.preferredModel}
                            </option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}

              {config.keys.length === 0 && (
                <div className="text-center py-7 bg-[var(--bg-muted)]/40 rounded-2xl border border-dashed border-[var(--border-soft)]">
                  <p className="text-[13px] text-[var(--ink-dim)]">
                    No custom keys configured. Currently using system default.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Register New Provider */}
          <section className="space-y-6 pt-2">
            <div className="flex items-center gap-3">
              <h3 className="text-[11px] font-black text-[var(--ink-dim)] uppercase tracking-[0.12em]">
                Register New Provider
              </h3>
              <div className="h-px flex-1 bg-[var(--border-soft)]" />
            </div>

            {/* Cloud vs Local Tabs */}
            <div className="flex gap-1.5 p-1 bg-[var(--bg-muted)] rounded-xl w-fit border border-[var(--border-soft)]">
              <button 
                onClick={() => setSelectedRegProvider('google')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  !selectedRegProvider.startsWith('local') && selectedRegProvider !== 'ollama' && selectedRegProvider !== 'lmstudio' 
                    ? 'bg-[var(--bg-card)] text-[var(--ink)] shadow-xs' 
                    : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                }`}
              >
                <Cloud size={13} weight="bold" />
                Cloud API
              </button>
              <button 
                onClick={() => setSelectedRegProvider('ollama')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  selectedRegProvider.startsWith('local') || selectedRegProvider === 'ollama' || selectedRegProvider === 'lmstudio' 
                    ? 'bg-[var(--bg-card)] text-[var(--ink)] shadow-xs' 
                    : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                }`}
              >
                <Cpu size={13} weight="bold" />
                Local AI
              </button>
            </div>

            <div className="space-y-4">
              {/* Provider & Model Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--ink-dim)] uppercase tracking-wider">
                    Provider
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedRegProvider}
                      onChange={(e) => setSelectedRegProvider(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[var(--ink)] focus:outline-none focus:border-orange-500 appearance-none cursor-pointer pr-9"
                    >
                      {availableProviders
                        .filter(pId => {
                          const isLocal = pId === 'ollama' || pId === 'lmstudio' || pId.startsWith('local');
                          const wantLocal = selectedRegProvider === 'ollama' || selectedRegProvider === 'lmstudio';
                          return wantLocal ? isLocal : !isLocal;
                        })
                        .map(pId => (
                          <option key={pId} value={pId} className="bg-[#14151a] text-white py-1.5 font-medium">
                            {getProviderName(pId)}
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink-dim)]">
                      <CaretDown size={14} weight="bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--ink-dim)] uppercase tracking-wider">
                    Preferred Model
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedModelOption}
                      onChange={(e) => setSelectedModelOption(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[var(--ink)] focus:outline-none focus:border-orange-500 appearance-none cursor-pointer pr-9"
                    >
                      {modelsForNewKey.map(m => (
                        <option key={m.value} value={m.value} className="bg-[#14151a] text-white py-1.5 font-medium">
                          {m.label} ({m.value})
                        </option>
                      ))}
                      <option value="custom" className="bg-[#14151a] text-white py-1.5 font-medium">
                        Custom / Other Model...
                      </option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink-dim)]">
                      <CaretDown size={14} weight="bold" />
                    </div>
                  </div>

                  {selectedModelOption === 'custom' && (
                    <input 
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder="Type custom model ID (e.g. gemini-1.5-pro or ft:gpt-4o...)"
                      className="w-full bg-[var(--bg-muted)] border border-indigo-500/40 rounded-xl px-3.5 py-2 text-[12px] font-mono text-[var(--ink)] placeholder-[var(--ink-dim)] focus:outline-none mt-2"
                    />
                  )}
                </div>
              </div>

              {/* API Key / Base URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--ink-dim)] uppercase tracking-wider">
                  {selectedRegProvider === 'ollama' || selectedRegProvider === 'lmstudio' ? 'Local Base URL' : 'API Key'}
                </label>
                <input 
                  type={selectedRegProvider === 'ollama' || selectedRegProvider === 'lmstudio' ? 'text' : 'password'}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder={
                    selectedRegProvider === 'ollama' 
                      ? 'http://localhost:11434/v1' 
                      : selectedRegProvider === 'lmstudio' 
                      ? 'http://localhost:1234/v1' 
                      : 'Paste your secret API key here (AIzaSy... or sk-...)'
                  } 
                  className="w-full bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-xl px-3.5 py-2.5 text-[13px] font-mono text-[var(--ink)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-indigo-500" 
                />
              </div>

              {/* Custom Base URL (Optional for Cloud) */}
              {!(selectedRegProvider === 'ollama' || selectedRegProvider === 'lmstudio') && (
                <div className="space-y-1.5 opacity-70 hover:opacity-100 transition-opacity">
                  <label className="text-[10px] font-bold text-[var(--ink-dim)] uppercase tracking-wider">
                    Custom Base URL / Proxy (Optional)
                  </label>
                  <input 
                    type="text"
                    value={customBaseURL}
                    onChange={(e) => setCustomBaseURL(e.target.value)}
                    placeholder="https://generativelanguage.googleapis.com" 
                    className="w-full bg-[var(--bg-muted)] border border-[var(--border-soft)] rounded-xl px-3.5 py-2 text-[12px] font-mono text-[var(--ink)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              )}

              {/* Local AI Tips */}
              {(selectedRegProvider === 'ollama' || selectedRegProvider === 'lmstudio') && (
                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[12px] text-[var(--ink)] leading-relaxed">
                  <span className="font-bold">Ollama Tip:</span> Ensure you have set <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]">OLLAMA_ORIGINS="*"</code> in your environment variables to allow local browser requests.
                </div>
              )}

              {feedbackMsg && (
                <p className="text-[12px] font-semibold text-emerald-500 animate-in fade-in">
                  {feedbackMsg}
                </p>
              )}

              <button 
                onClick={handleAddKey}
                className="w-full py-3 bg-[var(--ink)] text-[var(--bg-card)] rounded-xl text-[13px] font-bold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} weight="bold" />
                Add {selectedRegProvider === 'ollama' || selectedRegProvider === 'lmstudio' ? 'Local AI Model' : 'Credential'}
              </button>
            </div>
          </section>
          
        </div>

        {/* Footer */}
        <footer className="px-6 md:px-8 py-4 border-t border-[var(--border-soft)] bg-[var(--bg-app)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-dim)]">
            <ShieldCheck size={14} weight="bold" className="text-emerald-500" />
            <span>Keys never leave your browser storage</span>
          </div>

          <button 
            onClick={onClose} 
            className="px-6 py-2 rounded-full text-[13px] font-bold bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--ink)] hover:bg-[var(--bg-muted)] transition-all shadow-xs"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
