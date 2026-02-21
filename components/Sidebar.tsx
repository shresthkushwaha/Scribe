'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotesStore } from '@/lib/notesStore';

export function Sidebar() {
    const pathname = usePathname();
    const { notes } = useNotesStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { label: 'All Notes', href: '/notes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg> },
        { label: 'Starred', href: '/notes?filter=starred', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
        { label: 'Archive', href: '/notes?filter=archive', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg> },
        { label: 'Trash', href: '/notes?filter=trash', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> }
    ];

    const recentNotes = notes.slice(0, 5);

    // Compute unique tags from all notes to display as dynamic "Workspaces"
    const uniqueTags = useMemo(() => {
        const m = new Map<string, number>();
        notes.forEach((n: any) => n.tags.forEach((t: string) => m.set(t, (m.get(t) ?? 0) + 1)));
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
    }, [notes]);

    // Hide sidebar entirely on graph routes (graph canvas taking full screen)
    if (pathname.startsWith('/graph')) return null;

    return (
        <aside
            className={`hidden md:flex flex-col border-r h-screen transition-all duration-300 bg-[var(--bg)] flex-shrink-0 z-40`}
            style={{
                width: isCollapsed ? '64px' : '260px',
                borderColor: 'var(--border-soft)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 h-14">
                {!isCollapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--text-1)] flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" /><polygon points="18 2 22 6 12 16 8 16 8 12 18 2" /></svg>
                        </div>
                        <span className="font-serif italic text-lg tracking-tight pt-1" style={{ color: 'var(--text-1)' }}>
                            Scribe
                        </span>
                    </Link>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-md text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-muted)] transition-colors ml-auto flex-shrink-0"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-6 p-3">
                {/* Core Navigation */}
                <nav className="flex flex-col gap-0.5">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center h-8 px-2 rounded-md transition-all text-[13px] font-medium ${active ? 'bg-[var(--bg-muted)] text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-muted)]/50'
                                    }`}
                            >
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" title={isCollapsed ? item.label : undefined}>
                                    {item.icon}
                                </div>
                                {!isCollapsed && <span className="ml-2 whitespace-nowrap">{item.label}</span>}
                                {!isCollapsed && item.label === 'Notifications' && (
                                    <span className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-[var(--accent-red)] text-white text-[9px] font-bold">
                                        6
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="h-px w-full" style={{ background: 'var(--border-soft)' }} />

                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <h3 className="px-2 text-[11px] font-semibold tracking-wider text-[var(--text-4)] uppercase mb-1">
                            Workspaces
                        </h3>
                    )}
                    {uniqueTags.map(([tag]) => (
                        <Link
                            key={tag}
                            href={`/notes?tag=${tag}`}
                            className={`flex items-center h-8 px-2 rounded-md transition-all text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--bg-muted)]/50`}
                        >
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-[var(--text-3)]">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </div>
                            {!isCollapsed && <span className="ml-2 whitespace-nowrap">{tag}</span>}
                        </Link>
                    ))}
                    {!isCollapsed && (
                        <Link href="/notes" className="flex items-center h-8 px-2 rounded-md transition-all text-[13px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] mt-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            View All Tags
                        </Link>
                    )}
                </div>

                {/* Recent Notes */}
                {!isCollapsed && recentNotes.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                        <h3 className="px-2 text-[11px] font-semibold tracking-wider text-[var(--text-4)] uppercase mb-1">
                            Recent Notes
                        </h3>
                        {recentNotes.map((note) => (
                            <Link
                                key={note.id}
                                href={`/notes/${note.id}`}
                                className="flex items-center h-8 px-2 rounded-md transition-all text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-muted)]/50 truncate"
                            >
                                <span className="truncate pr-2">{note.title || 'Untitled Note'}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 mt-auto">
                <Link
                    href="/notes/new"
                    className="flex justify-center items-center h-9 w-full rounded-lg shadow-sm font-medium text-[13px] transition-all hover:scale-[0.98] active:scale-[0.96]"
                    style={{ background: 'var(--text-1)', color: 'var(--bg)' }}
                >
                    {isCollapsed ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    ) : (
                        '+ New note'
                    )}
                </Link>
            </div>
        </aside>
    );
}
