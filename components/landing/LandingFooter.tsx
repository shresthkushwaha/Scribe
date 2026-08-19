'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingFooter() {
    return (
        <footer className="w-full border-t border-[#242728] py-12 px-6 bg-[#07080a]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                
                <div className="flex items-center gap-2.5">
                    <img src="/logo-no-bg.svg" alt="Scribe" className="w-6 h-6 object-contain" />
                    <span className="font-serif text-xl font-semibold text-white tracking-tight">
                        Scribe
                    </span>
                    <span className="text-xs text-white/50 ml-2">
                        © {new Date().getFullYear()} Scribe Intelligence. All rights reserved.
                    </span>
                </div>

                <div className="flex items-center gap-6 text-xs font-semibold text-white/60">
                    <Link href="/notes" className="hover:text-white transition-colors">
                        Notes Library
                    </Link>
                    <Link href="/graph" className="hover:text-white transition-colors">
                        Graph Hub
                    </Link>
                    <Link href="/settings" className="hover:text-white transition-colors">
                        BYOK Settings
                    </Link>
                </div>
            </div>
        </footer>
    );
}
