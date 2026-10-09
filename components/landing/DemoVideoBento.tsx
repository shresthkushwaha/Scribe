'use client';

import React, { useRef, useEffect } from 'react';

interface StepItem {
    id: string;
    step: string;
    title: string;
    subtitle: string;
    videoSrc: string;
    posterSrc: string;
    accent: string;
}

const STEPS: StepItem[] = [
    {
        id: 'api-key',
        step: '01',
        title: 'Set API Key',
        subtitle: 'Stored locally in your browser',
        videoSrc: '/demos/01-api-key.mp4',
        posterSrc: '/demos/01-api-key-poster.jpg',
        accent: '#f97316'
    },
    {
        id: 'upload-files',
        step: '02',
        title: 'Upload Files',
        subtitle: 'Markdown, PDFs, and raw text',
        videoSrc: '/demos/02-upload-files.mp4',
        posterSrc: '/demos/02-upload-files-poster.jpg',
        accent: '#10b981'
    },
    {
        id: 'select-make-graph',
        step: '03',
        title: 'Generate Graph',
        subtitle: 'Single or multi-file spatial synthesis',
        videoSrc: '/demos/03-select-make-graph.mp4',
        posterSrc: '/demos/03-select-make-graph-poster.jpg',
        accent: '#0ea5e9'
    },
    {
        id: 'workbench-protocols',
        step: '04',
        title: 'Run Protocols',
        subtitle: 'SCAMPER and strategic audits',
        videoSrc: '/demos/04-workbench-protocols.mp4',
        posterSrc: '/demos/04-workbench-protocols-poster.jpg',
        accent: '#a855f7'
    },
    {
        id: 'graph-chat',
        step: '05',
        title: 'Chat & Add Nodes',
        subtitle: 'Ask questions and inject live nodes',
        videoSrc: '/demos/05-graph-chat.mp4',
        posterSrc: '/demos/05-graph-chat-poster.jpg',
        accent: '#f43f5e'
    },
    {
        id: 'export',
        step: '06',
        title: 'Export & Share',
        subtitle: 'High-res maps and clean markdown',
        videoSrc: '/demos/06-export.mp4',
        posterSrc: '/demos/06-export-poster.jpg',
        accent: '#14b8a6'
    }
];

function LoopingVideoCard({ step }: { step: StepItem }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.loop = true;
        const playPromise = v.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    }, []);

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[#242728] bg-[#0c0d10] hover:border-[#42464a] hover:bg-[#101116] transition-all duration-300 shadow-xl">
            
            {/* Window Frame Bar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/5 bg-[#08090b]">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-white/50">
                    <span style={{ color: step.accent }}>{step.step}</span>
                    <span className="text-white/20">/</span>
                    <span className="text-white/80 font-sans text-[11px] font-semibold tracking-tight">{step.title}</span>
                </div>
            </div>

            {/* Edge-to-edge Uncropped 16:9 Video Container */}
            <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                <video
                    ref={videoRef}
                    src={step.videoSrc}
                    poster={step.posterSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain block"
                />
            </div>

            {/* Minimal Subtitle Footer */}
            <div className="px-4 py-3 bg-[#0c0d10] border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-white/60 font-sans tracking-tight truncate">
                    {step.subtitle}
                </p>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.accent }} />
            </div>
        </div>
    );
}

export default function DemoVideoBento() {
    return (
        <section id="demo-guide" className="py-16 md:py-24 max-w-6xl mx-auto px-4 md:px-6 w-full">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400 mb-2 block">
                    Workflow Guide
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white mb-3">
                    How Scribe works
                </h2>
                <p className="text-white/60 text-sm sm:text-base font-sans">
                    From raw files to interactive spatial intelligence in 6 simple steps.
                </p>
            </div>

            {/* Clean Paired Grid (2 Cards Per Row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {STEPS.map((step) => (
                    <LoopingVideoCard key={step.id} step={step} />
                ))}
            </div>

        </section>
    );
}
