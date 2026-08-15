'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useNotesStore } from '@/lib/notesStore';
import { DataMigration } from './DataMigration';
import { FileText, Star, Archive, Trash, Plus, Hash, CaretLeft, CaretRight, Sun, Moon } from '@phosphor-icons/react';

function SidebarContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { notes, theme, setTheme } = useNotesStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('scribe-theme') as 'light' | 'dark';
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, [setTheme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    const navItems = [
        { label: 'All Notes', href: '/notes', icon: <FileText size={18} weight="regular" /> },
        { label: 'Starred', href: '/notes?filter=starred', icon: <Star size={18} weight="regular" /> },
        { label: 'Archive', href: '/notes?filter=archive', icon: <Archive size={18} weight="regular" /> },
        { label: 'Trash', href: '/notes?filter=trash', icon: <Trash size={18} weight="regular" /> },
        { label: 'Settings', href: '/settings', icon: <Hash size={18} weight="regular" /> }
    ];

    const uniqueTags = useMemo(() => {
        const m = new Map<string, number>();
        notes.forEach((n: any) => n.tags.forEach((t: string) => m.set(t, (m.get(t) ?? 0) + 1)));
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
    }, [notes]);

    if (pathname.startsWith('/graph')) return null;

    const colors = [
        'var(--tag-1, #E8A8A8)',
        'var(--tag-2, #A8C8E8)',
        'var(--tag-3, #A8E8BA)',
        'var(--tag-4, #E8D0A8)'
    ];

    return (
        <aside
            className={`hidden md:flex flex-col h-full transition-all duration-300 flex-shrink-0 z-40 relative`}
            style={{
                width: isCollapsed ? '80px' : '260px',
                padding: isCollapsed ? 'var(--space-l) var(--space-xs)' : 'var(--space-l) var(--space-m)'
            }}
        >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-[var(--space-xl)] relative group`}>
                {!isCollapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo-no-bg.svg" alt="Scribe" className="w-6 h-6 object-contain" />
                        <span className="font-serif text-[24px] font-semibold text-[var(--ink)] tracking-tight">
                            Scribe
                        </span>
                    </Link>
                )}
                {isCollapsed && (
                    <Link href="/" className="mx-auto block">
                        <img src="/logo-no-bg.svg" alt="Scribe" className="w-7 h-7 object-contain" />
                    </Link>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`absolute ${isCollapsed ? '-right-6 top-1' : '-right-[40px] top-1'} p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 shadow-sm`}
                >
                    {isCollapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-8 no-scrollbar">
                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const targetFilter = new URLSearchParams(item.href.split('?')[1] || '').get('filter');
                        const currentFilter = searchParams.get('filter');
                        const active = pathname === item.href.split('?')[0] && (currentFilter || null) === (targetFilter || null);
                        // Determine the icon weight based on active state
                        const iconToRender = active ? React.cloneElement(item.icon, { weight: "fill" }) : item.icon;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] transition-colors text-[14px] font-medium ${active ? 'bg-[var(--bg-lavender)] text-[var(--ink)]' : 'text-[var(--ink)] hover:bg-[var(--bg-muted)]'
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <div className={`${active ? 'text-[var(--ink)]' : 'text-[var(--ink-dim)]'}`} title={isCollapsed ? item.label : undefined}>
                                    {iconToRender}
                                </div>
                                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--ink-dim)] mb-3 pl-3">
                            Collections
                        </div>
                    )}
                    {uniqueTags.map(([tag], i) => (
                        <Link
                            key={tag}
                            href={`/notes?tag=${tag}`}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] transition-colors text-[14px] font-medium text-[var(--ink)] hover:bg-[var(--bg-muted)] ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} title={isCollapsed ? tag : undefined} />
                            {!isCollapsed && <span className="whitespace-nowrap">{tag}</span>}
                        </Link>
                    ))}
                    {!isCollapsed && (
                        <Link href="/notes" className={`flex items-center gap-3 px-3 py-2.5 border border-transparent rounded-[var(--radius-sm)] transition-colors text-[14px] font-medium text-[var(--ink)] hover:bg-[var(--bg-muted)] mt-1`}>
                            <Hash size={18} weight="bold" className="text-[var(--ink-dim)]" />
                            <span className="whitespace-nowrap">View All Tags</span>
                        </Link>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-6">
                <Link
                    href="/notes/new"
                    className={`flex justify-center items-center gap-2 p-3.5 w-full rounded-md text-[14px] font-semibold transition-transform hover:-translate-y-px shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${isCollapsed ? 'px-0' : ''}`}
                    style={{ background: 'var(--ink)', color: 'var(--bg-card)' }}
                    title={isCollapsed ? "New Note" : undefined}
                >
                    <Plus size={18} weight="bold" />
                    {!isCollapsed && 'New Note'}
                </Link>
            </div>
        </aside>
    );
}

export function Sidebar() {
    return (
        <Suspense fallback={<aside className="hidden md:flex flex-col h-screen w-[260px]" />}>
            <SidebarContent />
        </Suspense>
    );
}
