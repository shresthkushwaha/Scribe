'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useMapStore, SavedMap } from '@/lib/mapStore';
import { 
    TreeStructure, 
    ArrowRight, 
    ArrowUpRight, 
    Sparkle, 
    Compass, 
    Graph, 
    Plus
} from '@phosphor-icons/react';

function cleanDisplayTitle(rawTitle?: string): string {
    if (!rawTitle) return 'Visual Knowledge Map';
    let t = rawTitle
        .replace(/^oatsen\s*map:\s*/i, '')
        .replace(/^oracle\s*map:\s*/i, '')
        .replace(/^strategist\s*map:\s*/i, '')
        .replace(/^custom\s*map:\s*/i, '')
        .replace(/oatsen/gi, 'Oracle')
        .replace(/undefined/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    return t || 'Visual Knowledge Map';
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

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    oracle: { label: 'Oracle Spatial', icon: <Sparkle size={12} weight="fill" /> },
    oatsen: { label: 'Oracle Spatial', icon: <Sparkle size={12} weight="fill" /> },
    strategist: { label: 'Strategist Map', icon: <Graph size={12} weight="bold" /> },
    individual: { label: 'Note Graph', icon: <TreeStructure size={12} weight="bold" /> },
    multi: { label: 'Archipelago', icon: <Compass size={12} weight="bold" /> },
    swamp: { label: 'Swamp Analysis', icon: <TreeStructure size={12} weight="bold" /> },
    custom: { label: 'Visual Map', icon: <Graph size={12} weight="bold" /> },
};

export default function HomeGraphsSection() {
    const { maps, load } = useMapStore();

    useEffect(() => {
        load();
    }, [load]);

    const recentMaps = maps.slice(0, 3);

    return (
        <section className="mb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <TreeStructure size={20} weight="regular" className="text-[var(--ink-dim)]" />
                    <h2 className="text-[18px] font-semibold tracking-tight text-[var(--ink)]">
                        Your Graphs
                    </h2>
                </div>

                <Link
                    href="/graph"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors group"
                >
                    <span>View all</span>
                    {maps.length > 0 && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-[var(--bg-muted)] font-medium text-[var(--ink-dim)]">
                            {maps.length}
                        </span>
                    )}
                    <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentMaps.length > 0 ? (
                    <>
                        {recentMaps.map((map: SavedMap) => {
                            const config = TYPE_CONFIG[map.type] || TYPE_CONFIG.oracle;
                            const title = cleanDisplayTitle(map.title);

                            return (
                                <Link
                                    key={map.id}
                                    href={map.href || '/graph'}
                                    className="group flex flex-col justify-between p-5 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[var(--ink-dim)] hover:shadow-sm transition-all hover:-translate-y-0.5 min-h-[155px]"
                                >
                                    {/* Top Row: Type Pill + Time */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--bg-muted)] text-[var(--ink)]">
                                            {config.icon}
                                            {config.label}
                                        </span>
                                        <span className="text-[12px] font-medium text-[var(--ink-dim)]">
                                            {timeAgo(map.updatedAt || map.createdAt)}
                                        </span>
                                    </div>

                                    {/* Clean Title */}
                                    <h3 className="font-semibold text-[16px] text-[var(--ink)] group-hover:text-[#EC4E02] transition-colors leading-[1.35] line-clamp-2 my-auto">
                                        {title}
                                    </h3>

                                    {/* Bottom Row: Node count + Action */}
                                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-soft)]">
                                        <span className="text-[12px] font-medium text-[var(--ink-dim)]">
                                            {map.nodeCount} {map.nodeCount === 1 ? 'node' : 'nodes'}
                                        </span>

                                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink)] group-hover:text-[#EC4E02] group-hover:translate-x-0.5 transition-all">
                                            <span>Open</span>
                                            <ArrowRight size={13} weight="bold" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Quick Connect card if < 3 maps */}
                        {recentMaps.length < 3 && (
                            <Link
                                href="/graph"
                                className="flex flex-col justify-between p-5 rounded-[20px] bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-soft)] hover:border-[var(--ink-dim)] transition-all hover:-translate-y-0.5 group min-h-[155px]"
                            >
                                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-dim)]">
                                    <Plus size={14} weight="bold" />
                                    <span>New Graph</span>
                                </div>

                                <div className="my-auto">
                                    <h3 className="font-semibold text-[16px] text-[var(--ink)] mb-1">
                                        Connect & Map Notes
                                    </h3>
                                    <p className="text-[13px] text-[var(--ink-dim)] leading-normal line-clamp-1">
                                        Build an archipelago or Oracle map.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end pt-3 border-t border-[var(--border-soft)]">
                                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink)] group-hover:translate-x-0.5 transition-all">
                                        <span>Explore</span>
                                        <ArrowRight size={13} weight="bold" />
                                    </span>
                                </div>
                            </Link>
                        )}
                    </>
                ) : (
                    /* Minimal Clean Empty State */
                    <Link
                        href="/graph"
                        className="col-span-1 md:col-span-3 p-6 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[var(--ink-dim)] transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--ink)]">
                                <TreeStructure size={22} weight="regular" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[16px] text-[var(--ink)]">
                                    Explore your visual knowledge graphs
                                </h3>
                                <p className="text-[13px] text-[var(--ink-dim)] mt-0.5">
                                    Synthesize notes into visual Oracle maps and interact with the AI Chatbot.
                                </p>
                            </div>
                        </div>

                        <span className="px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--bg-card)] text-[13px] font-bold shadow-sm group-hover:scale-[1.02] transition-transform flex items-center gap-1.5 shrink-0 ml-4">
                            <span>Open Graph Hub</span>
                            <ArrowUpRight size={14} weight="bold" />
                        </span>
                    </Link>
                )}
            </div>
        </section>
    );
}
