'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotesStore } from '@/lib/notesStore';
import type { Note } from '@/lib/notesStore';
import { ArrowLeft, Star, Palette, Archive, TreeStructure, Trash, DotsThree, CircleNotch, Plus, X } from '@phosphor-icons/react';

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
    const { notes, loaded, load, upsert, remove, toggleStar, toggleArchive, moveToTrash, restoreFromTrash, setColor: setStoreColor } = useNotesStore();

    const currentNote: Note | undefined = useMemo(() => notes.find((n: Note) => n.id === id), [notes, id]);

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [color, setNoteColor] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [preview, setPreview] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);

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
        setNoteColor(currentNote.color);
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
        { name: 'Rose', value: 'var(--bg-rose)' },
        { name: 'Peach', value: 'var(--bg-peach)' },
        { name: 'Sage', value: 'var(--bg-sage)' },
        { name: 'Sky', value: 'var(--bg-sky)' },
        { name: 'Lavender', value: 'var(--bg-lavender)' },
    ];

    if (!loaded) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <CircleNotch size={24} className="animate-spin text-[var(--ink)] opacity-50" />
            </div>
        );
    }

    const words = wc(body);

    return (
        <main className="flex-1 h-full overflow-y-auto no-scrollbar scroll-smooth">
            <div className="max-w-[800px] mx-auto w-full px-6 sm:px-8 pb-32 pt-6 min-h-full flex flex-col transition-colors duration-500 rounded-[var(--radius-xl)] bg-transparent md:bg-white md:shadow-[0_4px_24px_rgba(62,56,56,0.05)] md:my-6 relative border border-transparent md:border-[var(--border-soft)]"
                style={{ backgroundColor: color || 'transparent' }}>

                {/* Absolute color blend layer for mobile */}
                <div className="md:hidden fixed inset-0 -z-10 transition-colors duration-500 pointer-events-none" style={{ backgroundColor: color || 'var(--bg-app)' }} />

                {/* ── Toolbar ── */}
                <div className="sticky top-0 z-40 -mx-6 px-6 sm:-mx-8 sm:px-8 py-4 flex items-center gap-3 mb-8 bg-white/40 backdrop-blur-xl border-b border-[var(--border-soft)] rounded-t-[calc(var(--radius-xl)-1px)]">

                    <button onClick={() => router.push('/notes')}
                        className="flex items-center gap-1.5 text-[14px] font-medium transition-colors mr-1 text-[var(--ink)] opacity-60 hover:opacity-100">
                        <ArrowLeft size={16} weight="bold" />
                        Notes
                    </button>

                    <div className="h-4 w-px bg-[var(--border)] opacity-50" />

                    <button onClick={() => setPreview(p => !p)}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all ${preview ? 'bg-[var(--ink)] text-white shadow-md' : 'text-[var(--ink-dim)] hover:bg-white/50 hover:text-[var(--ink)]'}`}>
                        {preview ? 'Edit' : 'Preview'}
                    </button>

                    <div className="flex-1" />

                    <div className="flex items-center gap-1 sm:gap-2">
                        {words > 0 && (
                            <span className="text-[12px] tabular-nums mr-2 font-medium text-[var(--ink-dim)]">
                                {words.toLocaleString()} words
                            </span>
                        )}

                        <span className="text-[12px] hidden sm:inline font-medium text-[var(--ink-dim)] min-w-[50px] text-right mr-2">
                            {saving ? 'Saving…' : saved ? '✓ Saved' : ''}
                        </span>

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex items-center gap-1">
                            {!isNew && (
                                <button
                                    onClick={handleToggleStar}
                                    title={currentNote?.starred ? 'Unstar' : 'Star'}
                                    className={`p-2.5 rounded-full transition-colors ${currentNote?.starred ? 'text-yellow-500 bg-yellow-50 font-bold hover:bg-yellow-100' : 'text-[var(--ink)] opacity-50 hover:opacity-100 hover:bg-white/50'}`}
                                >
                                    <Star size={20} weight={currentNote?.starred ? "fill" : "regular"} />
                                </button>
                            )}

                            {!isNew && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        title="Background Color"
                                        className="p-2.5 rounded-full transition-colors text-[var(--ink)] opacity-50 hover:opacity-100 hover:bg-white/50"
                                    >
                                        <Palette size={20} weight="regular" />
                                    </button>
                                    {showColorPicker && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                                            <div className="absolute right-0 top-full mt-2 p-3 bg-white border border-[var(--border-soft)] rounded-[var(--radius-lg)] shadow-[0_12px_24px_-10px_rgba(62,56,56,0.15)] flex gap-2 z-50 animate-in fade-in slide-in-from-top-2">
                                                {availableColors.map(c => (
                                                    <button
                                                        key={c.name}
                                                        title={c.name}
                                                        onClick={() => {
                                                            setNoteColor(c.value);
                                                            setShowColorPicker(false);
                                                            useNotesStore.getState().setColor(currentNote!.id, c.value);
                                                        }}
                                                        className="w-8 h-8 rounded-full border border-black/5 hover:scale-110 transition-transform shadow-sm flex justify-center items-center"
                                                        style={{ backgroundColor: c.value || '#fff' }}
                                                    >
                                                        {color === c.value && <div className="w-2 h-2 rounded-full bg-black/30" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {!isNew && (
                                <button
                                    onClick={handleToggleArchive}
                                    title={currentNote?.archived ? 'Unarchive' : 'Archive'}
                                    className={`p-2.5 rounded-full transition-colors ${currentNote?.archived ? 'text-[var(--ink)] bg-[var(--bg-muted)] font-bold' : 'text-[var(--ink)] opacity-50 hover:opacity-100 hover:bg-white/50'}`}
                                >
                                    <Archive size={20} weight={currentNote?.archived ? "fill" : "regular"} />
                                </button>
                            )}

                            {!isNew && (
                                <Link href={`/graph/${noteId}`} title="View Graph" className="p-2.5 rounded-full transition-colors text-[var(--ink)] opacity-50 hover:opacity-100 hover:bg-white/50">
                                    <TreeStructure size={20} weight="regular" />
                                </Link>
                            )}

                            {!isNew && (
                                <button
                                    onClick={handleDelete}
                                    title={currentNote?.trashed ? "Permanently Delete Note" : "Move to Trash"}
                                    className="p-2.5 rounded-full transition-colors text-[var(--ink-dim)] hover:text-red-600 hover:bg-red-500/10 ml-1"
                                >
                                    <Trash size={20} weight="regular" />
                                </button>
                            )}
                        </div>

                        {/* Mobile Actions Menu */}
                        {!isNew && (
                            <div className="relative sm:hidden">
                                <button
                                    onClick={() => setShowMobileActions(!showMobileActions)}
                                    className="p-2 rounded-full hover:bg-white/50 transition-colors text-[var(--ink)] bg-white/40 shadow-sm border border-black/5"
                                >
                                    <DotsThree size={24} weight="bold" />
                                </button>

                                {showMobileActions && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMobileActions(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[var(--border-soft)] rounded-[var(--radius-lg)] shadow-[0_12px_24px_-10px_rgba(62,56,56,0.15)] p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">

                                            <button onClick={() => { handleToggleStar(); setShowMobileActions(false); }}
                                                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-[14px] font-medium hover:bg-[var(--bg-muted)] transition-colors">
                                                <Star size={18} weight={currentNote?.starred ? "fill" : "bold"} className={currentNote?.starred ? 'text-yellow-500' : 'text-[var(--ink-dim)]'} />
                                                <span style={{ color: 'var(--ink)' }}>{currentNote?.starred ? 'Unstar' : 'Star'}</span>
                                            </button>

                                            <div className="h-px bg-[var(--border-soft)] mx-2 my-1" />

                                            <div className="px-4 py-3 pb-2 flex flex-col gap-2">
                                                <span className="text-[11px] font-semibold text-[var(--ink-dim)] uppercase tracking-wider">Color Style</span>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {availableColors.map(c => (
                                                        <button key={c.name} onClick={() => { setNoteColor(c.value); useNotesStore.getState().setColor(currentNote!.id, c.value); setShowMobileActions(false); }}
                                                            className="w-7 h-7 rounded-full border border-black/5 shadow-sm"
                                                            style={{ backgroundColor: c.value || '#fff' }} />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="h-px bg-[var(--border-soft)] mx-2 my-1" />

                                            <button onClick={() => { handleToggleArchive(); setShowMobileActions(false); }}
                                                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-[14px] font-medium hover:bg-[var(--bg-muted)] transition-colors">
                                                <Archive size={18} weight={currentNote?.archived ? "fill" : "bold"} className={currentNote?.archived ? 'text-[var(--ink)]' : 'text-[var(--ink-dim)]'} />
                                                <span style={{ color: 'var(--ink)' }}>{currentNote?.archived ? 'Unarchive' : 'Archive'}</span>
                                            </button>

                                            <Link href={`/graph/${noteId}`} className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-[14px] font-medium hover:bg-[var(--bg-muted)] transition-colors">
                                                <TreeStructure size={18} weight="bold" className="text-[var(--ink-dim)]" />
                                                <span style={{ color: 'var(--ink)' }}>View Graph</span>
                                            </Link>

                                            <div className="h-px bg-[var(--border-soft)] mx-2 my-1" />

                                            <button onClick={() => { handleDelete(); setShowMobileActions(false); }}
                                                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-[14px] font-medium hover:bg-red-500/10 text-red-600 transition-colors">
                                                <Trash size={18} weight="bold" />
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
                    className="w-full font-serif text-[36px] sm:text-[48px] leading-[1.15] font-semibold bg-transparent border-none outline-none mb-8 placeholder-[var(--ink-light)]"
                    style={{ color: 'var(--ink)' }}
                />

                <div className="mb-8" style={{ height: '1px', background: 'var(--border-soft)' }} />

                {/* ── Body ── */}
                {preview ? (
                    <div className="prose-editor whitespace-pre-wrap flex-1 text-[17px] leading-[1.8]" style={{ color: 'var(--ink)' }}>
                        {body || <span style={{ color: 'var(--ink-dim)', fontStyle: 'italic' }}>Nothing to preview</span>}
                    </div>
                ) : (
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Start writing…"
                        className="prose-editor w-full bg-transparent border-none outline-none resize-none flex-1 text-[17px] leading-[1.8] placeholder-[var(--ink-light)]"
                        style={{ color: 'var(--ink)', minHeight: '50vh' }}
                    />
                )}

                {/* ── Tags ── */}
                <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border-soft)' }}>
                    <p className="text-[12px] uppercase tracking-[0.08em] font-semibold mb-4" style={{ color: 'var(--ink-dim)' }}>
                        Collections & Tags
                    </p>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {tags.map(t => (
                                <button key={t} onClick={() => removeTag(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-black/5 text-[13px] font-medium text-[var(--ink)] hover:bg-white/60 transition-colors shadow-sm">
                                    {t} <X size={12} weight="bold" className="opacity-50 hover:opacity-100" />
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
                        className="w-auto min-w-[120px] bg-white/40 backdrop-blur-sm border border-[var(--border-soft)] rounded-full px-4 py-2 text-[13px] font-medium text-[var(--ink)] placeholder-[var(--ink-dim)] outline-none focus:border-[var(--ink-dim)] transition-colors shadow-sm"
                    />

                    {autoTags.length > 0 && (
                        <div className="mt-6">
                            <p className="text-[12px] uppercase tracking-[0.08em] font-semibold mb-3" style={{ color: 'var(--ink-dim)' }}>
                                Suggestions
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {autoTags.map((t: string) => (
                                    <button key={t} onClick={() => addTag(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-transparent border border-[var(--border-soft)] text-[13px] font-medium text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--ink-dim)] transition-colors border-dashed">
                                        <Plus size={12} weight="bold" /> {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
