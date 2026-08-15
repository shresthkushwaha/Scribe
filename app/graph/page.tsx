'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useNotesStore } from '@/lib/notesStore';
import React, { Suspense } from 'react';

function fmt(ts: number) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function GraphContent() {
    const { notes, loaded, load } = useNotesStore();
    const { id } = useParams<{ id: string }>();
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
        <main className="max-w-3xl mx-auto px-5 pb-20 pt-8">

            {/* ── Header ── */}
            <div className="flex items-end justify-between mb-6 gap-4">
                <div>
                    <h1 className="font-serif text-[32px] leading-tight" style={{ color: 'var(--text-1)' }}>
                        Build a graph
                    </h1>
                    <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                        Select 2+ notes to visualise cross-note connections
                    </p>
                </div>
                <button onClick={() => router.push(`/graph/multi?ids=${[...selected].join(',')}`)}
                    disabled={!canOpen}
                    className="flex-shrink-0 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                    style={canOpen
                        ? { background: 'var(--text-1)', color: 'var(--bg)' }
                        : { background: 'var(--bg-muted)', color: 'var(--text-4)', cursor: 'not-allowed' }}>
                    {selected.size > 0 ? `Connect (${selected.size}) →` : 'Connect →'}
                </button>
            </div>

            {/* ── Search ── */}
            <div className="relative mb-5">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: 'var(--text-4)' }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Filter notes…" value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="input-base" style={{ paddingLeft: '2.5rem' }} />
            </div>

            {/* ── Progress bar ── */}
            {selected.size > 0 && (
                <div className="mb-5 px-0.5">
                    <div className="flex justify-between mb-1.5">
                        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                            {selected.size} selected
                        </span>
                        {!canOpen && (
                            <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
                                Select {2 - selected.size} more
                            </span>
                        )}
                    </div>
                    <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.min(100, (selected.size / Math.max(2, notes.length)) * 100 + 8)}%`,
                                background: 'var(--accent-green)',
                            }} />
                    </div>
                </div>
            )}

            {/* ── Notes ── */}
            {!loaded ? (
                <div className="flex justify-center py-24">
                    <div className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-2)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="card p-12 text-center">
                    <p style={{ color: 'var(--text-3)' }}>No notes found.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(note => {
                        const sel = selected.has(note.id);
                        const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]]/g, '').slice(0, 80);
                        return (
                            <button key={note.id} onClick={() => toggle(note.id)}
                                className="card flex items-center gap-3.5 px-5 py-3.5 w-full text-left transition-all"
                                style={sel ? { borderColor: 'var(--text-3)', background: 'var(--bg-muted)' } : {}}>
                                {/* Check */}
                                <div className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                                    style={{
                                        borderColor: sel ? 'var(--text-1)' : 'var(--border)',
                                        background: sel ? 'var(--text-1)' : 'transparent',
                                    }}>
                                    {sel && (
                                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="font-serif text-[15px] truncate" style={{ color: 'var(--text-1)' }}>
                                            {note.title || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Untitled</span>}
                                        </p>
                                        <span className="flex-shrink-0 text-[11px]" style={{ color: 'var(--text-4)' }}>
                                            {fmt(note.updatedAt)}
                                        </span>
                                    </div>
                                    {excerpt && (
                                        <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--text-3)' }}>{excerpt}</p>
                                    )}
                                    {note.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1.5">
                                            {note.tags.slice(0, 4).map(t => (
                                                <span key={t} className="tag-pill text-[10px]">#{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
            <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-2)' }} />
            </div>
        }>
            <GraphContent />
        </Suspense>
    );
}
