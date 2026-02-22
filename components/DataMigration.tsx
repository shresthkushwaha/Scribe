'use client';

import { useRef, useState } from 'react';
import { useNotesStore } from '@/lib/notesStore';
import { DownloadSimple, UploadSimple } from '@phosphor-icons/react';

export function DataMigration({ isCollapsed }: { isCollapsed: boolean }) {
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
        <div className="flex flex-col gap-1 mt-6 pt-6 border-t border-[var(--border-soft)]">
            {!isCollapsed && (
                <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--ink-dim)] mb-2 pl-3">
                    Data
                </div>
            )}

            <input type="file" accept=".md" multiple ref={mdInputRef} onChange={handleMdImport} className="hidden" />
            <input type="file" accept=".json" ref={jsonInputRef} onChange={handleJsonImport} className="hidden" />

            <button
                onClick={() => mdInputRef.current?.click()}
                disabled={loading}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-(--radius-sm) transition-colors text-[14px] font-medium text-(--ink-dim) hover:bg-(--bg-muted) hover:text-(--ink) ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? "Import Markdown" : undefined}
            >
                <UploadSimple size={18} weight="bold" />
                {!isCollapsed && <span className="whitespace-nowrap">Import .md</span>}
            </button>

            <button
                onClick={handleJsonExport}
                disabled={loading}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-(--radius-sm) transition-colors text-[14px] font-medium text-(--ink-dim) hover:bg-(--bg-muted) hover:text-(--ink) ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? "Export JSON Backup" : undefined}
            >
                <DownloadSimple size={18} weight="bold" />
                {!isCollapsed && <span className="whitespace-nowrap">Backup Library</span>}
            </button>

            <button
                onClick={() => jsonInputRef.current?.click()}
                disabled={loading}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-(--radius-sm) transition-colors text-[14px] font-medium text-(--ink-dim) hover:bg-(--bg-muted) hover:text-(--ink) ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? "Restore from Backup" : undefined}
            >
                <UploadSimple size={18} weight="bold" />
                {!isCollapsed && <span className="whitespace-nowrap">Restore Library</span>}
            </button>
        </div>
    );
}
