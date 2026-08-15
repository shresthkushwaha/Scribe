'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { House, FileText, TreeStructure, Plus } from '@phosphor-icons/react';

export function MobileNav() {
    const pathname = usePathname();

    // Render MobileNav regardless of route so user can always navigate back.

    const navItems = [
        { label: 'Home', href: '/', icon: <House size={22} weight="regular" /> },
        { label: 'Library', href: '/notes', icon: <FileText size={22} weight="regular" /> },
        { label: 'Graph', href: '/graph', icon: <TreeStructure size={22} weight="regular" /> }
    ];

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between px-6 py-3 rounded-full shadow-[0_4px_24px_rgba(62,56,56,0.15)] border"
            style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderColor: 'var(--border-soft)',
            }}>
            {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const activeIcon = React.cloneElement(item.icon, { weight: active ? "fill" : "regular" });
                return (
                    <Link key={item.label} href={item.href}
                        className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[var(--ink)]' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'}`}>
                        {activeIcon}
                        <span className="text-[10px] font-semibold">{item.label}</span>
                    </Link>
                );
            })}
            <Link href="/notes/new" className="flex items-center justify-center w-11 h-11 rounded-full shadow-[0_4px_12px_rgba(62,56,56,0.2)] text-white transition-transform active:scale-95 ml-2"
                style={{ background: 'var(--ink)' }}>
                <Plus size={20} weight="bold" />
            </Link>
        </div>
    );
}
