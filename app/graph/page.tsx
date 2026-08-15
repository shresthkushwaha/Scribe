'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNotesStore, type Note } from '@/lib/notesStore';
import { useMapStore, type SavedMap, type MapType } from '@/lib/mapStore';
import { 
    MagnifyingGlass, Check, CircleNotch, TreeStructure, Sparkle, 
    Trash, Plus, CalendarBlank, Clock, Graph, ArrowRight, Compass
} from '@phosphor-icons/react';
import { MobileSettingsIcon } from '@/components/MobileSettingsIcon';

function sanitizeText(text?: string): string {
    if (!text) return '';
    return text
        .replace(/oatsen/gi, 'Oracle')
        .replace(/undefined/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatDate(ts: number) {
    if (!ts) return 'Recent';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }) + ' at ' + d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function timeAgo(ts: number) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hs = Math.floor(min / 60);
    if (hs < 24) return `${hs}h ago`;
    const ds = Math.floor(hs / 24);
    if (ds === 1) return '1d ago';
    if (ds < 30) return `${ds}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    individual: { label: 'Note Graph', bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', icon: <TreeStructure size={14} weight="bold" /> },
    multi: { label: 'Archipelago', bg: 'rgba(168, 85, 247, 0.12)', text: '#a855f7', icon: <Compass size={14} weight="bold" /> },
    oracle: { label: 'Oracle Spatial', bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1', icon: <Compass size={14} weight="bold" /> },
    oatsen: { label: 'Oracle Spatial', bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1', icon: <Compass size={14} weight="bold" /> },
    custom: { label: 'Custom Map', bg: 'rgba(107, 114, 128, 0.12)', text: '#6b7280', icon: <Graph size={14} weight="bold" /> },
    v2: { label: 'Spatial V2', bg: 'rgba(236, 72, 153, 0.12)', text: '#ec4899', icon: <Sparkle size={14} weight="bold" /> },
};

function GraphContent() {
    const { notes, loaded: notesLoaded, load: loadNotes } = useNotesStore();
    const { maps, loaded: mapsLoaded, load: loadMaps, deleteMap } = useMapStore();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'saved' | 'builder'>('saved');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        loadNotes();
        loadMaps();
    }, [loadNotes, loadMaps]);

    useEffect(() => {
        const ids = searchParams.get('ids');
        if (ids) {
            setSelected(new Set(ids.split(',')));
            setActiveTab('builder');
        }
    }, [searchParams]);

    // Filter notes for builder
    const filteredNotes = useMemo(() => {
        const q = query.toLowerCase();
        return notes.filter(n => !q || n.title.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)));
    }, [notes, query]);

    // Filter saved maps
    const filteredMaps = useMemo(() => {
        const q = query.toLowerCase();
        return maps.filter(m => {
            const matchesQuery = !q || m.title.toLowerCase().includes(q) || m.noteTitles?.some(t => t.toLowerCase().includes(q));
            const matchesType = typeFilter === 'all' || m.type === typeFilter;
            return matchesQuery && matchesType;
        });
    }, [maps, query, typeFilter]);

    function toggle(id: string) {
        setSelected(s => { 
            const n = new Set(s); 
            n.has(id) ? n.delete(id) : n.add(id); 
            return n; 
        });
    }

    const canOpen = selected.size >= 2;

    const handleDeleteMap = async (e: React.MouseEvent, mapId: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this saved map?")) {
            await deleteMap(mapId);
        }
    };

    return (
        <main className="flex-1 h-full overflow-hidden flex flex-col bg-(--bg-card) rounded-none md:rounded-[28px] lg:rounded-[32px] shadow-none md:shadow-[0_4px_32px_rgba(0,0,0,0.02)] border-none md:border border-(--border-soft) w-full">
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-20 pt-8 sm:pt-10 min-h-full flex flex-col w-full">

                    {/* ── Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-6 border-b border-(--border-soft)">
                        <div>
                            <div className="flex items-center justify-between">
                                <h1 className="font-serif text-[32px] sm:text-[42px] leading-[1.15] font-semibold tracking-tight text-(--ink)">
                                    Knowledge Graphs
                                </h1>
                                <MobileSettingsIcon />
                            </div>
                            <p className="text-[14px] sm:text-[15px] mt-2 font-medium text-(--ink-dim)">
                                Explore saved AI syntheses, cross-note connections, and semantic maps with timestamps.
                            </p>
                        </div>

                        {/* Mode Switcher Tabs */}
                        <div className="flex items-center p-1 rounded-full bg-(--bg-muted) border border-(--border-soft) shrink-0 self-start sm:self-center shadow-inner">
                            <button
                                onClick={() => setActiveTab('saved')}
                                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all flex items-center gap-2 ${
                                    activeTab === 'saved'
                                        ? 'bg-(--bg-card) text-(--ink) shadow-sm'
                                        : 'text-(--ink-dim) hover:text-(--ink)'
                                }`}
                            >
                                <Graph size={16} weight={activeTab === 'saved' ? 'bold' : 'regular'} />
                                Saved Maps
                                {maps.length > 0 && (
                                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-(--bg-page) text-(--ink-dim)">
                                        {maps.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('builder')}
                                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all flex items-center gap-2 ${
                                    activeTab === 'builder'
                                        ? 'bg-(--bg-card) text-(--ink) shadow-sm'
                                        : 'text-(--ink-dim) hover:text-(--ink)'
                                }`}
                            >
                                <Plus size={16} weight="bold" />
                                Connect Notes
                                {selected.size > 0 && (
                                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-(--ink) text-(--bg-card)">
                                        {selected.size}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── Search & Filter Bar ── */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-(--ink-dim)">
                                <MagnifyingGlass size={18} weight="bold" />
                            </div>
                            <input
                                type="text"
                                placeholder={activeTab === 'saved' ? "Search saved maps by title or note..." : "Filter notes to connect..."}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full h-11 bg-(--bg-muted) backdrop-blur-xl border border-(--border-soft) rounded-full pl-11 pr-4 text-[13px] sm:text-[14px] font-medium text-(--ink) placeholder-(--ink-dim) outline-none transition-all focus:border-(--ink-dim) shadow-sm"
                            />
                        </div>

                        {activeTab === 'saved' && maps.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
                                {['all', 'individual', 'multi', 'oracle', 'strategist', 'swamp'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize whitespace-nowrap transition-all border ${
                                            typeFilter === type
                                                ? 'bg-(--ink) text-(--bg-card) border-(--ink)'
                                                : 'bg-(--bg-muted) text-(--ink-dim) border-(--border-soft) hover:text-(--ink)'
                                        }`}
                                    >
                                        {type === 'all' ? 'All Types' : type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── TAB 1: SAVED MAPS VIEW ── */}
                    {activeTab === 'saved' && (
                        <div className="space-y-4">
                            {!mapsLoaded ? (
                                <div className="flex justify-center py-20">
                                    <CircleNotch size={28} className="animate-spin text-(--ink) opacity-50" />
                                </div>
                            ) : filteredMaps.length === 0 ? (
                                <div className="bg-(--bg-muted)/40 border border-dashed border-(--border-soft) rounded-[24px] p-12 text-center flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-(--bg-muted) flex items-center justify-center text-(--ink-dim) mb-4">
                                        <TreeStructure size={28} weight="regular" />
                                    </div>
                                    <h3 className="font-semibold text-[17px] text-(--ink) mb-1">
                                        {maps.length === 0 ? "No maps created yet" : "No matching maps found"}
                                    </h3>
                                    <p className="text-[13px] text-(--ink-dim) max-w-md mb-6">
                                        {maps.length === 0 
                                            ? "Open any note's graph or select multiple notes to generate an archipelago connection. Every map is automatically saved here with its creation date & time."
                                            : "Try adjusting your search query or type filter."}
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('builder')}
                                        className="px-5 py-2.5 rounded-full text-[13px] font-bold bg-(--ink) text-(--bg-card) shadow-sm hover:scale-[1.02] transition-transform flex items-center gap-2"
                                    >
                                        <Plus size={16} weight="bold" />
                                        Build your first graph
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredMaps.map((map: SavedMap) => {
                                        const typeConfig = TYPE_CONFIG[map.type] || TYPE_CONFIG.custom;
                                        return (
                                            <div
                                                key={map.id}
                                                onClick={() => router.push(map.href)}
                                                className="group p-5 bg-(--bg-card) border border-(--border-soft) hover:border-(--ink-dim) rounded-[20px] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
                                            >
                                                <div>
                                                    {/* Card Header: Type Badge + Timestamps */}
                                                    <div className="flex items-center justify-between gap-2 mb-3">
                                                        <span
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                                                            style={{ backgroundColor: typeConfig.bg, color: typeConfig.text }}
                                                        >
                                                            {typeConfig.icon}
                                                            {typeConfig.label}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-(--ink-dim) bg-(--bg-muted) px-2 py-0.5 rounded-md">
                                                            {timeAgo(map.updatedAt || map.createdAt)}
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="font-sans font-bold text-[16px] text-(--ink) group-hover:text-indigo-400 transition-colors leading-[1.3] mb-2 line-clamp-1">
                                                        {sanitizeText(map.title) || 'Visual Knowledge Map'}
                                                    </h3>

                                                    {/* Excerpt if present */}
                                                    {map.previewExcerpt && (
                                                        <p className="font-sans text-[13px] text-(--ink-dim) line-clamp-2 leading-relaxed mb-4">
                                                            {sanitizeText(map.previewExcerpt)}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Card Footer: Exact Date/Time + Node counts + Actions */}
                                                <div className="pt-3 mt-3 border-t border-(--border-soft) flex items-center justify-between text-[12px] text-(--ink-dim)">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 font-medium">
                                                            <CalendarBlank size={14} weight="regular" />
                                                            <span>{formatDate(map.createdAt)}</span>
                                                        </div>
                                                        {map.nodeCount > 0 && (
                                                            <div className="flex items-center gap-2 text-[11px] opacity-80 mt-0.5">
                                                                <span>{map.nodeCount} nodes</span>
                                                                {map.linkCount > 0 && <span>• {map.linkCount} links</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => handleDeleteMap(e, map.id)}
                                                            title="Delete Map"
                                                            className="p-2 rounded-full hover:bg-(--bg-muted) text-(--ink-dim) hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash size={16} weight="regular" />
                                                        </button>
                                                        <span className="p-2 rounded-full bg-(--bg-muted) text-(--ink) group-hover:translate-x-1 transition-transform">
                                                            <ArrowRight size={14} weight="bold" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 2: CONNECT NOTES (GRAPH BUILDER) VIEW ── */}
                    {activeTab === 'builder' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-(--border-soft)">
                                <div>
                                    <h2 className="font-serif text-[22px] font-semibold text-(--ink)">
                                        Select Notes to Compare
                                    </h2>
                                    <p className="text-[13px] text-(--ink-dim) mt-0.5">
                                        Choose 2 or more notes to build a cross-reference archipelago.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push(`/graph/multi?ids=${[...selected].join(',')}`)}
                                    disabled={!canOpen}
                                    className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-sm flex items-center gap-2 ${
                                        canOpen
                                            ? 'bg-(--ink) text-(--bg-card) hover:scale-[1.02]'
                                            : 'bg-(--border-soft) text-(--ink-dim) opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    {selected.size > 0 ? `Connect (${selected.size}) →` : 'Connect →'}
                                </button>
                            </div>

                            {/* Progress bar */}
                            {selected.size > 0 && (
                                <div className="px-1 py-2">
                                    <div className="flex justify-between mb-1.5 text-[11px] font-bold uppercase tracking-wider text-(--ink-dim)">
                                        <span>{selected.size} notes selected</span>
                                        {!canOpen && <span>Select {2 - selected.size} more</span>}
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden bg-(--border-soft)">
                                        <div
                                            className="h-full rounded-full transition-all duration-300 bg-(--ink)"
                                            style={{
                                                width: `${Math.min(100, (selected.size / Math.max(2, notes.length)) * 100 + 10)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {!notesLoaded ? (
                                <div className="flex justify-center py-20">
                                    <CircleNotch size={24} className="animate-spin text-(--ink) opacity-50" />
                                </div>
                            ) : filteredNotes.length === 0 ? (
                                <div className="bg-(--bg-card) border border-(--border-soft) rounded-[20px] p-12 text-center">
                                    <p className="text-[14px] font-medium text-(--ink-dim)">No notes found matching your filter.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {filteredNotes.map(note => {
                                        const sel = selected.has(note.id);
                                        const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]]/g, '').slice(0, 120);
                                        const pastelBg = note.color || 'var(--bg-card)';

                                        return (
                                            <div
                                                key={note.id}
                                                onClick={() => toggle(note.id)}
                                                className={`flex items-start gap-4 px-5 py-4 w-full text-left transition-all border rounded-[20px] shadow-sm hover:shadow-md cursor-pointer ${
                                                    sel ? 'border-(--ink) scale-[1.005]' : 'border-(--border-soft) hover:border-(--ink-dim)'
                                                }`}
                                                style={{
                                                    background: sel ? 'var(--bg-page)' : pastelBg,
                                                }}
                                            >
                                                <div className={`w-5 h-5 rounded-[6px] border flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${
                                                    sel ? 'border-(--ink) bg-(--ink) text-(--bg-card)' : 'border-(--border-soft) bg-(--bg-card)'
                                                }`}>
                                                    {sel && <Check size={12} weight="bold" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-3 mb-1">
                                                        <p className="font-serif text-[17px] truncate font-semibold text-(--ink)">
                                                            {note.title || <span className="italic opacity-60">Untitled</span>}
                                                        </p>
                                                        <span className="flex-shrink-0 text-[11px] font-medium text-(--ink-dim)">
                                                            {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    {excerpt && (
                                                        <p className="text-[13px] truncate leading-relaxed text-(--ink-dim)">
                                                            {excerpt}
                                                        </p>
                                                    )}
                                                    {note.tags && note.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                            {note.tags.slice(0, 4).map(t => (
                                                                <span key={t} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border border-(--border-soft) bg-(--bg-card)/60 text-(--ink-dim)">
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/graph/${note.id}`);
                                                    }}
                                                    title="Open individual note graph"
                                                    className="p-2 rounded-full hover:bg-(--bg-muted) text-(--ink-dim) hover:text-(--ink) transition-colors"
                                                >
                                                    <TreeStructure size={20} weight="bold" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function GraphPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-(--bg-app) flex items-center justify-center">
                <CircleNotch size={32} className="animate-spin text-(--ink) opacity-50" />
            </div>
        }>
            <GraphContent />
        </Suspense>
    );
}
