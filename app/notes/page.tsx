'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotesStore } from '@/lib/notesStore';
import type { Note } from '@/lib/notesStore';
import { FileText, Star, Archive, Trash, Plus, MagnifyingGlass, Ghost, Check, ArrowUUpLeft, TreeStructure, X } from '@phosphor-icons/react';
import { GraphBuilder } from '@/components/GraphBuilder';

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

const pastelBgs = ['var(--bg-sage)', 'var(--bg-rose)', 'var(--bg-lavender)', 'var(--bg-peach)', 'var(--bg-sky)'];

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
        <div className="flex h-full w-full overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Fixed Header & Navigation Section */}
                <div className="z-20 bg-[var(--bg-app)] w-full">
                    <div className="max-w-7xl mx-auto w-full px-6 md:px-8 lg:px-12 pt-6 md:pt-8 lg:pt-10 mb-2">
                        {/* Header */}
                        <header className="flex flex-col md:flex-row md:items-start md:mt-1 justify-between gap-6 mb-10 relative w-full">
                            <div className="flex-1 shrink-0">
                                <h1 className="text-[32px] md:text-[40px] font-serif font-semibold tracking-tight leading-tight flex items-center gap-3" style={{ color: 'var(--ink)' }}>
                                    {filterParam === 'starred' && <Star size={32} weight="fill" color="#eab308" />}
                                    {filterParam === 'archive' && <Archive size={32} weight="regular" />}
                                    {filterParam === 'trash' && <Trash size={28} weight="regular" />}
                                    {pageTitle}
                                </h1>
                                {loaded && (
                                    <p className="text-[15px] mt-1" style={{ color: 'var(--ink-dim)' }}>
                                        {filtered.length} notes
                                    </p>
                                )}
                            </div>

                            {/* Centered Search */}
                            <div className="flex-1 flex justify-center w-full min-w-0 max-w-2xl mx-auto">
                                <div className="relative w-full shadow-[0_4px_16px_rgba(0,0,0,0.03)] rounded-[var(--radius-pill)] flex items-center bg-white/60 backdrop-blur-xl border border-white/50 transition-all focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.06)] focus-within:border-white/80">
                                    <div className="pl-4 text-[var(--ink-dim)]">
                                        <MagnifyingGlass size={16} weight="bold" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search notes..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="w-full h-11 bg-transparent outline-none px-3 text-[14px] placeholder-[var(--ink-dim)] text-[var(--ink)] rounded-[var(--radius-pill)]"
                                    />
                                </div>
                            </div>

                            {/* Right Space (Balanced) */}
                            <div className="flex-1 hidden md:flex justify-end shrink-0" />
                        </header>

                        {/* Filters (Tags & System) - Mobile Responsive Scroll */}
                        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
                            <button
                                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2 ${(!filterParam && !activeTag) ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--border-soft)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-muted)]'}`}
                                onClick={() => { router.push('/notes'); setActiveTag(null); }}
                            >
                                <FileText size={16} weight={(!filterParam && !activeTag) ? "fill" : "regular"} />
                                All Notes
                            </button>
                            <button
                                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2 ${filterParam === 'starred' ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--border-soft)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-muted)]'}`}
                                onClick={() => { router.push('/notes?filter=starred'); setActiveTag(null); }}
                            >
                                <Star size={16} weight={filterParam === 'starred' ? "fill" : "regular"} />
                                Starred
                            </button>
                            <button
                                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2 ${filterParam === 'archive' ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--border-soft)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-muted)]'}`}
                                onClick={() => { router.push('/notes?filter=archive'); setActiveTag(null); }}
                            >
                                <Archive size={16} weight={filterParam === 'archive' ? "fill" : "regular"} />
                                Archive
                            </button>
                            <button
                                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2 ${filterParam === 'trash' ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--border-soft)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-muted)]'}`}
                                onClick={() => { router.push('/notes?filter=trash'); setActiveTag(null); }}
                            >
                                <Trash size={16} weight={filterParam === 'trash' ? "fill" : "regular"} />
                                Trash
                            </button>

                            {allTags.length > 0 && <div className="w-px h-6 bg-[var(--border-soft)] mx-2 shrink-0 self-center hidden md:block" />}

                            {allTags.map(([tag, count]) => (
                                <button key={tag}
                                    className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2 ${activeTag === tag ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--border-soft)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-muted)]'}`}
                                    onClick={() => { setActiveTag(activeTag === tag ? null : tag); router.push('/notes'); }}>
                                    #{tag}
                                    <span className="opacity-60 text-[11px] tabular-nums">{count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scrolling Grid Section */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="max-w-7xl mx-auto w-full px-6 md:px-8 lg:px-12 pb-24">
                        {!loaded ? (
                            <div className="flex justify-center py-24 flex-1">
                                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                                    style={{ borderColor: 'var(--border-soft)', borderTopColor: 'var(--ink)' }} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-[var(--radius-xl)] bg-transparent border-2 border-dashed border-[var(--border-soft)]">
                                <div className="w-14 h-14 rounded-full mb-4 flex items-center justify-center bg-[var(--bg-muted)] text-[var(--ink-dim)]">
                                    <Ghost size={32} weight="regular" />
                                </div>
                                <p className="text-[16px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>No notes found</p>
                                <p className="text-[14px] mb-6 max-w-sm" style={{ color: 'var(--ink-dim)' }}>Try adjusting your search query or tag filters to find what you're looking for.</p>
                                {query && (
                                    <button onClick={() => setQuery('')} className="text-[14px] font-semibold hover:underline underline-offset-4"
                                        style={{ color: 'var(--ink)' }}>
                                        Clear search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-6 pb-24" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {filtered.map((note: Note, index: number) => {
                                    const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]]/g, '').slice(0, 150) + '...';
                                    const isSelected = selectedIds.has(note.id);
                                    const cardBg = note.color || pastelBgs[index % pastelBgs.length];
                                    const primaryTag = note.tags && note.tags.length > 0 ? note.tags[0] : 'Unsorted';

                                    return (
                                        <div
                                            key={note.id}
                                            onClick={(e) => {
                                                const target = e.target as HTMLElement;
                                                if (!target.closest('.no-route')) {
                                                    router.push(`/notes/${note.id}`);
                                                }
                                            }}
                                            className={`group relative flex flex-col p-[var(--space-m)] bg-[var(--bg-card)] rounded-[var(--radius-lg)] cursor-pointer transition-all hover:shadow-[0_12px_24px_-10px_rgba(62,56,56,0.1)] hover:-translate-y-1 ${isSelected ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--bg-app)]' : 'border border-transparent'}`}
                                            style={{
                                                backgroundColor: cardBg,
                                                minHeight: '220px'
                                            }}
                                        >
                                            {/* Interactive Checkbox Layer */}
                                            <div
                                                className={`no-route absolute top-4 right-4 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-[var(--ink)] border-[var(--ink)] text-white' : 'bg-white/40 backdrop-blur-sm border-white/60 text-transparent opacity-0 group-hover:opacity-100 hover:border-white'}`}
                                                onClick={(e) => { e.stopPropagation(); toggleSelection(note.id, e); }}
                                            >
                                                <Check size={14} weight="bold" className={isSelected ? 'opacity-100' : 'opacity-0'} />
                                            </div>

                                            <h3 className="font-semibold text-[18px] leading-[1.3] mb-1 pr-10" style={{ color: 'var(--ink)' }}>
                                                {note.title || 'Untitled Note'}
                                            </h3>

                                            <p className="text-[15px] leading-[1.5] flex-1 overflow-hidden"
                                                style={{
                                                    color: 'var(--ink-dim)',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                {excerpt}
                                            </p>

                                            <div className="flex items-center justify-between mt-4 pt-2 border-t border-black/5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold tracking-wide bg-white/40 backdrop-blur-sm text-[var(--ink)] transition-colors hover:bg-white/60">
                                                        {primaryTag}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Restore Button for Trashed Notes */}
                                                    {filterParam === 'trash' && (
                                                        <button
                                                            className="no-route opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-white/40 text-[var(--ink-dim)] hover:text-[var(--ink)]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                restoreFromTrash(note.id);
                                                            }}
                                                            title="Restore Note"
                                                        >
                                                            <ArrowUUpLeft size={18} weight="bold" />
                                                        </button>
                                                    )}
                                                    {/* Delete Button (Visible on Hover) */}
                                                    <button
                                                        className="no-route opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-red-500/10 text-[var(--ink-dim)] hover:text-red-600"
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
                                                        <Trash size={18} weight="bold" />
                                                    </button>
                                                    {note.starred && <Star size={18} weight="fill" color="#eab308" className="mr-1" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <GraphBuilder
                selectedIds={selectedIds}
                onToggle={(id) => {
                    const next = new Set(selectedIds);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    setSelectedIds(next);
                }}
                onClear={() => setSelectedIds(new Set())}
            />
        </div>
    );
}

export default function NotesPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--border-soft)', borderTopColor: 'var(--ink)' }} />
            </div>
        }>
            <NotesContent />
        </Suspense>
    );
}
