'use client';

import React, { useState } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import FeatureBento from '@/components/landing/FeatureBento';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LandingFooter from '@/components/landing/LandingFooter';
import WaitlistModal from '@/components/landing/WaitlistModal';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface LandingViewProps {
    onGetStarted?: () => void;
}

export default function LandingView({ onGetStarted }: LandingViewProps) {
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

    return (
        <div 
            data-theme="dark" 
            className={`dark min-h-screen w-full bg-[#07080a] text-[#cdcdcd] overflow-y-auto selection:bg-orange-500/30 selection:text-orange-400 ${inter.className}`}
            style={{ fontFeatureSettings: '"calt", "kern", "liga", "ss03"' }}
        >
            {/* Top Navigation */}
            <LandingNav onOpenWaitlist={() => setIsWaitlistOpen(true)} onGetStarted={onGetStarted} />

            {/* Main Landing Sections */}
            <main className="flex flex-col items-center w-full">
                {/* Hero Section with Dynamic Dithering Canvas */}
                <LandingHero onOpenWaitlist={() => setIsWaitlistOpen(true)} onGetStarted={onGetStarted} />

                {/* Bento Grid Feature Showcases */}
                <FeatureBento />

                {/* Pricing Section */}
                <LandingPricing onOpenWaitlist={() => setIsWaitlistOpen(true)} />

                {/* FAQ Section */}
                <LandingFAQ />

                {/* Closing Call To Action Section */}
                <LandingCTA onOpenWaitlist={() => setIsWaitlistOpen(true)} onGetStarted={onGetStarted} />
            </main>

            {/* Footer */}
            <LandingFooter />

            {/* Interactive Waitlist Modal */}
            <WaitlistModal
                isOpen={isWaitlistOpen}
                onClose={() => setIsWaitlistOpen(false)}
            />
        </div>
    );
}
