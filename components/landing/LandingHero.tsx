'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import GradientBarsBackground from '@/components/ui/gradient-bars-background';

interface LandingHeroProps {
  onOpenWaitlist: () => void;
  onGetStarted?: () => void;
}

export default function LandingHero({ onOpenWaitlist, onGetStarted }: LandingHeroProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <GradientBarsBackground numBars={15} gradientFrom="#EC4E02" backgroundColor="#07080a">
      <div className="w-full max-w-7xl relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="relative flex flex-col items-center justify-center transition-all duration-500 min-h-[400px] md:min-h-[520px]">

          {/* Center Content */}
          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center py-12 md:py-12">
            
            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-6 leading-[1.05]">
              Map complex ideas. <br />
              <span className="text-white/70 italic">Build better strategies.</span>
            </h1>
            
            {/* Description */}
            <p className="text-white/70 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-sans">
              A visual workspace to connect your thoughts, test your ideas, and see the big picture. Escape the limits of traditional documents.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mt-4">
              <button
                onClick={handleStart}
                className="group relative inline-flex h-14 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-10 text-base font-bold text-slate-900 transition-all duration-300 hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
              >
                <span className="relative z-10">Try Beta</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1 text-slate-900" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </GradientBarsBackground>
  );
}
