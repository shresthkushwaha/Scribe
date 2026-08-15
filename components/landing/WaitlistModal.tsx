'use client';

import React, { useState } from 'react';
import { X, CheckCircle, Sparkle, ArrowRight, ShieldCheck, EnvelopeSimple } from '@phosphor-icons/react';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Founder / Product Leader');
    const [submitted, setSubmitted] = useState(false);
    const [queueNumber, setQueueNumber] = useState<number>(3842);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;

        const num = Math.floor(2800 + Math.random() * 800);
        setQueueNumber(num);
        try {
            const list = JSON.parse(localStorage.getItem('scribe_waitlist_signups') || '[]');
            list.push({ email, role, date: Date.now(), queueNumber: num });
            localStorage.setItem('scribe_waitlist_signups', JSON.stringify(list));
        } catch {
            // Ignore storage errors
        }
        setSubmitted(true);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-[#14161A] p-8 md:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.7)] animate-in zoom-in-95 duration-200">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={20} weight="bold" />
                </button>

                {!submitted ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-400">
                            <Sparkle size={14} weight="fill" />
                            Early Studio Invitation
                        </div>

                        <h3 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-white mb-3 leading-tight">
                            Join the Scribe Studio
                        </h3>

                        <p className="text-[14px] text-white/60 max-w-sm mb-8 leading-relaxed font-sans">
                            Reserve your priority spot for the calmest, distraction-free spatial workspace for your writing, research, and non-linear ideas.
                        </p>

                        <form onSubmit={handleSubmit} className="w-full space-y-4">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                    <EnvelopeSimple size={18} weight="bold" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your work email..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-13 pl-11 pr-4 rounded-2xl bg-[#1C1F26] border border-white/10 text-[14px] text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-bold text-white/50 uppercase tracking-wider pl-1">
                                    Your Primary Use Case
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-[#1C1F26] border border-white/10 text-[13px] font-medium text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                                >
                                    <option className="bg-[#1C1F26]">Founder / Product Leader</option>
                                    <option className="bg-[#1C1F26]">Designer / Systems Thinker</option>
                                    <option className="bg-[#1C1F26]">Researcher / Knowledge Worker</option>
                                    <option className="bg-[#1C1F26]">Engineer / Technical Architect</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full h-13 rounded-2xl bg-[#EC4E02] text-white font-bold text-[14px] shadow-lg shadow-orange-500/25 hover:bg-[#d84400] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                <span>Request Early Access</span>
                                <ArrowRight size={16} weight="bold" />
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/50 pt-2">
                                <ShieldCheck size={14} weight="bold" className="text-emerald-400" />
                                <span>Zero spam. Direct invitation when ready.</span>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center py-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-5">
                            <CheckCircle size={36} weight="fill" />
                        </div>

                        <h3 className="font-serif text-3xl font-medium tracking-tight text-white mb-2">
                            You're on the list!
                        </h3>

                        <div className="my-5 p-4 rounded-2xl bg-[#1C1F26] border border-white/10 w-full">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                                Your Priority Spot
                            </div>
                            <div className="text-3xl font-mono font-bold text-orange-400">
                                #{queueNumber}
                            </div>
                        </div>

                        <p className="text-[14px] text-white/70 leading-relaxed mb-6">
                            We've reserved your spot for <span className="font-bold text-white">{email}</span>. You can test the open beta right now!
                        </p>

                        <button
                            onClick={onClose}
                            className="w-full h-12 rounded-full bg-white text-black font-bold text-[13px] hover:opacity-90 transition-all"
                        >
                            Got It & Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
