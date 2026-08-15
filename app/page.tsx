'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function HomePage() {
    const { notes, loaded, load } = useNotesStore();
    const router = useRouter();
    const [search, setSearch] = useState('');

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!search) return notes;
        const s = search.toLowerCase();
        return notes.filter((n: Note) => n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s));
    }, [notes, search]);

    // Categorize for the dashboard view based on refined UX requirements
    const starredNotes = useMemo(() => filtered.filter((n: Note) => n.starred), [filtered]);
    const recentActiveNotes = useMemo(() => {
        // Exclude archived notes from the main recent list unless specifically searched
        return filtered
            .filter((n: Note) => !n.archived)
            .sort((a: Note, b: Note) => b.updatedAt - a.updatedAt);
    }, [filtered]);

    if (!loaded) return null;

    const renderCard = (note: Note, defaultBorderColor: string) => {
        const excerpt = note.body.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]]/g, '').slice(0, 150) + '...';
        const borderColor = note.color || defaultBorderColor;

        return (
            <div
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="group relative flex flex-col p-5 bg-[var(--bg-card)] rounded-xl cursor-pointer transition-all hover:shadow-md"
                style={{
                    border: '1px solid var(--border-soft)',
                    minHeight: '200px'
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl" style={{ backgroundColor: borderColor }} />

                <h3 className="font-semibold text-[16px] leading-tight mb-3 mt-1" style={{ color: 'var(--text-1)' }}>
                    {note.title || 'Untitled Note'}
                </h3>

                <p className="text-[13px] leading-relaxed mb-4 flex-1 overflow-hidden" style={{ color: 'var(--text-3)' }}>
                    {excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-4)' }}>
                        {timeAgo(note.updatedAt)}
                    </span>
                    <button className="text-[var(--text-4)] hover:text-[var(--text-2)] p-1 rounded transition-colors"
                        onClick={(e) => { e.stopPropagation(); /* TODO popup menu */ }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                    </button>
                </div>
            </div>
        );
    };

    const renderSection = (title: string, items: Note[], defaultBorderColor: string, icon: React.ReactNode, hideEmpty: boolean = false) => {
        if (hideEmpty && items.length === 0) return null;

        return (
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        {icon}
                        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-1)' }}>{title}</h2>
                    </div>
                </div>
                {items.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <Link href={`/notes/new`}
                            className="flex flex-col items-center justify-center p-5 bg-[var(--bg-card)] rounded-xl cursor-pointer transition-all hover:border-[var(--text-3)] group"
                            style={{ border: '1px dashed var(--border)', minHeight: '200px' }}>
                            <div className="flex items-center gap-2 text-[var(--text-4)] group-hover:text-[var(--text-2)] transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                <span className="font-medium text-[14px]">New note</span>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {items.slice(0, 8).map(n => renderCard(n, defaultBorderColor))}
                    </div>
                )}
            </section>
        );
    };

    return (
        <div className="min-h-full flex flex-col max-w-[1400px] mx-auto w-full p-6 md:p-8 lg:p-10">
            {/* Header Greeting & Search */}
            <header className="mb-10">
                <h1 className="text-[17px] mb-6 font-medium" style={{ color: 'var(--text-2)' }}>
                    Hola there 👋
                </h1>
                <div className="relative w-full shadow-sm rounded-xl overflow-hidden flex items-center bg-[var(--bg-card)] border"
                    style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="pl-4 text-[var(--text-3)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search something or use AI"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 bg-transparent outline-none px-4 text-[15px] placeholder-[var(--text-4)] text-[var(--text-1)]"
                    />
                    <div className="pr-4 text-[var(--text-4)] hidden sm:block">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </div>
                </div>
            </header>

            {/* Content Sections */}
            {renderSection('Starred', starredNotes, '#eab308', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>, true)}
            {renderSection('Recent Notes', recentActiveNotes, 'var(--border)', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>)}

        </div>
    );
}
