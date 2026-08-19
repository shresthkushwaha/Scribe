'use client';

import React, { useState, Suspense, lazy, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

import GradientBarsBackground from '@/components/ui/gradient-bars-background';

interface LandingCTAProps {
  onOpenWaitlist: () => void;
  onGetStarted?: () => void;
}

export default function LandingCTA({ onOpenWaitlist, onGetStarted }: LandingCTAProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleStart = () => {
    try {
      localStorage.setItem('scribe_visited', 'true');
    } catch {}
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <section className="py-20 w-full flex justify-center items-center px-4 md:px-6">
      <div
        className="w-full max-w-7xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[16px] border border-[#242728] bg-[#0d0d0d] shadow-none flex flex-col items-center justify-center transition-all duration-500">
          <GradientBarsBackground numBars={10} gradientFrom="#ffffff" backgroundColor="transparent">
            <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center py-20">

            {/* Headline */}
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-6 leading-[1.08]">
              Write and organize <br />
              <span className="text-white/70 italic">your ideas freely.</span>
            </h2>
            
            {/* Description */}
            <p className="text-white/70 text-sm md:text-base max-w-xl mb-10 leading-relaxed font-sans">
              No subscriptions. No locked cloud databases. A fast, private visual canvas built for your thoughts.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <Link
                href="/notes"
                onClick={handleStart}
                className="group relative inline-flex h-14 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-[8px] bg-[#ffffff] px-10 text-base font-bold text-black transition-all duration-300 hover:bg-[#e0e0e0] hover:scale-105 active:scale-95 shadow-none"
              >
                <span className="relative z-10">Start Typing</span>
                <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1 text-black" />
              </Link>

              <button
                onClick={onOpenWaitlist}
                className="inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-[8px] border border-[#242728] bg-[#0d0d0d] px-8 text-base font-semibold text-[#cdcdcd] hover:text-white hover:bg-[#101111] transition-all hover:scale-105 active:scale-95 shadow-none"
              >
                <Compass className="w-4 h-4 text-orange-400" />
                <span>Join Waitlist</span>
              </button>
            </div>

            </div>
          </GradientBarsBackground>
        </div>
      </div>
    </section>
  );
}
