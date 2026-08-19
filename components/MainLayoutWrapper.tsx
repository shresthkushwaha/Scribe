'use client';

import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [hasVisited, setHasVisited] = useState<boolean | null>(null);

    useEffect(() => {
        try {
            setHasVisited(!!localStorage.getItem('scribe_visited'));
        } catch {
            setHasVisited(true);
        }
    }, [pathname]);

    const isFullscreenGraph = pathname === '/landing' || (pathname === '/' && hasVisited === false) || pathname === '/graph/multi' || pathname === '/graph/v2' || (pathname.startsWith('/graph/') && pathname !== '/graph');

    return (
        <div className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden relative ${isFullscreenGraph ? 'p-0' : 'p-0 md:p-5 md:pl-0 lg:p-6 lg:pl-0'}`}>
            <main className="flex-1 h-full min-h-0 overflow-y-auto relative scroll-smooth">
                {children}
            </main>
        </div>
    );
}
