'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface LandingPricingProps {
    onOpenWaitlist?: () => void;
}

export default function LandingPricing({ onOpenWaitlist }: LandingPricingProps) {
    return (
        <section id="pricing" className="py-20 max-w-5xl mx-auto px-4 md:px-6">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
                    Simple, transparent pricing.
                </h2>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans">
                    Start exploring your thoughts for free, or upgrade for cloud sync and advanced AI integration.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Free Plan */}
                <div className="rounded-[16px] border border-[#242728] bg-[#0d0d0d] p-8 flex flex-col">
                    <div className="mb-6">
                        <h3 className="font-serif text-xl sm:text-2xl font-medium text-white mb-2">Local / Free</h3>
                        <div className="text-[#cdcdcd] text-sm">Perfect for private, local-first thinking.</div>
                    </div>
                    
                    <div className="mb-8">
                        <span className="text-4xl font-bold text-white">$0</span>
                        <span className="text-white/50 text-sm ml-2">forever</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        {[
                            'Unlimited local notes & maps',
                            '100% Client-side privacy',
                            'Use local AI (Ollama, LM Studio)',
                            'Basic visual layouts',
                        ].map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-[#cdcdcd]">
                                <Check className="w-4 h-4 text-[#8c8c8c] shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button className="w-full py-2.5 rounded-[8px] text-[13px] font-semibold text-[#cdcdcd] hover:text-[#fff] hover:bg-[#101111] border border-[#242728] bg-[#07080a] transition-colors shadow-none">
                        Start for free
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="rounded-[16px] border border-[#242728] bg-[#101111] p-8 flex flex-col relative overflow-hidden">
                    {/* Subtle glow for Pro */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                    <div className="mb-6 relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-serif text-xl sm:text-2xl font-medium text-white">Scribe Pro</h3>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                Coming Soon
                            </span>
                        </div>
                        <div className="text-[#cdcdcd] text-sm">For power users and researchers.</div>
                    </div>
                    
                    <div className="mb-8 relative z-10 flex items-center gap-3">
                        <span className="text-4xl font-bold text-white">TBA</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1 relative z-10">
                        {[
                            'Everything in Local / Free',
                            'End-to-end encrypted cloud sync',
                            'Bring Your Own Key (Claude, OpenAI)',
                            'Advanced D3 physics engine controls',
                            'Priority support',
                        ].map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-[#cdcdcd]">
                                <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={onOpenWaitlist}
                        className="relative z-10 w-full py-2.5 rounded-[8px] text-[13px] font-semibold bg-[#ffffff] text-black hover:bg-[#e0e0e0] active:scale-95 transition-all shadow-none"
                    >
                        Join Waitlist
                    </button>
                </div>

            </div>
        </section>
    );
}
