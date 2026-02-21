'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotesStore } from '@/lib/notesStore';
import type { Note } from '@/lib/notesStore';

// Simple auto-tag suggestions: pick frequent capitalized words from body
function suggestTags(body: string, existing: string[]): string[] {
    const words = body.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
    const freq = new Map<string, number>();
    words.forEach(w => { const k = w.toLowerCase(); freq.set(k, (freq.get(k) ?? 0) + 1); });
    return [...freq.entries()]
        .filter(([k, v]) => v >= 2 && !existing.includes(k))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k]) => k);
}

function wc(s: string) { return s.trim().split(/\s+/).filter(Boolean).length; }

export default function NoteEditorPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const router = useRouter();
    const { notes, loaded, load, upsert, remove, toggleStar, toggleArchive, moveToTrash, restoreFromTrash } = useNotesStore();

    const currentNote: Note | undefined = useMemo(() => notes.find((n: Note) => n.id === id), [notes, id]);

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [color, setColor] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [preview, setPreview] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Manage noteId explicitly; crucial for new vs existing
    const isNew = id === 'new';
    const [noteId] = useState<string>(isNew ? crypto.randomUUID() : (id as string));
    const isDeleting = useRef(false);

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (!loaded) return;
        if (isNew) return;
        if (!currentNote) { router.replace('/notes'); return; }
        setTitle(currentNote.title);
        setBody(currentNote.body);
        setTags(currentNote.tags);
        setColor(currentNote.color);
    }, [loaded, currentNote, isNew, router]);

    const autoTags = useMemo(() => {
        if (!body) return [];
        return suggestTags(body, tags);
    }, [body, tags]);

    const save = useCallback(async () => {
        if (!loaded || isDeleting.current) return;
        setSaving(true);
        try {
            const now = Date.now();
            const note: Note = {
                id: noteId,
                title: title.trim() || 'Untitled',
                body,
                tags,
                autoTags: autoTags,
                createdAt: currentNote?.createdAt || now,
                updatedAt: now,
                starred: currentNote?.starred || false,
                archived: currentNote?.archived || false,
                trashed: currentNote?.trashed || false,
                color: color,
            };
            await upsert(note);
            if (isNew) {
                router.replace(`/notes/${noteId}`);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
        } finally {
            setSaving(false);
        }
    }, [loaded, isNew, noteId, title, body, tags, autoTags, upsert, currentNote, color, router]);

    useEffect(() => {
        const t = setTimeout(() => save(), 2000);
        return () => clearTimeout(t);
    }, [title, body, tags, color, save]);

    function addTag(raw: string) {
        const t = raw.trim().toLowerCase().replace(/\s+/g, '-');
        if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
        setTagInput('');
    }

    function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)); }

    const handleDelete = async () => {
        if (!currentNote) return;
        if (currentNote.trashed) {
            if (confirm('Permanently delete this note?')) {
                isDeleting.current = true;
                await remove(currentNote.id);
                router.push('/notes?filter=trash');
            }
        } else {
            isDeleting.current = true;
            await moveToTrash(currentNote.id);
            router.push('/notes');
        }
    };

    const handleToggleStar = async () => {
        if (!currentNote) return;
        await toggleStar(currentNote.id);
    };

    const handleToggleArchive = async () => {
        if (!currentNote) return;
        await toggleArchive(currentNote.id);
        router.push('/notes');
    };

    const availableColors = [
        { name: 'Default', value: undefined },
        { name: 'Red', value: '#fee2e2' },
        { name: 'Orange', value: '#ffedd5' },
        { name: 'Yellow', value: '#fef9c3' },
        { name: 'Green', value: '#dcfce7' },
        { name: 'Blue', value: '#dbeafe' },
        { name: 'Purple', value: '#f3e8ff' },
        { name: 'Pink', value: '#fce7f3' },
    ];

    if (!loaded) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-2)' }} />
            </div>
        );
    }

    const words = wc(body);

    return (
        <div className="max-w-[800px] mx-auto w-full px-6 sm:px-8 pb-32 pt-6 min-h-full flex flex-col" style={{ backgroundColor: color ? `${color}10` : 'transparent' }}>

            {/* ── Toolbar ── */}
            <div className="sticky top-0 z-40 -mx-6 px-6 sm:-mx-8 sm:px-8 py-4 flex items-center gap-3 mb-8 bg-[var(--bg)]/90 backdrop-blur-md"
                style={{
                    borderBottom: '1px solid var(--border-soft)',
                }}>

                <button onClick={() => router.push('/notes')}
                    className="text-[13px] transition-colors mr-1"
                    style={{ color: 'var(--text-3)' }}>
                    ← Notes
                </button>

                <div className="h-4 w-px" style={{ background: 'var(--border)' }} />

                <button onClick={() => setPreview(p => !p)}
                    className="px-3 py-1 rounded-lg text-[12px] font-medium transition-all"
                    style={preview
                        ? { background: 'var(--text-1)', color: 'var(--bg)' }
                        : { color: 'var(--text-3)' }}>
                    {preview ? 'Edit' : 'Preview'}
                </button>

                <div className="flex-1" />

                <div className="flex items-center gap-1 sm:gap-3">
                    {words > 0 && (
                        <span className="text-[11px] tabular-nums mr-1 sm:mr-0" style={{ color: 'var(--text-4)' }}>
                            {words.toLocaleString()} words
                        </span>
                    )}

                    <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--text-4)' }}>
                        {saving ? 'Saving…' : saved ? '✓ Saved' : ''}
                    </span>

                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-1">
                        {!isNew && (
                            <button
                                onClick={handleToggleStar}
                                title={currentNote?.starred ? 'Unstar' : 'Star'}
                                className={`p-2 rounded hover:bg-[var(--bg-muted)] transition-colors ${currentNote?.starred ? 'text-yellow-500' : 'text-[var(--text-4)] hover:text-[var(--text-2)]'}`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={currentNote?.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            </button>
                        )}

                        {!isNew && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    title="Color Note"
                                    className="p-2 rounded hover:bg-[var(--bg-muted)] transition-colors text-[var(--text-4)] hover:text-[var(--text-2)]"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2a10 10 0 1 0 10 10c0-5.52-4.48-10-10-10z" /></svg>
                                </button>
                                {showColorPicker && (
                                    <div className="absolute right-0 top-full mt-2 p-2 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl shadow-lg flex gap-1 z-50">
                                        {availableColors.map(c => (
                                            <button
                                                key={c.name}
                                                title={c.name}
                                                onClick={() => {
                                                    setNoteColor(c.value);
                                                    setShowColorPicker(false);
                                                    setColor(currentNote!.id, c.value);
                                                }}
                                                className="w-6 h-6 rounded-full border border-[var(--border-soft)] hover:scale-110 transition-transform"
                                                style={{ backgroundColor: c.value || 'var(--bg)' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!isNew && (
                            <button
                                onClick={handleToggleArchive}
                                title={currentNote?.archived ? 'Unarchive' : 'Archive'}
                                className={`p-2 rounded hover:bg-[var(--bg-muted)] transition-colors ${currentNote?.archived ? 'text-green-500' : 'text-[var(--text-4)] hover:text-[var(--text-2)]'}`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
                            </button>
                        )}

                        {!isNew && (
                            <Link href={`/graph/${noteId}`} title="View Graph" className="p-2 rounded hover:bg-[var(--bg-muted)] transition-colors text-[var(--text-4)] hover:text-[var(--text-2)]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                            </Link>
                        )}

                        {!isNew && (
                            <button
                                onClick={handleDelete}
                                title={currentNote?.trashed ? "Permanently Delete Note" : "Move to Trash"}
                                className="p-2 rounded hover:bg-red-500/10 transition-colors text-[var(--text-4)] hover:text-red-500"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                        )}
                    </div>

                    {/* Mobile Actions Menu */}
                    {!isNew && (
                        <div className="relative sm:hidden">
                            <button
                                onClick={() => setShowMobileActions(!showMobileActions)}
                                className="p-2 rounded hover:bg-[var(--bg-muted)] transition-colors text-[var(--text-2)]"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                            </button>

                            {showMobileActions && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMobileActions(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                                        style={{ animation: 'panelIn 150ms cubic-bezier(.22,1,.36,1)' }}>

                                        <button onClick={() => { handleToggleStar(); setShowMobileActions(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] hover:bg-[var(--bg-muted)] transition-colors">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill={currentNote?.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={currentNote?.starred ? 'text-yellow-500' : 'text-[var(--text-4)]'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            <span style={{ color: 'var(--text-2)' }}>{currentNote?.starred ? 'Unstar' : 'Star'}</span>
                                        </button>

                                        <div className="h-px bg-[var(--border-soft)] mx-2 my-1" />

                                        <div className="px-4 py-2 flex flex-wrap gap-2">
                                            {availableColors.map(c => (
                                                <button key={c.name} onClick={() => { setNoteColor(c.value); setColor(currentNote!.id, c.value); setShowMobileActions(false); }}
                                                    className="w-6 h-6 rounded-full border border-[var(--border-soft)]"
                                                    style={{ backgroundColor: c.value || 'var(--bg)' }} />
                                            ))}
                                        </div>

                                        <div className="h-px bg-[var(--border-soft)] mx-2 my-1" />

                                        <button onClick={() => { handleToggleArchive(); setShowMobileActions(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] hover:bg-[var(--bg-muted)] transition-colors">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={currentNote?.archived ? 'text-green-500' : 'text-[var(--text-4)]'}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
                                            <span style={{ color: 'var(--text-2)' }}>{currentNote?.archived ? 'Unarchive' : 'Archive'}</span>
                                        </button>

                                        <Link href={`/graph/${noteId}`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] hover:bg-[var(--bg-muted)] transition-colors">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-4)]"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                            <span style={{ color: 'var(--text-2)' }}>View Graph</span>
                                        </Link>

                                        <div className="h-px bg-[var(--border-soft)] mx-2 my-1" />

                                        <button onClick={() => { handleDelete(); setShowMobileActions(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] hover:bg-red-500/10 text-red-500 transition-colors">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            <span>{currentNote?.trashed ? 'Delete Forever' : 'Move to Trash'}</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* ── Title ── */}
            <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Note title"
                className="w-full font-serif text-[28px] sm:text-[42px] leading-[1.1] bg-transparent border-none outline-none mb-4 placeholder-[var(--border)]"
                style={{ color: 'var(--text-1)' }}
            />

            <div className="mb-8" style={{ height: '1px', background: 'var(--border-soft)' }} />

            {/* ── Body ── */}
            {preview ? (
                <div className="prose-editor whitespace-pre-wrap flex-1 text-[16px] leading-[1.7]" style={{ color: 'var(--text-2)' }}>
                    {body || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Nothing to preview</span>}
                </div>
            ) : (
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Start writing…"
                    className="prose-editor w-full bg-transparent border-none outline-none resize-none flex-1 text-[16px] leading-[1.7] placeholder-[var(--border)]"
                    style={{ color: 'var(--text-2)', minHeight: '60vh' }}
                />
            )}

            {/* ── Tags ── */}
            <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border-soft)' }}>
                <p className="text-[11px] uppercase tracking-[0.14em] font-medium mb-3" style={{ color: 'var(--text-3)' }}>
                    Tags
                </p>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {tags.map(t => (
                            <button key={t} onClick={() => removeTag(t)} className="tag-pill">
                                #{t} <span style={{ opacity: 0.5 }}>×</span>
                            </button>
                        ))}
                    </div>
                )}

                <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                            e.preventDefault(); addTag(tagInput);
                        }
                        if (e.key === 'Backspace' && !tagInput && tags.length) {
                            removeTag(tags[tags.length - 1]);
                        }
                    }}
                    placeholder="Add tag…"
                    className="input-base text-[12px] w-auto"
                    style={{ maxWidth: 200 }}
                />

                {autoTags.length > 0 && (
                    <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--text-4)' }}>
                            Suggestions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {autoTags.map((t: string) => (
                                <button key={t} onClick={() => addTag(t)} className="tag-pill" style={{ opacity: 0.75 }}>
                                    + #{t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
