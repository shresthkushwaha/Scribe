'use client';

import React, { useState, Suspense, lazy, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then((mod) => ({ default: mod.Dithering }))
);

export function HomeHeroCTA() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="pt-2 pb-8 md:pb-6 w-full flex justify-center items-center">
      <div
        className="w-full relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[36px] md:rounded-[40px] border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-lg min-h-[480px] md:min-h-[460px] flex flex-col items-center justify-center transition-all duration-500">
          
          {/* Dithering Shader Background */}
          {isMounted && (
            <Suspense fallback={<div className="absolute inset-0 bg-orange-500/5 backdrop-blur-xl" />}>
              <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-700">
                <Dithering
                  colorBack="#00000000" // Transparent
                  colorFront="#EC4E02"  // Accent Orange
                  shape="warp"
                  type="4x4"
                  speed={isHovered ? 0.6 : 0.2}
                  className="size-full"
                  minPixelRatio={1}
                />
              </div>
            </Suspense>
          )}

          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center py-10 md:py-10">
            
            {/* Status Tag */}
            <div className="mb-6 md:mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs md:text-sm font-semibold text-orange-500 backdrop-blur-sm shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Spatial Writing & Knowledge Studio
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-[var(--ink)] mb-6 md:mb-6 leading-[1.05]">
              Your thoughts, <br />
              <span className="opacity-80 italic">delivered in visual space.</span>
            </h1>
            
            {/* Description */}
            <p className="text-[var(--ink-dim)] text-base md:text-lg max-w-2xl mb-8 md:mb-8 leading-relaxed font-sans">
              Transform unstructured notes into living, interactive visual maps, concept graphs, and structured thoughts. Clean, precise, and uniquely yours.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto justify-center">
              <Link
                href="/notes/new"
                className="group relative inline-flex h-13 md:h-13 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-[#EC4E02] px-10 text-sm md:text-base font-bold text-white transition-all duration-300 hover:bg-[#d84400] hover:scale-105 active:scale-95 hover:ring-4 hover:ring-orange-500/20 shadow-lg shadow-orange-500/20"
              >
                <span className="relative z-10">Start Typing</span>
                <ArrowRight className="h-4 md:h-5 w-4 md:w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/graph"
                className="inline-flex h-13 md:h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)]/80 backdrop-blur-md px-8 text-sm md:text-base font-semibold text-[var(--ink)] hover:bg-[var(--bg-muted)] transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Compass className="w-4 h-4 text-orange-500" />
                <span>Explore Spatial Graphs</span>
              </Link>
            </div>

            {/* Sub-metric */}
            <div className="mt-8 flex items-center gap-2 text-xs font-medium text-[var(--ink-dim)]">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Bring Your Own Key (BYOK) • 100% Client-Side Private</span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
export default HomeHeroCTA;
