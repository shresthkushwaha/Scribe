'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotesStore } from '@/lib/notesStore';
import { useMapStore } from '@/lib/mapStore';
import { buildArchipelagoGraph } from '@/lib/graphEngine';
import GraphCanvas from '@/components/GraphCanvas';
import React, { Suspense } from 'react';

function MultiGraphContent() {
    const { notes, loaded, load } = useNotesStore();
    const { recordMap } = useMapStore();
    const searchParams = useSearchParams();

    useEffect(() => { load(); }, []);

    const ids = useMemo(() =>
        (searchParams.get('ids') || '').split(',').filter(Boolean),
        [searchParams]);

    const selectedNotes = useMemo(() =>
        notes.filter(n => ids.includes(n.id)),
        [notes, ids]);

    const { nodes, links } = useMemo(() => {
        if (selectedNotes.length < 2) return { nodes: [], links: [] };
        return buildArchipelagoGraph(
            selectedNotes.map(n => ({ id: n.id, title: n.title || 'Untitled', body: n.body }))
        );
    }, [selectedNotes]);

    useEffect(() => {
        if (selectedNotes.length < 2) return;
        const sortedIds = [...ids].sort().join(',');
        recordMap({
            id: `archipelago-${sortedIds}`,
            title: selectedNotes.map(n => n.title || 'Untitled').join(' + '),
            type: 'multi',
            noteIds: ids,
            noteTitles: selectedNotes.map(n => n.title || 'Untitled'),
            nodeCount: nodes.length,
            linkCount: links.length,
            previewExcerpt: `Cross-note archipelago connecting ${selectedNotes.length} notes.`,
            href: `/graph/multi?ids=${ids.join(',')}`,
        });
    }, [ids, selectedNotes, nodes.length, links.length, recordMap]);

    if (!loaded) {
        return (
            <div className="fixed inset-0 bg-[#080808] flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-white/20 border-t-white/60 animate-spin" />
            </div>
        );
    }

    if (selectedNotes.length < 2) {
        return (
            <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
                <p className="text-zinc-600 font-mono text-sm">Select at least 2 notes to compare.</p>
                <Link href="/graph" className="text-zinc-400 hover:text-white font-mono text-sm underline underline-offset-4 transition-colors">
                    Go to Archipelago picker
                </Link>
            </div>
        );
    }

    return (
        <GraphCanvas
            nodes={nodes}
            links={links}
            isArchipelago={true}
            title={selectedNotes.map(n => n.title).join(', ')}
            backHref="/notes"
            sourceContent={selectedNotes.map(n => `Title: ${n.title}\nContent: ${n.body}`).join('\n\n---\n\n')}
            noteId={ids[0]}
        />
    );
}

export default function MultiGraphPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-[#080808] flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-white/20 border-t-white/60 animate-spin" />
            </div>
        }>
            <MultiGraphContent />
        </Suspense>
    );
}
