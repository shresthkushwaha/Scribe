'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotesStore, type Note } from '@/lib/notesStore';
import { MagnifyingGlass, Check, TreeStructure, X } from '@phosphor-icons/react';

interface GraphBuilderProps {
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    onClear: () => void;
}

export function GraphBuilder({ selectedIds, onToggle, onClear }: GraphBuilderProps) {
    const { notes } = useNotesStore();
    const router = useRouter();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return notes
            .filter(n => !n.trashed && !n.archived)
            .filter(n => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }, [notes, query]);

    const canOpen = selectedIds.size >= 2;

    const handleConnect = () => {
        if (!canOpen) return;
        const ids = Array.from(selectedIds).join(',');
        router.push(`/graph/multi?ids=${ids}`);
    };

    return (
        <aside className="w-full max-w-[400px] hidden xl:flex flex-col h-full bg-gradient-to-br from-[#FFFdfa] to-[var(--bg-peach)]/30 rounded-none md:rounded-[28px] lg:rounded-[32px] shadow-none md:shadow-sm border-none md:border border-[rgba(0,0,0,0.05)] overflow-hidden">
            <div className="p-6 border-b border-[rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-[24px] font-semibold text-[var(--ink)]">Build a graph</h2>
                    <button
                        onClick={handleConnect}
                        disabled={!canOpen}
                        className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${canOpen
                            ? 'bg-[var(--ink)] text-white shadow-sm hover:scale-[1.02]'
                            : 'bg-[var(--border-soft)] text-[var(--ink-light)] cursor-not-allowed'
                            }`}
                    >
                        {selectedIds.size > 0 ? `Connect (${selectedIds.size}) →` : 'Connect →'}
                    </button>
                </div>
                <p className="text-[13px] text-[var(--ink-dim)] mb-6">Select 2+ notes to visualise cross-note connections</p>

                {/* Search */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-dim)]">
                        <MagnifyingGlass size={16} weight="bold" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter notes..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full h-10 bg-white/60 backdrop-blur-sm border border-white/50 rounded-full pl-9 pr-4 text-[13px] text-[var(--ink)] outline-none focus:bg-white focus:border-[var(--ink-dim)] transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Selection Progress */}
            {selectedIds.size > 0 && (
                <div className="px-6 py-4 bg-white/40 border-b border-[var(--border-soft)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-dim)]">
                            {selectedIds.size} selected
                        </span>
                        <button onClick={onClear} className="text-[11px] font-bold text-[var(--ink)] hover:underline">Clear</button>
                    </div>
                    <div className="h-1 bg-[var(--border-soft)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--ink)] transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedIds.size / 2) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {filtered.map(note => {
                    const isSelected = selectedIds.has(note.id);
                    return (
                        <div
                            key={note.id}
                            onClick={() => onToggle(note.id)}
                            className={`group p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer flex items-center gap-3 ${isSelected
                                ? 'bg-white border-[var(--ink)] shadow-md'
                                : 'bg-white/40 border-transparent hover:bg-white/80 hover:shadow-sm'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--ink)] border-[var(--ink)] text-white' : 'border-[var(--border-soft)] bg-white text-transparent overflow-hidden'
                                }`}>
                                <Check size={12} weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-[13px] font-semibold truncate ${isSelected ? 'text-[var(--ink)]' : 'text-[var(--ink-dim)]'}`}>
                                    {note.title || 'Untitled'}
                                </h4>
                                <p className="text-[11px] text-[var(--ink-light)] truncate">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Quick Graph Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/graph/${note.id}`);
                                }}
                                title="Open individual graph"
                                className="p-2 rounded-full hover:bg-[var(--bg-muted)] text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <TreeStructure size={16} weight="bold" />
                            </button>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="py-12 text-center text-[var(--ink-dim)] text-[13px]">
                        No matching notes
                    </div>
                )}
            </div>
        </aside>
    );
}
