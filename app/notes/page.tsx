'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotesStore } from '@/lib/notesStore';
import type { Note } from '@/lib/notesStore';

function timeAgo(ts: number) {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min} minutes ago`;
    const hs = Math.floor(min / 60);
    if (hs < 24) return `${hs} hours ago`;
    const ds = Math.floor(hs / 24);
    if (ds === 1) return '1 day ago';
    return `${ds} days ago`;
}

import React, { Suspense } from 'react';

function NotesContent() {
    const { notes, loaded, load, remove, toggleStar, toggleArchive, moveToTrash, restoreFromTrash } = useNotesStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tagParam = searchParams.get('tag');
    const filterParam = searchParams.get('filter');

    const [query, setQuery] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(tagParam);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => { load(); }, []);
    useEffect(() => { setActiveTag(tagParam); }, [tagParam]);

    const allTags = useMemo(() => {
        const m = new Map<string, number>();
        notes.forEach((n: Note) => n.tags.forEach(t => m.set(t, (m.get(t) ?? 0) + 1)));
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
    }, [notes]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return notes
            .filter((n: Note) => {
                // Handle Base Filters
                if (n.trashed) {
                    if (filterParam !== 'trash') return false;
                } else {
                    if (filterParam === 'trash') return false;
                    if (filterParam === 'archive' && !n.archived) return false;
                    if (filterParam !== 'archive' && n.archived) return false;
                    if (filterParam === 'starred' && !n.starred) return false;
                }

                // Handle Tags
                if (activeTag && !n.tags.includes(activeTag)) return false;

                // Handle Text Query
                if (q && !n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) return false;

                return true;
            })
            .sort((a: Note, b: Note) => b.updatedAt - a.updatedAt);
    }, [notes, query, activeTag, filterParam]);

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleViewGraph = () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds).join(',');
        router.push(`/graph/multi?ids=${ids}`);
    };

    let pageTitle = 'All notes';
    if (activeTag) pageTitle = `#${activeTag}`;
    if (filterParam === 'starred') pageTitle = 'Starred notes';
    if (filterParam === 'archive') pageTitle = 'Archive';
    if (filterParam === 'trash') pageTitle = 'Trash';


    return (
        <main className="relative max-w-[1400px] mx-auto w-full p-6 md:p-8 lg:p-10 min-h-full flex flex-col">

            {/* Floating Selection Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-4 bg-[var(--text-1)] text-[var(--bg)] px-5 py-3 rounded-full shadow-2xl">
                        <span className="text-[14px] font-medium font-mono tabular-nums">{selectedIds.size} selected</span>
                        <div className="w-px h-4 bg-[var(--bg)]/20" />
                        <button onClick={handleViewGraph} className="flex items-center gap-2 text-[13px] font-medium hover:opacity-80 transition-opacity whitespace-nowrap">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                            View Graph ({selectedIds.size})
                        </button>
                        <button onClick={() => setSelectedIds(new Set())} className="ml-2 p-1 hover:bg-[var(--bg)]/20 rounded-full transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight leading-tight flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                        {filterParam === 'starred' && <svg width="24" height="24" viewBox="0 0 24 24" fill="#eab308" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                        {filterParam === 'archive' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>}
                        {filterParam === 'trash' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>}
                        {pageTitle}
                    </h1>
                    {loaded && (
                        <p className="text-[14px] mt-1" style={{ color: 'var(--text-3)' }}>
                            {filtered.length} notes
                        </p>
                    )}
                </div>
                <Link href="/notes/new"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all shadow-sm hover:scale-[0.98]"
                    style={{ background: 'var(--text-1)', color: 'var(--bg)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    New note
                </Link>
            </header>

            {/* Search */}
            <div className="relative mb-6 max-w-2xl">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: 'var(--text-4)' }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Search notes…" value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full h-12 bg-[var(--bg-card)] outline-none rounded-xl border px-4 pl-11 text-[14px] shadow-sm transition-all focus:border-[var(--text-3)]"
                    style={{ borderColor: 'var(--border-soft)', color: 'var(--text-1)' }} />
            </div>

            {/* Filters (Tags & System) - Mobile Responsive Scroll */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
                <button
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${(!filterParam && !activeTag) ? 'bg-[var(--text-1)] text-[var(--bg)]' : 'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-muted)]'}`}
                    onClick={() => { router.push('/notes'); setActiveTag(null); }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                    All Notes
                </button>
                <button
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${filterParam === 'starred' ? 'bg-[var(--text-1)] text-[var(--bg)]' : 'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-muted)]'}`}
                    onClick={() => { router.push('/notes?filter=starred'); setActiveTag(null); }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Starred
                </button>
                <button
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${filterParam === 'archive' ? 'bg-[var(--text-1)] text-[var(--bg)]' : 'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-muted)]'}`}
                    onClick={() => { router.push('/notes?filter=archive'); setActiveTag(null); }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
                    Archive
                </button>
                <button
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${filterParam === 'trash' ? 'bg-[var(--text-1)] text-[var(--bg)]' : 'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-muted)]'}`}
                    onClick={() => { router.push('/notes?filter=trash'); setActiveTag(null); }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Trash
                </button>

                {allTags.length > 0 && <div className="w-px h-6 bg-[var(--border-soft)] mx-1 shrink-0 self-center hidden md:block" />}

                {allTags.map(([tag, count]) => (
                    <button key={tag}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${activeTag === tag ? 'bg-[var(--text-1)] text-[var(--bg)]' : 'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-muted)]'}`}
                        onClick={() => { setActiveTag(activeTag === tag ? null : tag); router.push('/notes'); }}>
                        #{tag}
                        <span className="opacity-50 text-[10px] tabular-nums">{count}</span>
                    </button>
                ))}
            </div>

            {/* Notes Grid */}
            {!loaded ? (
                <div className="flex justify-center py-24 flex-1">
                    <div className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-2)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] border-dashed">
                    <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-[var(--bg-muted)] text-[var(--text-4)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                    </div>
                    <p className="text-[15px] font-medium mb-1" style={{ color: 'var(--text-2)' }}>No notes found</p>
                    <p className="text-[13px] mb-4 max-w-xs" style={{ color: 'var(--text-4)' }}>Try adjusting your search query or tag filters to find what you're looking for.</p>
                    {query && (
                        <button onClick={() => setQuery('')} className="text-[13px] font-medium hover:underline underline-offset-4"
                            style={{ color: 'var(--text-1)' }}>
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
                    {filtered.map((note: Note) => {
                        const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]]/g, '').slice(0, 150) + '...';
                        const isSelected = selectedIds.has(note.id);
                        const borderColor = note.color || 'var(--border-soft)';

                        return (
                            <div
                                key={note.id}
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('.no-route')) {
                                        router.push(`/notes/${note.id}`);
                                    }
                                }}
                                className={`group relative flex flex-col p-6 bg-[var(--bg-card)] rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isSelected ? 'ring-2 ring-[var(--text-1)]' : ''}`}
                                style={{
                                    border: '1px solid var(--border-soft)',
                                    minHeight: '220px'
                                }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl transition-all opacity-80 group-hover:opacity-100" style={{ backgroundColor: borderColor }} />

                                {/* Interactive Checkbox Layer */}
                                <div
                                    className={`no-route absolute top-4 right-4 w-5 h-5 rounded border flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-[var(--text-1)] border-[var(--text-1)]' : 'bg-[var(--bg-card)] border-[var(--border)] opacity-0 group-hover:opacity-100 hover:border-[var(--text-3)]'}`}
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(note.id, e); }}
                                >
                                    {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                </div>

                                <h3 className="font-serif font-medium text-[20px] leading-snug mb-3 pr-8" style={{ color: 'var(--text-1)' }}>
                                    {note.title || 'Untitled Note'}
                                </h3>

                                <p className="text-[14px] leading-relaxed mb-5 flex-1 line-clamp-4" style={{ color: 'var(--text-3)' }}>
                                    {excerpt}
                                </p>

                                {note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-5">
                                        {note.tags.slice(0, 3).map(t => (
                                            <span key={t} className="px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide bg-[var(--bg-muted)] transition-colors group-hover:bg-[var(--border-soft)] text-[var(--text-3)] uppercase">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-soft)]">
                                    <span className="text-[12px] font-medium" style={{ color: 'var(--text-4)' }}>
                                        {timeAgo(note.updatedAt)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {/* Restore Button for Trashed Notes */}
                                        {filterParam === 'trash' && (
                                            <button
                                                className="no-route opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[var(--bg-muted)] text-[var(--text-4)] hover:text-[var(--text-2)]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    restoreFromTrash(note.id);
                                                }}
                                                title="Restore Note"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                                            </button>
                                        )}
                                        {/* Delete Button (Visible on Hover) */}
                                        <button
                                            className="no-route opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[var(--accent-red)]/10 text-[var(--text-4)] hover:text-[var(--accent-red)]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (filterParam === 'trash') {
                                                    if (confirm('Permanently delete this note?')) remove(note.id);
                                                } else {
                                                    moveToTrash(note.id);
                                                }
                                            }}
                                            title={filterParam === 'trash' ? "Permanently Delete Note" : "Move to Trash"}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                        {note.starred && <svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

export default function NotesPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-2)' }} />
            </div>
        }>
            <NotesContent />
        </Suspense>
    );
}
