'use client';

import React, { useState, Suspense, lazy, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Compass } from 'lucide-react';

import GradientBarsBackground from '@/components/ui/gradient-bars-background';

import { createClient } from '@/lib/supabase/browser';

interface LandingHeroProps {
  onOpenWaitlist: () => void;
  onGetStarted?: () => void;
}

export default function LandingHero({ onOpenWaitlist, onGetStarted }: LandingHeroProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/notes`,
      },
    });
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
                onClick={handleGoogleSignIn}
                className="group relative inline-flex h-14 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-10 text-base font-bold text-slate-900 transition-all duration-300 hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-xl"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="relative z-10">Sign in with Google</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </GradientBarsBackground>
  );
}
