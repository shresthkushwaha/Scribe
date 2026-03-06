'use client';

import { useRef, useState } from 'react';
import { useNotesStore } from '@/lib/notesStore';
import { DownloadSimple, UploadSimple } from '@phosphor-icons/react';

export function DataMigration() {
    const { notes, upsert } = useNotesStore();
    const mdInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const handleMdImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setLoading(true);

        try {
            for (const file of files) {
                const text = await file.text();
                const title = file.name.replace(/\.md$/i, '');
                await upsert({
                    id: crypto.randomUUID(),
                    title: title,
                    body: text,
                    tags: ['imported'],
                    autoTags: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    starred: false,
                    archived: false,
                    trashed: false
                });
            }
            alert(`Successfully imported ${files.length} markdown files!`);
        } catch (error) {
            console.error(error);
            alert('Failed to import markdown files.');
        } finally {
            setLoading(false);
            if (mdInputRef.current) mdInputRef.current.value = '';
        }
    };

    const handleJsonExport = () => {
        try {
            const dataStr = JSON.stringify(notes, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `scribe-backup-${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } catch (err) {
            console.error('Export failed', err);
            alert('Failed to export notes.');
        }
    };

    const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);

        try {
            const text = await file.text();
            const importedNotes = JSON.parse(text);

            if (!Array.isArray(importedNotes)) throw new Error('Invalid JSON format');

            let count = 0;
            for (const note of importedNotes) {
                if (note.id && note.title !== undefined && note.body !== undefined) {
                    await upsert(note);
                    count++;
                }
            }
            alert(`Successfully restored ${count} notes from backup!`);
        } catch (error) {
            console.error(error);
            alert('Failed to restore from JSON backup. File might be corrupted.');
        } finally {
            setLoading(false);
            if (jsonInputRef.current) jsonInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <input type="file" accept=".md" multiple ref={mdInputRef} onChange={handleMdImport} className="hidden" />
            <input type="file" accept=".json" ref={jsonInputRef} onChange={handleJsonImport} className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                    onClick={() => mdInputRef.current?.click()}
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-(--border-soft) bg-(--bg-card) transition-all hover:bg-(--bg-muted) group text-center"
                >
                    <div className="p-3 rounded-full bg-(--bg-lavender) text-(--ink) transition-transform group-hover:scale-110">
                        <UploadSimple size={24} weight="bold" />
                    </div>
                    <div>
                        <div className="text-[15px] font-semibold text-(--ink)">Import .md</div>
                        <p className="text-[12px] text-(--ink-dim) mt-1">Import multiple Markdown files as notes</p>
                    </div>
                </button>

                <button
                    onClick={handleJsonExport}
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-(--border-soft) bg-(--bg-card) transition-all hover:bg-(--bg-muted) group text-center"
                >
                    <div className="p-3 rounded-full bg-(--bg-lavender) text-(--ink) transition-transform group-hover:scale-110">
                        <DownloadSimple size={24} weight="bold" />
                    </div>
                    <div>
                        <div className="text-[15px] font-semibold text-(--ink)">Backup Library</div>
                        <p className="text-[12px] text-(--ink-dim) mt-1">Export your entire library as a JSON backup</p>
                    </div>
                </button>

                <button
                    onClick={() => jsonInputRef.current?.click()}
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-(--border-soft) bg-(--bg-card) transition-all hover:bg-(--bg-muted) group text-center"
                >
                    <div className="p-3 rounded-full bg-(--bg-lavender) text-(--ink) transition-transform group-hover:scale-110">
                        <UploadSimple size={24} weight="bold" />
                    </div>
                    <div>
                        <div className="text-[15px] font-semibold text-(--ink)">Restore Library</div>
                        <p className="text-[12px] text-(--ink-dim) mt-1">Restore your library from a JSON backup file</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
