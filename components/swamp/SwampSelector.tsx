'use client';

import React, { useState } from 'react';
import { Skull, Users, Briefcase, Scales, ArrowRight, Sparkle, ShieldCheck, Eye, Lightning } from '@phosphor-icons/react';

const PACKAGES = [
  { 
    id: 'bauhaus', 
    name: 'The Bauhaus Council', 
    icon: <Sparkle size={20} />, 
    signal: '#32d74b',
    signalBg: 'rgba(50, 215, 75, 0.12)',
    signalBorder: 'rgba(50, 215, 75, 0.25)',
    description: 'Utility, Essentialism, and Industrial Ergonomics.',
    personasCount: 8
  },
  { 
    id: 'red-team', 
    name: 'The Red Team', 
    icon: <Skull size={20} />, 
    signal: '#ff453a',
    signalBg: 'rgba(255, 69, 58, 0.12)',
    signalBorder: 'rgba(255, 69, 58, 0.25)',
    description: 'Adversarial Analysis, Critical Risk, and Friction Points.',
    personasCount: 10
  },
  { 
    id: 'market-movers', 
    name: 'The Market Movers', 
    icon: <Briefcase size={20} />, 
    signal: '#0a84ff',
    signalBg: 'rgba(10, 132, 255, 0.12)',
    signalBorder: 'rgba(10, 132, 255, 0.25)',
    description: 'Business Economics, Distribution, and Monetization Loops.',
    personasCount: 6
  },
  { 
    id: 'deep-thinkers', 
    name: 'The Deep Thinkers', 
    icon: <Scales size={20} />, 
    signal: '#bf5af2',
    signalBg: 'rgba(191, 90, 242, 0.12)',
    signalBorder: 'rgba(191, 90, 242, 0.25)',
    description: 'Ethics, Cognitive Sovereignty, and Epistemic Humility.',
    personasCount: 6
  },
];

interface SwampSelectorProps {
  notes: { id: string, name: string }[];
  onStart: (noteId: string, packageId: string, options?: { stepGate: boolean }) => void;
  loading: boolean;
  preSelectedNoteId?: string;
}

export default function SwampSelector({ notes, onStart, loading, preSelectedNoteId }: SwampSelectorProps) {
  const [selectedNote, setSelectedNote] = useState(preSelectedNoteId || '');
  const [selectedPackage, setSelectedPackage] = useState('red-team');
  const [stepGateMode, setStepGateMode] = useState(true); // TSOT [SOT-COMP-2026] Step-Gate mode enabled by default

  React.useEffect(() => {
    if (preSelectedNoteId) {
      setSelectedNote(preSelectedNoteId);
    }
  }, [preSelectedNoteId]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* ── Header with Statutory Transparency Badge (EU AI Act Art. 50) ── */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4d00]/10 border border-[#ff4d00]/25 text-[#ff4d00] text-[10px] font-mono font-black uppercase tracking-[0.2em] mb-4">
          <ShieldCheck size={14} weight="fill" />
          <span>EU AI Act Art. 50 // Synthetic Simulation</span>
        </div>
        
        <h1 className="text-[34px] font-black tracking-tight text-[var(--ink)] mb-3 font-serif">
          Launch Swarm Simulation
        </h1>
        <p className="text-[var(--ink-secondary)] max-w-xl mx-auto text-[14px] leading-relaxed">
          Pressure-test your ideas against a social simulation of 30 specialized synthetic AI personas. 
          Unhappy paths, logic gaps, and systemic friction revealed spatially.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Step 1: Select Note */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#141414] border border-white/15 text-[var(--ink)] flex items-center justify-center font-bold text-[12px] font-mono">1</div>
            <h2 className="text-[16px] font-bold text-[var(--ink)]">Target Document</h2>
          </div>
          
          <select 
            style={{ colorScheme: 'dark' }}
            className="w-full p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--ink)] text-[14px] outline-none focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] transition-all cursor-pointer"
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
          >
            <option value="" disabled className="bg-[#14151a] text-white">Select a note to stress-test...</option>
            {notes.map(n => (
              <option key={n.id} value={n.id} className="bg-[#14151a] text-white">{n.name}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Cognitive Step-Gate Configuration (TSOT [SOT-COMP-2026]) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#141414] border border-white/15 text-[var(--ink)] flex items-center justify-center font-bold text-[12px] font-mono">2</div>
            <h2 className="text-[16px] font-bold text-[var(--ink)]">Verification Mode</h2>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${stepGateMode ? 'bg-[#ff4d00]/15 text-[#ff4d00]' : 'bg-white/5 text-gray-400'}`}>
                {stepGateMode ? <Eye size={20} weight="bold" /> : <Lightning size={20} />}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[var(--ink)]">
                  {stepGateMode ? 'Step-Gate Verification (Recommended)' : 'Instant Autonomous Synthesis'}
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)]">
                  {stepGateMode ? 'Inspects dissenting persona conflict points before applying.' : 'Dumps synthesized conclusions directly to canvas.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStepGateMode(!stepGateMode)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                stepGateMode 
                  ? 'bg-[#ff4d00] text-black shadow-md shadow-[#ff4d00]/20' 
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {stepGateMode ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Select Swarm Package */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#141414] border border-white/15 text-[var(--ink)] flex items-center justify-center font-bold text-[12px] font-mono">3</div>
            <h2 className="text-[16px] font-bold text-[var(--ink)]">Adversarial Logic Package</h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--ink-secondary)]">4 Specialized AI Councils</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PACKAGES.map(pkg => {
            const isSelected = selectedPackage === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg.id)}
                style={{
                  borderColor: isSelected ? pkg.signal : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-card)',
                  boxShadow: isSelected ? `0 0 20px ${pkg.signalBg}` : 'none'
                }}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                  isSelected ? 'scale-[1.01]' : 'hover:border-white/20'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: pkg.signalBg, color: pkg.signal, border: `1px solid ${pkg.signalBorder}` }}
                >
                  {pkg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-[14px] text-[var(--ink)]">{pkg.name}</span>
                    <span 
                      className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: pkg.signalBg, color: pkg.signal }}
                    >
                      {pkg.personasCount} AI AGENTS
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--ink-secondary)] leading-snug">{pkg.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Trigger */}
      <div className="flex flex-col items-center gap-3">
        <button
          disabled={!selectedNote || loading}
          onClick={() => onStart(selectedNote, selectedPackage, { stepGate: stepGateMode })}
          className={`flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-[13px] uppercase tracking-widest transition-all ${
            !selectedNote || loading
              ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
              : 'bg-[#ff4d00] text-black hover:bg-[#ff5d1a] hover:scale-[1.02] shadow-xl shadow-[#ff4d00]/25'
          }`}
        >
          {loading ? 'Simulating 30 AI Personas...' : 'Activate Swarm Simulation'}
          <ArrowRight size={18} weight="bold" />
        </button>

        <p className="text-[11px] font-mono text-[var(--ink-muted)]">
          Zero external data custody // Executed via client BYOK credentials
        </p>
      </div>
    </div>
  );
}
