'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useNotesStore } from '@/lib/notesStore';
import { MagnifyingGlass, Check, CircleNotch, TreeStructure } from '@phosphor-icons/react';

function fmt(ts: number) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function GraphContent() {
    const { notes, loaded, load } = useNotesStore();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState('');

    useEffect(() => { load(); }, []);
    useEffect(() => {
        const ids = searchParams.get('ids');
        if (ids) setSelected(new Set(ids.split(',')));
    }, [searchParams]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return notes.filter(n => !q || n.title.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)));
    }, [notes, query]);

    function toggle(id: string) {
        setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }

    const canOpen = selected.size >= 2;

    return (
        <main className="max-w-3xl mx-auto px-5 pb-20 pt-8 sm:pt-12">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="font-serif text-[36px] sm:text-[48px] leading-[1.15] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
                        Build a graph
                    </h1>
                    <p className="text-[15px] mt-3 font-medium opacity-70" style={{ color: 'var(--ink)' }}>
                        Select 2+ notes to visualise cross-note connections
                    </p>
                </div>
                <button onClick={() => router.push(`/graph/multi?ids=${[...selected].join(',')}`)}
                    disabled={!canOpen}
                    className="flex-shrink-0 px-6 py-3 rounded-full text-[14px] font-bold transition-all shadow-sm"
                    style={canOpen
                        ? { background: 'var(--ink)', color: 'white' }
                        : { background: 'var(--border-soft)', color: 'var(--ink-dim)', cursor: 'not-allowed', opacity: 0.7 }}>
                    {selected.size > 0 ? `Connect (${selected.size}) →` : 'Connect →'}
                </button>
            </div>

            {/* ── Search ── */}
            <div className="relative mb-6">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink-dim)]">
                    <MagnifyingGlass size={18} weight="bold" />
                </div>
                <input type="text" placeholder="Filter notes…" value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full h-12 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[var(--radius-pill)] pl-11 pr-4 text-[14px] font-medium text-[var(--ink)] placeholder-[var(--ink-dim)] outline-none transition-all shadow-[0_4px_16px_rgba(0,0,0,0.03)] focus:shadow-[0_8px_24px_rgba(0,0,0,0.06)] focus:border-white/80" />
            </div>

            {/* ── Progress bar ── */}
            {selected.size > 0 && (
                <div className="mb-6 px-1">
                    <div className="flex justify-between mb-2">
                        <span className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: 'var(--ink-dim)' }}>
                            {selected.size} selected
                        </span>
                        {!canOpen && (
                            <span className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: 'var(--ink-light)' }}>
                                Select {2 - selected.size} more
                            </span>
                        )}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-[var(--border-soft)]">
                        <div className="h-full rounded-full transition-all duration-300 bg-[var(--ink)]"
                            style={{
                                width: `${Math.min(100, (selected.size / Math.max(2, notes.length)) * 100 + 8)}%`,
                            }} />
                    </div>
                </div>
            )}

            {/* ── Notes ── */}
            {!loaded ? (
                <div className="flex justify-center py-24">
                    <CircleNotch size={24} className="animate-spin text-[var(--ink)] opacity-50" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-[var(--border-soft)] rounded-[var(--radius-lg)] p-12 text-center shadow-sm">
                    <p className="text-[15px] font-medium" style={{ color: 'var(--ink-dim)' }}>No notes found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(note => {
                        const sel = selected.has(note.id);
                        const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_\`\[\]]/g, '').slice(0, 100);
                        const pastelBg = note.color || 'var(--bg-card)';

                        return (
                            <button key={note.id} onClick={() => toggle(note.id)}
                                className={`flex items-start gap-4 px-5 py-4 w-full text-left transition-all border rounded-[var(--radius-lg)] shadow-sm hover:shadow-md ${sel ? 'border-[var(--ink)] scale-[1.01]' : 'border-[var(--border-soft)] hover:border-[var(--ink-dim)]'}`}
                                style={{
                                    background: sel ? 'var(--bg-page)' : pastelBg, // When selected, use neutral page bg
                                }}>
                                {/* Check */}
                                <div className={`w-5 h-5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${sel ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--border-soft)] bg-white shadow-sm'}`}>
                                    {sel && <Check size={12} weight="bold" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-3 mb-1">
                                        <p className="font-serif text-[18px] truncate font-semibold" style={{ color: 'var(--ink)' }}>
                                            {note.title || <span style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>Untitled</span>}
                                        </p>
                                        <span className="flex-shrink-0 text-[11px] font-medium" style={{ color: 'var(--ink-dim)' }}>
                                            {fmt(note.updatedAt)}
                                        </span>
                                    </div>
                                    {excerpt && (
                                        <p className="text-[13px] truncate mt-0.5 leading-relaxed" style={{ color: 'var(--ink-dim)' }}>{excerpt}</p>
                                    )}
                                    {note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {note.tags.slice(0, 5).map(t => (
                                                <span key={t} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border border-[var(--border-soft)] bg-white/50" style={{ color: 'var(--ink-dim)' }}>{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Graph Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/graph/${note.id}`);
                                    }}
                                    title="Open individual graph"
                                    className="p-2 -mr-2 rounded-full hover:bg-[var(--bg-muted)] text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors"
                                >
                                    <TreeStructure size={20} weight="bold" />
                                </button>
                            </button>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

export default function GraphPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-[var(--bg-app)] flex items-center justify-center">
                <CircleNotch size={32} className="animate-spin text-[var(--ink)] opacity-50" />
            </div>
        }>
            <GraphContent />
        </Suspense>
    );
}
