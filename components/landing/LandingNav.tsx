'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface LandingNavProps {
    onOpenWaitlist: () => void;
    onGetStarted?: () => void;
}

export default function LandingNav({ onOpenWaitlist, onGetStarted }: LandingNavProps) {
    const handleStart = () => {
        try {
            localStorage.setItem('scribe_visited', 'true');
        } catch {}
        if (onGetStarted) {
            onGetStarted();
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                {/* Brand Logo & Beta Tag */}
                <div className="flex items-center gap-3">
                    <Link href="/landing" className="flex items-center gap-2.5 group">
                        <img src="/logo-no-bg.svg" alt="Scribe Logo" className="w-7 h-7 object-contain transition-transform group-hover:scale-110" />
                        <span className="font-serif text-2xl font-semibold text-white tracking-tight">
                            Scribe
                        </span>
                    </Link>

                    <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-orange-500/20 bg-orange-500/10 text-orange-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Beta v2.4
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-white/60">
                    <a href="#features" className="hover:text-white transition-colors">
                        Thinking in Space
                    </a>
                    <a href="#oracle" className="hover:text-white transition-colors">
                        Concept Maps
                    </a>
                    <a href="#dialogue" className="hover:text-white transition-colors">
                        In-Canvas Dialogue
                    </a>
                    <a href="#privacy" className="hover:text-white transition-colors">
                        Privacy & Keys
                    </a>
                </nav>

                {/* CTAs */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenWaitlist}
                        className="hidden sm:inline-flex px-4 py-2 rounded-full text-[13px] font-semibold text-white/80 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
                    >
                        Join Waitlist
                    </button>

                    <Link
                        href="/notes"
                        onClick={handleStart}
                        className="group inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-bold bg-[#EC4E02] text-white hover:bg-[#d84400] active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                    >
                        <span>Open Beta</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
