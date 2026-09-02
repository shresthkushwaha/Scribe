'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface LandingNavProps {
    onOpenWaitlist: () => void;
    onGetStarted?: () => void;
}

export default function LandingNav({ onOpenWaitlist, onGetStarted }: LandingNavProps) {
    const router = useRouter();

    const handleStart = () => {
        try {
            localStorage.setItem('scribe_visited', 'true');
        } catch {}
        if (onGetStarted) {
            onGetStarted();
        } else {
            router.push('/notes');
        }
    };

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1040px] px-3 py-2 bg-[#0d0d0d] border border-[#242728] rounded-[12px] shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between relative">
                
                {/* Brand Logo */}
                <div className="flex items-center gap-3">
                    <Link href="/landing" className="flex items-center gap-2 group">
                        <img src="/logo-no-bg.svg" alt="Scribe Logo" className="w-4 h-4 object-contain transition-transform group-hover:scale-110" />
                        <span className="font-sans text-[15px] font-semibold text-white tracking-tight">
                            Scribe
                        </span>
                    </Link>
                </div>

                {/* Nav Links */}
                <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6 text-[13px] font-medium text-[#8c8c8c]">
                    <a href="#features" className="hover:text-[#cdcdcd] transition-colors">
                        Features
                    </a>
                    <a href="#privacy" className="hover:text-[#cdcdcd] transition-colors">
                        Security
                    </a>
                    <a href="#pricing" className="hover:text-[#cdcdcd] transition-colors">
                        Pricing
                    </a>
                    <a href="#faq" className="hover:text-[#cdcdcd] transition-colors">
                        FAQ
                    </a>
                </nav>

                {/* CTAs */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleStart}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-semibold bg-[#ffffff] text-black hover:bg-[#e0e0e0] active:scale-95 transition-all shadow-none cursor-pointer"
                    >
                        <span>Try Beta</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-black" />
                    </button>
                </div>
            </div>
        </header>
    );
}
