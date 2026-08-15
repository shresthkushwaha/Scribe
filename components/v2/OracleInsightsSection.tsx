'use client';

import React, { useEffect, useState } from 'react';
import { getAllWorkspaces } from '@/lib/services/scribeV2Db';
import { GigaWorkbenchSession } from '@/lib/services/oracleGigaBrain';
import SessionMiniGraph from './SessionMiniGraph';
import { MagicWand, ClockCounterClockwise, ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';

export default function OracleInsightsSection() {
  const [sessions, setSessions] = useState<(GigaWorkbenchSession & { workspaceId: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        const workspaces = await getAllWorkspaces();
        const allSessions = workspaces.flatMap(ws => 
          (ws.oracleSessions || []).map(s => ({ ...s, workspaceId: ws.id }))
        );
        // Sort by most recent
        allSessions.sort((a, b) => b.timestamp - a.timestamp);
        console.log("🔍 [Oracle Insights] Total Sessions Found:", allSessions.length);
        setSessions(allSessions.slice(0, 6)); // Top 6 most recent
      } catch (e) {
        console.error("Failed to load global oracle insights:", e);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  if (loading) return (
    <div className="mb-12 p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  );

  if (sessions.length === 0) {
    return (
      <section className="mb-12 p-8 bg-gray-50 rounded-[32px] border border-[#eaeaec] border-dashed">
        <div className="flex items-center gap-2 mb-4">
          <MagicWand size={20} className="text-gray-400" />
          <h2 className="text-[14px] font-bold text-gray-500 uppercase tracking-widest">Oracle Insights</h2>
        </div>
        <p className="text-[13px] text-gray-400 italic">No analysis sessions found. Select notes to generate systemic insights.</p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <MagicWand size={24} weight="fill" className="text-indigo-500" />
          <h2 className="text-[18px] font-semibold tracking-tight text-(--ink)">Oracle Synthesis Insights</h2>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <div 
            key={session.id} 
            className="group relative bg-white p-6 rounded-[24px] border border-[#eaeaec] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${session.type === 'scamper' ? 'bg-indigo-500' : session.type === 'first-principles' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">{session.type}</span>
              </div>
              <span className="text-[9px] font-mono text-[#ccc] flex items-center gap-1">
                <ClockCounterClockwise size={10} />
                {new Date(session.timestamp).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-[16px] font-bold text-[#111] mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
              {session.title}
            </h3>

            <div className="mb-4 opacity-80 scale-[0.85] origin-top-left">
              <SessionMiniGraph session={session} />
            </div>

            <p className="text-[13px] text-[#555] leading-relaxed line-clamp-2 italic mb-4">
              "{session.summary}"
            </p>

            <Link 
              href={`/graph/v2?workspace=${session.workspaceId}`}
              className="mt-auto pt-4 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-[#777] group-hover:text-black transition-colors"
            >
              Enter Knowledge Map
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
