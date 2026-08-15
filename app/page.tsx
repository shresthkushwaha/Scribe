'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotesStore } from '@/lib/notesStore';
import type { Note } from '@/lib/notesStore';
import { MagnifyingGlass, Plus, Star, ClockCounterClockwise, TreeStructure, Check } from '@phosphor-icons/react';
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

export default function HomePage() {
    const { notes, loaded, load } = useNotesStore();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!search) return notes;
        const s = search.toLowerCase();
        return notes.filter((n: Note) => n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s));
    }, [notes, search]);

    const starredNotes = useMemo(() => filtered.filter((n: Note) => n.starred), [filtered]);
    const recentActiveNotes = useMemo(() => {
        return filtered
            .filter((n: Note) => !n.archived)
            .sort((a: Note, b: Note) => b.updatedAt - a.updatedAt);
    }, [filtered]);

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (!loaded) return null;

    const renderCard = (note: Note, index: number) => {
        const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]]/g, '').slice(0, 150) + (note.body.length > 150 ? '...' : '');
        const cardBg = note.color || pastelBgs[index % pastelBgs.length];
        const isSelected = selectedIds.has(note.id);

        // Grab first tag or fallback
        const primaryTag = note.tags && note.tags.length > 0 ? note.tags[0] : 'Unsorted';

        return (
            <div
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className={`group flex flex-col p-[var(--space-m)] rounded-[var(--radius-lg)] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_rgba(62,56,56,0.1)] relative border ${isSelected ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--bg-app)] border-transparent' : 'border-transparent'}`}
                style={{
                    backgroundColor: cardBg,
                    minHeight: '220px'
                }}
            >
                {/* Interactive Checkbox Layer */}
                <div
                    className={`no-route absolute top-4 right-4 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-[var(--ink)] border-[var(--ink)] text-white' : 'bg-white/40 backdrop-blur-sm border-white/60 text-transparent opacity-0 group-hover:opacity-100 hover:border-white'}`}
                    onClick={(e) => toggleSelection(note.id, e)}
                >
                    <Check size={14} weight="bold" className={isSelected ? 'opacity-100' : 'opacity-0'} />
                </div>

                <h3 className="font-semibold text-[18px] leading-[1.3] mb-1 pr-10" style={{ color: 'var(--ink)' }}>
                    {note.title || 'Untitled Note'}
                </h3>

                <p className="text-[15px] leading-[1.5] overflow-hidden"
                    style={{
                        color: 'var(--ink-dim)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                    }}>
                    {excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="truncate min-w-0 px-2.5 py-1 rounded-full text-[12px] font-semibold tracking-wide bg-white/40 backdrop-blur-sm text-[var(--ink)]">
                        {primaryTag}
                    </span>
                    <span className="shrink-0 whitespace-nowrap ml-2 text-[12px] font-medium text-[var(--ink-dim)]">
                        {timeAgo(note.updatedAt)}
                    </span>
                </div>
            </div>
        );
    };

    const renderSection = (title: string, items: Note[], icon: React.ReactNode, hideEmpty: boolean = false) => {
        if (hideEmpty && items.length === 0) return null;

        return (
            <section className="mb-12">
                <div className="flex items-center gap-2 mb-6 px-1">
                    {icon}
                    <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
                </div>
                {items.length === 0 ? (
                    <div className="grid gap-6 -mx-4 -mt-4 px-4 pt-4 pb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        <Link href={`/notes/new`}
                            className="flex flex-col items-center justify-center p-[var(--space-m)] bg-[var(--bg-card)] rounded-[var(--radius-lg)] cursor-pointer transition-all hover:border-[var(--ink-dim)] group"
                            style={{ border: '2px dashed var(--border)', minHeight: '220px' }}>
                            <div className="flex flex-col items-center gap-3 text-[var(--ink-dim)] group-hover:text-[var(--ink)] transition-colors">
                                <Plus size={32} weight="regular" />
                                <span className="font-medium text-[15px]">Create your first note</span>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 -mx-4 -mt-4 px-4 pt-4 pb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {items.slice(0, 8).map((n, i) => renderCard(n, i))}
                    </div>
                )}
            </section>
        );
    };

    return (
        <div className="flex h-full w-full gap-4 md:gap-5 lg:gap-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white rounded-none md:rounded-[28px] lg:rounded-[32px] shadow-none md:shadow-[0_4px_32px_rgba(0,0,0,0.02)] border-none md:border border-[rgba(0,0,0,0.03)]">
                {/* Fixed Header Section */}
                <div className="z-20 bg-white w-full rounded-t-none md:rounded-t-[32px]">
                    <div className="max-w-7xl mx-auto w-full px-6 md:px-8 lg:px-12 pt-6 md:pt-8 lg:pt-10 mb-2">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative w-full">
                            <div className="flex-1 shrink-0">
                                <h1 className="text-[32px] md:text-[40px] font-serif font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
                                    Hola there
                                </h1>
                            </div>

                            <div className="flex-[2] max-w-xl w-full">
                                <div className="relative w-full shadow-[0_4px_16px_rgba(0,0,0,0.03)] rounded-[var(--radius-pill)] flex items-center bg-white/60 backdrop-blur-xl border border-[var(--border-soft)] transition-all focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.06)] focus-within:border-[var(--border-soft)]">
                                    <div className="pl-4 text-[var(--ink-dim)]">
                                        <MagnifyingGlass size={16} weight="bold" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search notes..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full h-11 bg-transparent outline-none px-3 text-[14px] placeholder-[var(--ink-dim)] text-[var(--ink)] rounded-[var(--radius-pill)]"
                                    />
                                </div>
                            </div>
                        </header>
                    </div>
                </div>

                {/* Scrolling Content Section */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="max-w-7xl mx-auto w-full px-6 md:px-8 lg:px-12 pb-24">
                        {/* Content Sections */}
                        {renderSection('Starred', starredNotes, <Star size={24} weight="fill" color="#eab308" />, true)}
                        {renderSection('Recent Notes', recentActiveNotes, <ClockCounterClockwise size={24} weight="regular" className="text-[var(--ink-dim)]" />)}
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

            <style jsx global>{`
                @keyframes wave {
                    0% { transform: rotate( 0.0deg) }
                    10% { transform: rotate(14.0deg) }  
                    20% { transform: rotate(-8.0deg) }
                    30% { transform: rotate(14.0deg) }
                    40% { transform: rotate(-4.0deg) }
                    50% { transform: rotate(10.0deg) }
                    60% { transform: rotate( 0.0deg) }  
                    100% { transform: rotate( 0.0deg) }
                }
            `}</style>
        </div>
    );
}
