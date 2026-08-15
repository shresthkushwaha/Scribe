'use client';

import React from 'react';
import { Skull, Users, Briefcase, Scales, ArrowRight, Sparkle } from '@phosphor-icons/react';

const PACKAGES = [
  { id: 'bauhaus', name: 'The Bauhaus Council', icon: <Sparkle size={20} />, description: 'Utility, Essentialism, and Industrial Logic.' },
  { id: 'red-team', name: 'The Red Team', icon: <Skull size={20} />, description: 'Critical Analysis, Risk, and Market Resistance.' },
  { id: 'market-movers', name: 'The Market Movers', icon: <Briefcase size={20} />, description: 'Business Strategy, Virality, and Profitability.' },
  { id: 'deep-thinkers', name: 'The Deep Thinkers', icon: <Scales size={20} />, description: 'Ethics, Cognitive Sovereignty, and Wisdom.' },
];

interface SwampSelectorProps {
  notes: { id: string, name: string }[];
  onStart: (noteId: string, packageId: string) => void;
  loading: boolean;
  preSelectedNoteId?: string;
}

export default function SwampSelector({ notes, onStart, loading, preSelectedNoteId }: SwampSelectorProps) {
  const [selectedNote, setSelectedNote] = React.useState(preSelectedNoteId || '');
  const [selectedPackage, setSelectedPackage] = React.useState('red-team');

  React.useEffect(() => {
    if (preSelectedNoteId) {
      setSelectedNote(preSelectedNoteId);
    }
  }, [preSelectedNoteId]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12 text-center">
        <h1 className="text-[32px] font-black tracking-tight text-(--ink) mb-4">Launch Swarm Mode</h1>
        <p className="text-[#666] max-w-xl mx-auto leading-relaxed">
          Pressure-test your ideas against a social simulation of 30 specialized AI personas. 
          Unhappy paths, logic gaps, and systemic friction revealed spatially.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Step 1: Select Note */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-[14px]">1</div>
            <h2 className="text-[18px] font-bold text-(--ink)">Target Document</h2>
          </div>
          <select 
            className="w-full p-4 rounded-[20px] border border-[#eaeaec] bg-white text-[15px] outline-none focus:border-black transition-all"
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
          >
            <option value="" disabled>Select a note to stress-test...</option>
            {notes.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Swarm Package */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-[14px]">2</div>
            <h2 className="text-[18px] font-bold text-(--ink)">Swarm Logic</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {PACKAGES.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`flex items-start gap-4 p-4 rounded-[20px] border transition-all text-left ${selectedPackage === pkg.id ? 'border-black bg-black text-white' : 'border-[#eaeaec] bg-white hover:border-[#ccc]'}`}
              >
                <div className={`mt-1 ${selectedPackage === pkg.id ? 'text-white' : 'text-indigo-500'}`}>{pkg.icon}</div>
                <div>
                  <div className="font-bold text-[14px]">{pkg.name}</div>
                  <div className={`text-[12px] ${selectedPackage === pkg.id ? 'text-gray-300' : 'text-gray-500'}`}>{pkg.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 flex justify-center">
        <button
          disabled={!selectedNote || loading}
          onClick={() => onStart(selectedNote, selectedPackage)}
          className={`flex items-center gap-3 px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all ${!selectedNote ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-black hover:scale-105 shadow-xl hover:shadow-2xl'}`}
        >
          {loading ? 'Simulating Swarm...' : 'Activate Swamp Mode'}
          <ArrowRight size={20} weight="bold" />
        </button>
      </div>
    </div>
  );
}
