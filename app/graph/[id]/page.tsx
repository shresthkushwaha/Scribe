'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useNotesStore } from '@/lib/notesStore';
import { processJournalData } from '@/lib/graphEngine';
import GraphCanvas from '@/components/GraphCanvas';

export default function SingleNoteGraphPage() {
    const { id } = useParams<{ id: string }>();
    const { notes, loaded, load } = useNotesStore();

    useEffect(() => { load(); }, []);

    const note = notes.find(n => n.id === id);

    const { nodes, links } = useMemo(() => {
        if (!note?.body) return { nodes: [], links: [] };

        // 1. Calculate global degree across entire knowledge base
        const allData = notes.reduce((acc, n) => {
            acc[n.id] = { journal: n.body, todos: [] };
            return acc;
        }, {} as Record<string, any>);
        const { links: globalLinks } = processJournalData(allData);

        const degMap = new Map<string, number>();
        globalLinks.forEach(l => {
            const sid = (l.source as any).id ?? l.source;
            const tid = (l.target as any).id ?? l.target;
            degMap.set(sid, (degMap.get(sid) || 0) + 1);
            degMap.set(tid, (degMap.get(tid) || 0) + 1);
        });

        // 2. Calculate local sub-graph
        const today = new Date().toISOString().split('T')[0];
        const res = processJournalData({ [today]: { journal: note.body, todos: [] } });

        // 3. Inject global connection density into local nodes
        res.nodes.forEach(n => {
            n.globalDegree = degMap.get(n.id) || 0;
        });

        return res;
    }, [note?.body, notes]);

    if (!loaded) {
        return (
            <div className="fixed inset-0 bg-[#080808] flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-white/20 border-t-white/60 animate-spin" />
            </div>
        );
    }

    return (
        <GraphCanvas
            nodes={nodes}
            links={links}
            title={note?.title || 'Untitled'}
            backHref={`/notes/${id}`}
        />
    );
}
