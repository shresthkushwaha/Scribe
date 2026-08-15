'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
    const pathname = usePathname();

    // Render MobileNav regardless of route so user can always navigate back.

    const navItems = [
        { label: 'Home', href: '/', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
        { label: 'Library', href: '/notes', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg> },
        { label: 'Graph', href: '/graph', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg> }
    ];

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between px-6 py-3 rounded-full shadow-lg border"
            style={{
                background: 'rgba(245,243,238,0.92)',
                backdropFilter: 'blur(16px)',
                borderColor: 'var(--border)',
            }}>
            {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                    <Link key={item.label} href={item.href}
                        className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}`}>
                        {item.icon}
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
            <Link href="/notes/new" className="flex items-center justify-center w-10 h-10 rounded-full shadow-md text-white transition-transform active:scale-95"
                style={{ background: 'var(--text-1)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </Link>
        </div>
    );
}
