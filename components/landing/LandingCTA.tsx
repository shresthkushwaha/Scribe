'use client';

import React, { useState, Suspense, lazy, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then((mod) => ({ default: mod.Dithering }))
);

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
        <div className="relative overflow-hidden rounded-[40px] md:rounded-[48px] border border-white/10 bg-[#121316] shadow-2xl min-h-[520px] md:min-h-[560px] flex flex-col items-center justify-center transition-all duration-500">
          
          {/* Dynamic Dithering Background */}
          {isMounted && (
            <Suspense fallback={<div className="absolute inset-0 bg-orange-500/5 backdrop-blur-2xl" />}>
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen transition-opacity duration-700">
                <Dithering
                  colorBack="#00000000" // Transparent
                  colorFront="#EC4E02"  // Accent
                  shape="warp"
                  type="4x4"
                  speed={isHovered ? 0.6 : 0.2}
                  className="size-full"
                  minPixelRatio={1}
                />
              </div>
            </Suspense>
          )}

          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center py-10">
            
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-400 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span>Personal Knowledge Studio</span>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-6 leading-[1.08]">
              Write, structure, and explore <br />
              <span className="text-white/70 italic">without boundaries.</span>
            </h2>
            
            {/* Description */}
            <p className="text-white/70 text-base md:text-lg max-w-xl mb-10 leading-relaxed font-sans">
              No subscriptions. No locked cloud databases. A fast, private visual canvas built for depth and thoughtful craftsmanship.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <Link
                href="/notes"
                onClick={handleStart}
                className="group relative inline-flex h-14 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-[#EC4E02] px-10 text-base font-bold text-white transition-all duration-300 hover:bg-[#d84400] hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/25"
              >
                <span className="relative z-10">Start Typing</span>
                <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <button
                onClick={onOpenWaitlist}
                className="inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-8 text-base font-semibold text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Compass className="w-4 h-4 text-orange-400" />
                <span>Join Waitlist</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
