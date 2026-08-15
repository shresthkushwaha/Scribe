'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotesStore } from '@/lib/notesStore';
import type { Note } from '@/lib/notesStore';
import { MagnifyingGlass, Plus, Star, ClockCounterClockwise, Check, ArrowRight } from '@phosphor-icons/react';
import { GraphBuilder } from '@/components/GraphBuilder';
import { MobileSettingsIcon } from '@/components/MobileSettingsIcon';
import HomeGraphsSection from '@/components/HomeGraphsSection';
import HomeHeroCTA from '@/components/HomeHeroCTA';
import LandingView from '@/components/landing/LandingView';

function timeAgo(ts: number) {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hs = Math.floor(min / 60);
    if (hs < 24) return `${hs}h ago`;
    const ds = Math.floor(hs / 24);
    if (ds === 1) return '1d ago';
    return `${ds}d ago`;
}

export default function HomePage() {
    const { notes, loaded, load } = useNotesStore();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);

    useEffect(() => { 
        load(); 
        try {
            const visited = localStorage.getItem('scribe_visited');
            setIsFirstUser(!visited);
        } catch {
            setIsFirstUser(false);
        }
    }, [load]);

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

    if (isFirstUser === true) {
        return (
            <LandingView 
                onGetStarted={() => {
                    try {
                        localStorage.setItem('scribe_visited', 'true');
                    } catch {}
                    setIsFirstUser(false);
                    router.push('/notes');
                }} 
            />
        );
    }

    if (!loaded) return null;

    const renderCard = (note: Note) => {
        const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]]/g, '').slice(0, 140) + (note.body.length > 140 ? '...' : '');
        const isSelected = selectedIds.has(note.id);

        return (
            <div
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className={`group flex flex-col justify-between p-6 rounded-[24px] bg-[var(--bg-card)] border ${isSelected ? 'border-[#EC4E02] ring-2 ring-[#EC4E02]/30 shadow-md' : 'border-[var(--border-soft)] hover:border-[#EC4E02]/40 hover:shadow-lg'} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 relative min-h-[220px]`}
            >
                {/* Interactive Checkbox Layer */}
                <div
                    className={`no-route absolute top-4 right-4 w-6 h-6 rounded-md border flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-[#EC4E02] border-[#EC4E02] text-white' : 'bg-[var(--bg-card)]/80 backdrop-blur-sm border-[var(--border-soft)] text-transparent opacity-0 group-hover:opacity-100 hover:border-[#EC4E02]'}`}
                    onClick={(e) => toggleSelection(note.id, e)}
                >
                    <Check size={14} weight="bold" className={isSelected ? 'opacity-100' : 'opacity-0'} />
                </div>

                <div>
                    <h3 className="font-semibold text-[17px] leading-[1.3] text-[var(--ink)] group-hover:text-[#EC4E02] transition-colors mb-2 pr-8 line-clamp-2">
                        {note.title || 'Untitled Note'}
                    </h3>

                    <p className="text-[14px] leading-[1.6] text-[var(--ink-dim)] line-clamp-3">
                        {excerpt}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-soft)]">
                    <button className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--ink)] group-hover:text-[#EC4E02] transition-colors">
                        <span>Connect</span>
                        <ArrowRight size={13} weight="bold" />
                    </button>
                    <span className="shrink-0 whitespace-nowrap ml-2 text-[11px] font-medium text-[var(--ink-dim)]">
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
                <div className="flex items-center gap-2 mb-4 px-1">
                    {icon}
                    <h2 className="text-[18px] font-semibold tracking-tight text-[var(--ink)]">{title}</h2>
                </div>
                {items.length === 0 ? (
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        <Link href={`/notes/new`}
                            className="flex flex-col items-center justify-center p-6 bg-[var(--bg-card)] rounded-[24px] cursor-pointer transition-all hover:border-[#EC4E02]/50 group border-2 border-dashed border-[var(--border-soft)] min-h-[180px]">
                            <div className="flex flex-col items-center gap-2.5 text-[var(--ink-dim)] group-hover:text-[#EC4E02] transition-colors">
                                <Plus size={28} weight="bold" />
                                <span className="font-semibold text-[14px]">Create your first note</span>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {items.slice(0, 8).map((n) => renderCard(n))}
                    </div>
                )}
            </section>
        );
    };

    return (
        <div className="min-h-full w-full flex flex-col bg-[var(--bg-card)] rounded-none md:rounded-[32px] border border-[var(--border-soft)] shadow-sm">
            {/* Top Bar Header Section */}
            <div className="sticky top-0 z-30 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border-soft)] px-6 md:px-10 py-4 rounded-t-none md:rounded-t-[32px]">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                        <div className="flex items-center gap-2.5">
                            <img src="/scribe-logo-ico-orange.svg" alt="Scribe" className="w-6 h-6 object-contain" />
                            <h2 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-[var(--ink)]">
                                Scribe Workspace
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-orange-500/20 bg-orange-500/10 text-orange-500">
                                Beta
                            </span>
                        </div>
                        <MobileSettingsIcon />
                    </div>

                    <div className="w-full sm:max-w-md">
                        <div className="relative w-full rounded-full flex items-center bg-[var(--bg-muted)] border border-[var(--border-soft)] transition-all focus-within:border-[#EC4E02]/50 focus-within:ring-2 focus-within:ring-[#EC4E02]/10">
                            <div className="pl-4 text-[var(--ink-dim)]">
                                <MagnifyingGlass size={16} weight="bold" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search thoughts and concepts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 bg-transparent outline-none px-3 text-[13px] placeholder-[var(--ink-dim)] text-[var(--ink)] rounded-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Scrolling Body */}
            <div className="w-full max-w-7xl mx-auto px-6 md:px-10 pt-6 pb-28">
                {/* Hero CTA with Dithering Effect & Orange Accent */}
                <HomeHeroCTA />

                {/* Visual Graphs & Maps Section */}
                <HomeGraphsSection />

                {/* Starred Notes */}
                {renderSection('Starred Notes', starredNotes, <Star size={20} weight="fill" className="text-[#EC4E02]" />, true)}

                {/* Recent Notes */}
                {renderSection('Recent Active Notes', recentActiveNotes, <ClockCounterClockwise size={20} weight="bold" className="text-[var(--ink-dim)]" />)}
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
