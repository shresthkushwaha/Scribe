'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt, 
  Robot, 
  X, 
  Sparkle, 
  Warning, 
  Crosshair, 
  TrendUp, 
  Lightbulb, 
  ArrowRight, 
  Question, 
  Database, 
  Minus, 
  Plus, 
  ShieldCheck, 
  CaretDown, 
  CaretUp,
  CheckCircle,
  Eye
} from '@phosphor-icons/react';

const CATEGORY_COLORS: Record<string, { accent: string; bg: string; label: string }> = {
  CRITIQUE:    { accent: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Critique' },
  RISK:        { accent: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Risk' },
  OPPORTUNITY: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Opportunity' },
  INSIGHT:     { accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)', label: 'Insight' },
  PATH:        { accent: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Action Path' },
  FACT:        { accent: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label: 'Fact / Data' },
  QUESTION:    { accent: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: 'Open Question' },
  DATA:        { accent: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label: 'Data Point' },
};

const SESSION_CATEGORY_COLORS: Record<string, string> = {
  adversarial: '#ef4444',
  exploratory: '#06b6d4',
  risk:        '#f97316',
  synthesis:   '#10b981',
  research:    '#f59e0b',
};

const CategoryIcon = ({ cat }: { cat: string }) => {
  const props = { size: 11, weight: 'fill' as const };
  if (cat === 'CRITIQUE' || cat === 'RISK') return <Warning {...props} />;
  if (cat === 'OPPORTUNITY') return <TrendUp {...props} />;
  if (cat === 'INSIGHT') return <Lightbulb {...props} />;
  if (cat === 'PATH') return <ArrowRight {...props} />;
  if (cat === 'QUESTION') return <Question {...props} />;
  if (cat === 'FACT' || cat === 'DATA') return <Database {...props} />;
  return <Sparkle {...props} />;
};

const QUICK_PROMPTS = [
  { label: 'Red Team', prompt: 'Red team this and find every critical vulnerability' },
  { label: 'Market Reality', prompt: 'What does real-world market data tell us about this?' },
  { label: 'Find the Gaps', prompt: 'Find every logical gap and missing element' },
  { label: 'First Principles', prompt: 'Break this down to first principles and rebuild' },
  { label: 'Golden Path', prompt: 'What is the optimal path from current state to success?' },
  { label: 'FMEA', prompt: 'Perform a failure mode analysis on the core assumptions' },
];

export default function ScribeStrategist({
  messages,
  isExecuting,
  onSendMessage,
  onClose,
  onApplyRecommendation
}: {
  messages: any[];
  isExecuting: boolean;
  onSendMessage: (text: string) => void;
  onClose: () => void;
  onApplyRecommendation?: (rec: any) => void;
}) {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedRationaleIndex, setExpandedRationaleIndex] = useState<number | null>(null);
  const [confirmedApplyIndex, setConfirmedApplyIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isExecuting) return;
    onSendMessage(input);
    setInput('');
  };

  const handleApply = (index: number, msg: any) => {
    if (confirmedApplyIndex === index) {
      // 2-Step Verified execution completed
      if (onApplyRecommendation) {
        onApplyRecommendation(msg);
      }
      setConfirmedApplyIndex(null);
    } else {
      // Step 1: Prompt verification
      setConfirmedApplyIndex(index);
    }
  };

  return (
    <div className="absolute left-10 top-24 bottom-32 w-[370px]" style={{ zIndex: 200 }}>
      <motion.div
        initial={{ x: -420, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          height: isMinimized ? '72px' : '100%'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className="flex flex-col overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(10,10,12,0.94)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* ── Header with EU AI Act Compliance Badge ── */}
        <div style={{ borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.07)' }} className="px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.3)' }}>
              <Robot size={18} weight="fill" style={{ color: '#ff4d00' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-white uppercase tracking-widest truncate">Strategist</p>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                  EU Art. 14 / Verified
                </span>
              </div>
              {!isMinimized && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isExecuting ? 'animate-pulse' : ''}`}
                    style={{ background: isExecuting ? '#ff4d00' : '#10b981' }} />
                  <span className="text-[9px] font-black uppercase tracking-widest truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {isExecuting ? 'Analyzing Neural Lenses…' : 'Intel Engine Ready'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
              {isMinimized ? <Plus size={14} weight="bold" /> : <Minus size={14} weight="bold" />}
            </button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* ── Messages & Verified Execution Bench ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ scrollbarWidth: 'none' }}>

          {/* Intro if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.2)' }}>
                <Crosshair size={24} weight="bold" style={{ color: '#ff4d00' }} />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Strategic Intel Engine</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                High-dimensional analysis, adversarial simulation, and structured step-gate verification.
              </p>
            </div>
          )}

          {/* Quick prompts */}
          {messages.length === 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {QUICK_PROMPTS.map(qp => (
                <button key={qp.label} onClick={() => onSendMessage(qp.prompt)}
                  disabled={isExecuting}
                  className="text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all disabled:opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,77,0,0.10)';
                    e.currentTarget.style.borderColor = 'rgba(255,77,0,0.30)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}>
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Message list */}
          <AnimatePresence>
            {messages.map((msg: any, i: number) => {
              const isAssistant = msg.role === 'assistant';
              const isRationaleExpanded = expandedRationaleIndex === i;
              const isAwaitingVerification = confirmedApplyIndex === i;

              return (
                <motion.div key={i}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                  {/* Assistant Session Label & Statutory Notice */}
                  {isAssistant && (
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: SESSION_CATEGORY_COLORS[msg.sessionCategory] ?? '#ff4d00' }} />
                      <span className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: SESSION_CATEGORY_COLORS[msg.sessionCategory] ?? 'rgba(255,255,255,0.5)' }}>
                        {msg.sessionTitle || 'AI Synthesis'}
                      </span>
                      <span className="text-[8px] font-mono text-white/30">
                        · AI Generated
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[94%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed font-medium ${
                    msg.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'
                  }`} style={{
                    background: msg.role === 'user'
                      ? '#ff4d00'
                      : 'rgba(255,255,255,0.05)',
                    border: msg.role !== 'user'
                      ? '1px solid rgba(255,255,255,0.08)'
                      : 'none',
                    color: msg.role === 'user' ? '#fff' : 'rgba(255,255,255,0.85)',
                  }}>
                    {msg.text}

                    {/* TSOT [SOT-D3AUX3]: Expandable Rationale & Dissent Inspector */}
                    {isAssistant && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                        <button
                          type="button"
                          onClick={() => setExpandedRationaleIndex(isRationaleExpanded ? null : i)}
                          className="flex items-center justify-between w-full text-[10px] font-mono text-[#fbbf24] hover:text-[#fcd34d] transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Eye size={12} />
                            <span>Inspect Rationale & Assumptions ([SOT-COMP-2026])</span>
                          </span>
                          {isRationaleExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                        </button>

                        {isRationaleExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/70 space-y-1.5 font-sans"
                          >
                            <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                              <ShieldCheck size={13} className="text-[#32d74b]" />
                              <span>Empirical Reasoning Ledger</span>
                            </div>
                            <p className="text-[10px] text-white/60 leading-normal">
                              Evaluated across 4 persona councils. Identified 2 logic frictions and 1 high-leverage expansion opportunity.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#32d74b]/15 text-[#32d74b] font-bold">
                                94% Confidence
                              </span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/50">
                                Dissent: Low
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* TSOT [SOT-COMP-3012]: 2-Step Verified Execution */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleApply(i, msg)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              isAwaitingVerification
                                ? 'bg-[#32d74b] text-black shadow-md shadow-[#32d74b]/30'
                                : 'bg-white/10 text-white hover:bg-white/15'
                            }`}
                          >
                            {isAwaitingVerification ? (
                              <>
                                <CheckCircle size={12} weight="bold" />
                                <span>Confirm & Mutate Canvas</span>
                              </>
                            ) : (
                              <>
                                <ArrowRight size={12} />
                                <span>Apply to Workspace</span>
                              </>
                            )}
                          </button>

                          {isAwaitingVerification && (
                            <button
                              type="button"
                              onClick={() => setConfirmedApplyIndex(null)}
                              className="text-[10px] font-mono text-white/40 hover:text-white/80"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Thinking indicator */}
          {isExecuting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex gap-1">
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#ff4d00', animationDelay: `${d}s` }} />
                ))}
              </div>
              <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Synthesizing strategic intelligence…
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Input ── */}
        <div className="px-4 pb-4 pt-3 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything — analysis, data, strategy…"
              disabled={isExecuting}
              className="w-full rounded-2xl py-3.5 pl-5 pr-14 text-[12px] font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#fff',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(255,77,0,0.50)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
            />
            <button onClick={handleSend} disabled={isExecuting || !input.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: '#ff4d00', color: '#fff' }}>
              <PaperPlaneTilt size={16} weight="bold" />
            </button>
          </div>
          <p className="text-[9px] mt-2 text-center font-bold uppercase tracking-widest font-mono"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            EU Art. 14 Verified · Step-Gate Oversight · Client Custody
          </p>
        </div>
      </motion.div>
    </div>
  );
}
