import { create } from 'zustand';
import { Note, getAllNotes, saveNote, deleteNote } from './db';

export type { Note };

interface NotesStore {
    notes: Note[];
    loaded: boolean;
    load: () => Promise<void>;
    upsert: (note: Note) => Promise<void>;
    remove: (id: string) => Promise<void>;
    toggleStar: (id: string) => Promise<void>;
    toggleArchive: (id: string) => Promise<void>;
    moveToTrash: (id: string) => Promise<void>;
    restoreFromTrash: (id: string) => Promise<void>;
    setColor: (id: string, color: string | undefined) => Promise<void>;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
    notes: [],
    loaded: false,
    theme: 'light',

    setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('scribe-theme', theme);
        }
    },

    load: async () => {
        if (get().loaded) return;
        const notes = await getAllNotes();
        set({ notes, loaded: true });
    },

    upsert: async (note) => {
        await saveNote(note);
        const notes = await getAllNotes();
        set({ notes });
    },

    remove: async (id) => {
        await deleteNote(id);
        set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
    },

    toggleStar: async (id: string) => {
        const note = get().notes.find(n => n.id === id);
        if (note) {
            await get().upsert({ ...note, starred: !note.starred });
        }
    },

    toggleArchive: async (id: string) => {
        const note = get().notes.find(n => n.id === id);
        if (note) {
            await get().upsert({ ...note, archived: !note.archived });
        }
    },

    moveToTrash: async (id: string) => {
        const note = get().notes.find(n => n.id === id);
        if (note) {
            await get().upsert({ ...note, trashed: true });
        }
    },

    restoreFromTrash: async (id: string) => {
        const note = get().notes.find(n => n.id === id);
        if (note) {
            await get().upsert({ ...note, trashed: false });
        }
    },

    setColor: async (id: string, color: string | undefined) => {
        const note = get().notes.find(n => n.id === id);
        if (note) {
            await get().upsert({ ...note, color });
        }
    },
}));
