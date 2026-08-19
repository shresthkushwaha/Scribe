'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Layers, 
    MessageSquare, 
    KeyRound, 
    Compass, 
    ArrowUpRight, 
    Check, 
    ShieldCheck, 
    Sparkles
} from 'lucide-react';

export default function FeatureBento() {
    return (
        <section id="features" className="py-20 max-w-7xl mx-auto px-4 md:px-6">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 mb-4 border border-orange-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    How it works
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
                    A visual workspace for your ideas.
                </h2>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans">
                    Most tools trap your thoughts in rigid folders and endless documents. Scribe lets you spread out, connect the dots, and see the big picture.
                </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Large Card 1: Topographic Concept Mapping */}
                <div id="oracle" className="md:col-span-2 group relative overflow-hidden rounded-[16px] border border-[#242728] bg-[#0d0d0d] p-8 md:p-10 flex flex-col justify-between hover:border-[#383b3d] hover:bg-[#101111] hover:shadow-none transition-all duration-300">
                    <div className="relative z-10 max-w-lg mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center mb-5">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-medium text-white mb-3">
                            Visual Mind Maps
                        </h3>
                        <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6 font-sans">
                            Stop writing long, linear documents. Break your ideas down into visual clusters and watch them organize naturally on an interactive canvas.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-bold font-sans">
                            <span className="px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">Big Ideas</span>
                            <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">Main Themes</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Specific Details</span>
                        </div>
                    </div>

                    {/* Visual Graphic Representation */}
                    <div className="relative rounded-[12px] bg-[#07080a] border border-[#242728] p-5 overflow-hidden">
                        <div className="flex items-center justify-between text-xs font-mono text-white/50 pb-3 border-b border-white/10 mb-3">
                            <span>SPATIAL_TOPOGRAPHY // CONCEPT_GRAPH</span>
                            <span className="text-orange-400 font-bold">PHYSICS ENGINE</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {['Foundational Thesis', 'Supporting Vector', 'Actionable Step'].map((col, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-[#181A20] border border-white/10 shadow-xs">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400 mb-2 font-mono">
                                        0{i + 1}. {col}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="h-2 w-3/4 rounded-full bg-white/20" />
                                        <div className="h-2 w-1/2 rounded-full bg-white/10" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card 2: In-Canvas Dialogue */}
                <div id="dialogue" className="group relative overflow-hidden rounded-[16px] border border-[#242728] bg-[#0d0d0d] p-8 flex flex-col justify-between hover:border-[#383b3d] hover:bg-[#101111] hover:shadow-none transition-all duration-300">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-5">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-medium text-white mb-3">
                            Chat with your Notes
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed mb-6 font-sans">
                            Talk to your research directly inside your visual map. Ask questions, brainstorm new ideas, and easily drag those thoughts right onto the canvas.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0D0E12] border border-white/10 text-xs space-y-2.5 font-sans">
                        <div className="flex items-center gap-2 text-white font-semibold">
                            <span className="text-indigo-400">“</span>
                            <span>Expand the underlying mechanism...</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#181A20] border border-indigo-500/30 text-white/70 flex items-center justify-between">
                            <span>+ 4 connected nodes mapped</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">Attached</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Your Studio, Your Keys */}
                <div id="privacy" className="group relative overflow-hidden rounded-[16px] border border-[#242728] bg-[#0d0d0d] p-8 flex flex-col justify-between hover:border-[#383b3d] hover:bg-[#101111] hover:shadow-none transition-all duration-300">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-5">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-medium text-white mb-3">
                            100% Private & Secure
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed mb-6 font-sans">
                            Your data never leaves your device. Connect your own AI accounts or use local, offline AI models for completely private work.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 font-sans">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Keys stored locally in your browser</span>
                    </div>
                </div>

                {/* Card 4: Cross-Note Archipelagos */}
                <div className="md:col-span-2 group relative overflow-hidden rounded-[16px] border border-[#242728] bg-[#0d0d0d] p-8 md:p-10 flex flex-col justify-between hover:border-[#383b3d] hover:bg-[#101111] hover:shadow-none transition-all duration-300">
                    <div className="max-w-lg mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-5">
                            <Compass className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-medium text-white mb-3">
                            Connect the Dots
                        </h3>
                        <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans">
                            Select a group of notes and let the AI find the connections between them automatically. Discover hidden patterns and new ideas you might have missed.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 font-sans">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <Check className="w-4 h-4 text-purple-400" />
                            <span>PDF, DOCX, TXT & Markdown Auto-Parsing</span>
                        </div>

                        <Link 
                            href="/graph"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <span>Explore Graph Studio</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

            </div>
        </section>
    );
}
